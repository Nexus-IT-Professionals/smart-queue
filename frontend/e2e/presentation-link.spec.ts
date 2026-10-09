import {
  test,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { spanish } from "../src/i18n/catalog";

// The sidebar "Press for presentation" link: a named, centered popup on
// desktop, a plain new tab on narrow screens or when popups are blocked, and
// the demo tab keeps its state. Every page in the context (app + presentation)
// must load without console errors, failed requests, or HTTP errors.
const NAME = "smart-queue-presentation";
type Lang = "en" | "es";
const tr = (lang: Lang, text: string) =>
  lang === "es" ? (spanish[text] ?? text) : text;

function watch(context: BrowserContext) {
  const problems: string[] = [];
  const responses: string[] = [];
  const track = (page: Page) => {
    page.on("console", (message) => {
      if (message.type() === "error")
        problems.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  };
  context.pages().forEach(track);
  context.on("page", track);
  context.on("requestfailed", (request) =>
    problems.push(`failed: ${request.url()} ${request.failure()?.errorText}`),
  );
  context.on("response", (response) => {
    responses.push(new URL(response.url()).pathname);
    if (response.status() >= 400)
      problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return { problems, responses };
}

// Records window.open calls, then defers to the real one (or a blocker).
async function spyOnOpen(page: Page, block = false) {
  await page.addInitScript((blocked) => {
    const calls: string[][] = [];
    (window as unknown as { __opens: string[][] }).__opens = calls;
    const original = window.open.bind(window);
    window.open = (...args: Parameters<typeof window.open>) => {
      calls.push(args.map(String));
      return blocked ? null : original(...args);
    };
  }, block);
}
const opens = (page: Page) =>
  page.evaluate(() => (window as unknown as { __opens: string[][] }).__opens);

async function unobstructed(link: Locator) {
  const hit = await link.evaluate((el) => {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const box = el.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    const top = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    return {
      ok:
        box.width > 0 &&
        box.height > 0 &&
        box.left >= -1 &&
        box.top >= -1 &&
        box.right <= clientWidth + 1 &&
        box.bottom <= clientHeight + 1 &&
        !!top &&
        (top === el || el.contains(top)),
      box: [box.left, box.top, box.right, box.bottom].map(Math.round),
      hit: top ? `${top.tagName}.${top.getAttribute("class") ?? ""}` : "none",
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth,
    };
  });
  expect(hit.ok, JSON.stringify(hit)).toBe(true);
  expect(hit.scrollWidth, JSON.stringify(hit)).toBeLessThanOrEqual(
    hit.clientWidth + 1,
  );
}

async function start(page: Page, lang: Lang) {
  await page.goto("/#/demo");
  if (lang === "es") {
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  }
  return page
    .getByRole("complementary", { name: tr(lang, "Workspace sidebar") })
    .getByRole("link", { name: tr(lang, "Press for presentation") });
}

// The link sits in every workspace, right below the navigation.
async function checkEveryWorkspace(page: Page, lang: Lang, link: Locator) {
  const views = page.getByRole("group", { name: tr(lang, "Demo workspace") });
  for (const view of ["Demo access", "Provider view", "Patient view"]) {
    await views.getByRole("button", { name: tr(lang, view), exact: true }).click();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "presentation/index.html");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener");
    await unobstructed(link);
    const below = await page.evaluate(() => {
      const nav = document.querySelector(".sidebar nav")?.getBoundingClientRect();
      const link = document
        .querySelector(".presentation-link")
        ?.getBoundingClientRect();
      return !!nav && !!link && link.top >= nav.bottom - 1;
    });
    expect(below, `${view}: link below the navigation`).toBe(true);
  }
}

async function expectFirstSlide(deck: Page) {
  await expect(deck).toHaveURL(/\/presentation\/index\.html$/);
  await expect(deck.locator("#title-1")).toBeVisible();
  await expect(deck.locator("#title-1")).toContainText("One opening.");
  await expect(deck.locator("#counter")).toHaveText(/^1 \/ \d+$/);
  // Icons resolve (no implicit /favicon.ico fallback needed).
  const icon = await deck.evaluate(
    () => (document.querySelector('link[rel="icon"]') as HTMLLinkElement)?.href,
  );
  expect(icon).toMatch(/\/favicon\.svg$/);
  expect((await deck.request.get(icon)).status()).toBe(200);
}

for (const lang of ["en", "es"] as const) {
  test.describe(`desktop (${lang})`, () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test(`opens a centered, named popup and keeps the demo state (${lang})`, async ({
      page,
      context,
    }) => {
      const { problems, responses } = watch(context);
      await spyOnOpen(page);
      const link = await start(page, lang);
      await checkEveryWorkspace(page, lang, link);
      const appIcon = await page.evaluate(
        () =>
          (document.querySelector('link[rel="icon"]') as HTMLLinkElement)?.href,
      );
      expect(appIcon).toMatch(/\/favicon\.svg$/);
      expect((await page.request.get(appIcon)).status()).toBe(200);

      // Demo state in progress: a confirmed cancellation on the provider view.
      await page
        .getByRole("group", { name: tr(lang, "Demo workspace") })
        .getByRole("button", { name: tr(lang, "Provider view"), exact: true })
        .click();
      await page
        .getByRole("button", {
          name: tr(lang, "Confirm demo cancellation"),
          exact: true,
        })
        .click();
      const next = page.getByRole("button", {
        name: tr(lang, "Send demo offer to José"),
        exact: true,
      });
      await expect(next).toBeVisible();
      const url = page.url();

      const [deck] = await Promise.all([
        page.waitForEvent("popup"),
        link.click(),
      ]);
      await expectFirstSlide(deck);

      const calls = await opens(page);
      expect(calls).toHaveLength(1);
      const [target, name, features] = calls[0];
      expect(target).toMatch(/^http:\/\/127\.0\.0\.1:4175\/presentation\/index\.html$/);
      expect(name).toBe(NAME);
      const expected = await page.evaluate(() => {
        const width = Math.round(Math.min(1280, screen.availWidth * 0.9));
        const height = Math.round(Math.min(800, screen.availHeight * 0.9));
        return {
          width,
          height,
          left: Math.round(screenX + (outerWidth - width) / 2),
          top: Math.round(screenY + (outerHeight - height) / 2),
        };
      });
      const parsed = Object.fromEntries(
        features.split(",").map((pair) => pair.split("=")),
      );
      expect("popup" in parsed, features).toBe(true);
      expect(Number(parsed.width)).toBe(expected.width);
      expect(Number(parsed.height)).toBe(expected.height);
      // Centered: equal margins either side of the demo window.
      expect(Number(parsed.left), features).toBe(expected.left);
      expect(Number(parsed.top), features).toBe(expected.top);
      expect(expected.width).toBeLessThanOrEqual(1280);

      // The demo tab did not navigate and kept its scenario state.
      expect(page.url()).toBe(url);
      await expect(next).toBeVisible();

      // A second click reuses (and focuses) the same named window.
      await link.click();
      await expect.poll(async () => (await opens(page)).length).toBe(2);
      await expect.poll(() => context.pages().length).toBe(2);
      await expectFirstSlide(deck);
      await expect(next).toBeVisible();

      expect(responses).toContain("/presentation/index.html");
      expect(problems).toEqual([]);
    });

    test(`keyboard opens it too, and a blocked popup falls back to a new tab (${lang})`, async ({
      page,
      context,
    }) => {
      const { problems } = watch(context);
      await spyOnOpen(page, true);
      const link = await start(page, lang);
      await link.focus();
      const [tab] = await Promise.all([
        context.waitForEvent("page"),
        page.keyboard.press("Enter"),
      ]);
      expect(await opens(page)).toHaveLength(1);
      await expectFirstSlide(tab);
      await expect(page).toHaveURL(/#\/demo$/);
      expect(problems).toEqual([]);
    });
  });
}

for (const width of [320, 375]) {
  for (const lang of ["en", "es"] as const) {
    test.describe(`${width}px (${lang})`, () => {
      test.use({ viewport: { width, height: 800 } });

      test(`link fits and opens a plain new tab at ${width}px (${lang})`, async ({
        page,
        context,
      }) => {
        const { problems } = watch(context);
        await spyOnOpen(page);
        const link = await start(page, lang);
        await checkEveryWorkspace(page, lang, link);
        const url = page.url();
        const [tab] = await Promise.all([
          context.waitForEvent("page"),
          link.click(),
        ]);
        // No popup features on narrow screens: the anchor's own new tab.
        expect(await opens(page)).toEqual([]);
        await expectFirstSlide(tab);
        expect(page.url()).toBe(url);
        expect(problems).toEqual([]);
      });
    });
  }
}
