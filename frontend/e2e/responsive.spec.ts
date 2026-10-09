import { test, expect, type Locator, type Page } from "@playwright/test";
import { spanish } from "../src/i18n/catalog";
async function fits(page: Page) {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: [...document.querySelectorAll("body *")]
      .filter(
        (el) =>
          !el.closest(".table-scroll") &&
          el.getBoundingClientRect().right >
            document.documentElement.clientWidth + 1,
      )
      .map((el) => `${el.tagName}.${el.className}`),
  }));
  expect(sizes.page, JSON.stringify(sizes)).toBeLessThanOrEqual(
    sizes.viewport + 1,
  );
  expect(sizes.body, JSON.stringify(sizes)).toBeLessThanOrEqual(
    sizes.viewport + 1,
  );
}
// Reachable is not enough: after scrolling each control into view, it must sit
// fully inside the viewport and its center must hit-test to the control (or a
// descendant), so nothing else covers or clips it. Scrolling and measuring
// happen in one evaluateAll (scrollIntoView with block "nearest" is what
// Playwright's scrollIntoViewIfNeeded does) to keep one round trip per check.
async function unobstructed(controls: Locator, count: number, label: string) {
  const hits = await controls.evaluateAll((els) =>
    els.map((el) => {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
      const box = el.getBoundingClientRect();
      const { clientWidth, clientHeight } = document.documentElement;
      const top = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      return {
        control: el.textContent?.trim(),
        ok:
          box.width > 0 &&
          box.height > 0 &&
          box.left >= -1 &&
          box.top >= -1 &&
          box.right <= clientWidth + 1 &&
          box.bottom <= clientHeight + 1 &&
          !!top &&
          (top === el || el.contains(top)),
        hit: top ? `${top.tagName}.${top.getAttribute("class") ?? ""}` : "none",
        box: [box.left, box.top, box.right, box.bottom].map(Math.round),
        viewport: [clientWidth, clientHeight],
      };
    }),
  );
  expect(hits.length, `${label}: expected ${count} controls`).toBe(count);
  for (const hit of hits)
    expect(hit.ok, `${label}: ${JSON.stringify(hit)}`).toBe(true);
}
// Window sizes. The deviceScaleFactor 2 cases emulate 200% browser zoom on
// 1280×900 and 1024×768 windows (half the CSS pixels, double the density).
const cases = [
  ...[320, 375, 768, 1024, 1440].map((width) => ({
    name: `${width}px`,
    width,
    height: 900,
    scale: 1,
  })),
  { name: "200% zoom of 1280px", width: 640, height: 450, scale: 2 },
  { name: "200% zoom of 1024px", width: 512, height: 384, scale: 2 },
  { name: "landscape 667x375", width: 667, height: 375, scale: 1 },
  { name: "landscape 568x320", width: 568, height: 320, scale: 1 },
];
for (const { name, width, height, scale } of cases) {
  test.describe(name, () => {
    test.use({ viewport: { width, height }, deviceScaleFactor: scale });
    for (const lang of ["en", "es"] as const) {
      test(`public workflow fits ${name} (${lang}) with unobstructed controls`, async ({
        page,
      }) => {
        const t = (text: string) =>
          lang === "es" ? (spanish[text] ?? text) : text;
        const button = (text: string) =>
          page.getByRole("button", { name: t(text), exact: true });
        // Page fits, and role switch, language, reset and the current
        // scenario step stay visible and uncovered.
        async function checkpoint(primary?: string, reset = true) {
          await fits(page);
          let controls = page
            .getByRole("group", { name: t("Demo workspace") })
            .getByRole("button")
            .or(page.getByRole("button", { name: "English", exact: true }))
            .or(page.getByRole("button", { name: "Español", exact: true }));
          if (reset) controls = controls.or(button("Reset demo scenario"));
          if (primary) controls = controls.or(button(primary));
          await unobstructed(
            controls,
            5 + Number(reset) + Number(!!primary),
            `${name} ${lang} step ${primary}`,
          );
        }
        const shot = (state: string) =>
          page.screenshot({
            path: test
              .info()
              .outputPath(`${state}-${width}x${height}-${lang}.png`),
            fullPage: true,
          });
        await page.goto("/#/demo");
        if (lang === "es") {
          await button("Español").click();
          await expect(page.locator("html")).toHaveAttribute("lang", "es");
        }
        await checkpoint("Continue as Demo Provider", false);
        await button("Continue as Demo Provider").click();
        await checkpoint("Confirm demo cancellation");
        const nav = page.getByRole("navigation", { name: t("Main navigation") });
        for (const section of [
          "Schedule",
          "Waitlist",
          "Activity log",
          "Overview",
        ]) {
          await nav
            .getByRole("button", { name: new RegExp(`^${t(section)}`) })
            .click();
          await checkpoint();
        }
        if (width <= 375) {
          const table = page.getByRole("region", {
            name: t("Daily appointments"),
          });
          await table.focus();
          await page.keyboard.press("ArrowRight");
          await expect
            .poll(() => table.evaluate((el) => el.scrollLeft))
            .toBeGreaterThan(0);
          await fits(page);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await shot("provider");
        await checkpoint("Confirm demo cancellation");
        await button("Confirm demo cancellation").click();
        await checkpoint("Send demo offer to José");
        await button("Send demo offer to José").click();
        await checkpoint();
        await button("Patient view").click();
        await checkpoint("Accept earlier visit");
        await button("Accept earlier visit").click();
        await checkpoint("Yes, move my appointment");
        await button("Yes, move my appointment").click();
        await expect(
          page.getByRole("heading", {
            name: lang === "es" ? "jueves, 8 de octubre" : "Thursday, October 8",
            exact: true,
          }),
        ).toBeVisible();
        await checkpoint();
        await button("Reset demo scenario").click();
        await expect(
          page.getByRole("heading", { name: t("No earlier offer yet") }),
        ).toBeVisible();
        await checkpoint();
        await page.evaluate(() => window.scrollTo(0, 0));
        await shot("patient");
      });
    }
  });
}
