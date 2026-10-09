import { test, expect, type Locator, type Page } from "@playwright/test";

// UX-3: user display preferences (forced colors, text spacing, reduced motion)
// and WCAG 2.2 focus-not-obscured. Class locators keep each flow
// language-independent so the same steps run in English and Spanish.
const moved = {
  en: "Demo appointment moved",
  es: "Cita demo adelantada",
} as const;
type Language = keyof typeof moved;
const languages = Object.keys(moved) as Language[];

async function open(page: Page, language: Language) {
  await page.goto("/#/demo");
  if (language === "es")
    await page.getByRole("button", { name: "Español", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", language);
}
const roleButton = (page: Page, index: number) =>
  page.locator(".workspace-switch button").nth(index);
const scenarioButton = (page: Page) =>
  page.locator(".demo-scenario-actions button");

// Provider confirms the cancellation and sends the offer; patient accepts.
async function completeWorkflow(page: Page, language: Language) {
  await roleButton(page, 1).click();
  await scenarioButton(page).click();
  await scenarioButton(page).click();
  await roleButton(page, 2).click();
  await page.locator(".offer-actions .primary-button").click();
  await page.locator(".confirmation .primary-button").click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    moved[language],
  );
}

test.describe("forced colors (Windows High Contrast)", () => {
  test.use({ forcedColors: "active" });
  // What a forced palette leaves visible: system colors chosen via
  // forced-color-adjust, borders, outlines, text decoration and weight. The
  // background is the painted one: Chromium keeps author alpha, so a
  // transparent button over Canvas looks identical to an opaque Canvas one.
  function signature(control: Locator, countWeight = true) {
    return control.evaluate((el, countWeight) => {
      const s = getComputedStyle(el);
      let painted: Element | null = el;
      while (
        painted &&
        /rgba\(.*, 0\)$|transparent/.test(
          getComputedStyle(painted).backgroundColor,
        )
      )
        painted = painted.parentElement;
      return [
        painted ? getComputedStyle(painted).backgroundColor : "Canvas",
        s.color,
        `${s.borderTopStyle} ${s.borderTopWidth}`,
        `${s.outlineStyle} ${s.outlineWidth}`,
        s.textDecorationLine,
        countWeight ? s.fontWeight : "",
      ].join(" | ");
    }, countWeight);
  }
  // countWeight=false demands a cue stronger than bold text alone (used for the
  // provider nav, whose current page is otherwise only bolder in forced colors).
  async function distinguishable(
    group: Locator,
    label: string,
    countWeight = true,
  ) {
    const selected = group.locator('[aria-pressed="true"], [aria-current]');
    const unselected = group.locator(
      'button:not([aria-pressed="true"]):not([aria-current])',
    );
    await expect(selected, label).toHaveCount(1);
    expect(await unselected.count(), label).toBeGreaterThan(0);
    const on = await signature(selected, countWeight);
    for (const off of await unselected.all())
      expect(
        await signature(off, countWeight),
        `${label}: selected looks unselected`,
      ).not.toBe(
        on,
      );
  }
  async function bordered(button: Locator, label: string) {
    const border = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.borderTopStyle, width: s.borderTopWidth };
    });
    expect(border.style, `${label} has no boundary`).not.toBe("none");
    expect(Number.parseFloat(border.width), label).toBeGreaterThanOrEqual(1);
  }
  async function focusRing(page: Page, control: Locator, label: string) {
    await control.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(control, label).toBeFocused();
    const ring = await control.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(ring.style, `${label} focus ring`).not.toBe("none");
    expect(Number.parseFloat(ring.width), label).toBeGreaterThanOrEqual(2);
  }
  for (const language of languages) {
    test(`selected states, buttons and focus stay visible (${language})`, async ({
      page,
    }, testInfo) => {
      await open(page, language);
      expect(
        await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
      ).toBe(true);
      await distinguishable(page.locator(".workspace-switch"), "role switch");
      await distinguishable(page.locator(".language-switch"), "language");
      await roleButton(page, 1).click();
      await distinguishable(page.locator(".workspace-switch"), "role switch");
      await distinguishable(page.getByRole("navigation"), "provider nav", false);
      await bordered(scenarioButton(page), "primary button");
      await focusRing(page, roleButton(page, 1), "selected role");
      await focusRing(page, roleButton(page, 2), "unselected role");
      await focusRing(page, scenarioButton(page), "primary button");
      await page.screenshot({
        path: testInfo.outputPath(`forced-colors-provider-${language}.png`),
        fullPage: true,
      });
      await scenarioButton(page).click();
      await scenarioButton(page).click();
      await roleButton(page, 2).click();
      await distinguishable(page.locator(".workspace-switch"), "role switch");
      await bordered(
        page.locator(".offer-actions .primary-button"),
        "primary button",
      );
      await bordered(
        page.locator(".offer-actions .secondary-button"),
        "secondary button",
      );
      await focusRing(
        page,
        page.locator(".offer-actions .secondary-button"),
        "secondary button",
      );
      await page.screenshot({
        path: testInfo.outputPath(`forced-colors-patient-${language}.png`),
        fullPage: true,
      });
      await page.locator(".offer-actions .primary-button").click();
      await page.locator(".confirmation .primary-button").click();
      await expect(page.locator('[aria-live="polite"]')).toContainText(
        moved[language],
      );
    });
  }
});

// WCAG 1.4.12 bookmarklet values.
const textSpacing = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important; }
  p { margin-bottom: 2em !important; }`;
async function notClipped(page: Page, state: string) {
  const report = await page.evaluate(() => {
    const { clientWidth, scrollWidth } = document.documentElement;
    // Key controls and headings must not overflow their own box. A clipping
    // container must not cut off any content that is exposed to users;
    // aria-hidden decoration (e.g. the large "+" in the opportunity card) is
    // allowed to bleed out by design.
    const clipped = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => {
        if (el.closest(".sr-only, .table-scroll") || !el.offsetParent)
          return false;
        if (
          el.matches("button, h1, h2, h3, a, label, input") &&
          el.scrollWidth > el.clientWidth + 1
        )
          return true;
        const s = getComputedStyle(el);
        if (!/hidden|clip/.test(`${s.overflowX} ${s.overflowY}`)) return false;
        const box = el.getBoundingClientRect();
        return [...el.querySelectorAll("*")].some((child) => {
          if (child.closest('[aria-hidden="true"], .sr-only, .table-scroll *'))
            return false;
          const r = child.getBoundingClientRect();
          return (
            r.width > 0 &&
            (r.left < box.left - 1 ||
              r.top < box.top - 1 ||
              r.right > box.right + 1 ||
              r.bottom > box.bottom + 1)
          );
        });
      })
      .map(
        (el) =>
          `${el.tagName}.${el.getAttribute("class") ?? ""} ${el.scrollWidth}x${el.scrollHeight}>${el.clientWidth}x${el.clientHeight}`,
      );
    return { clientWidth, scrollWidth, clipped };
  });
  expect(report.clipped, `${state}: clipped text`).toEqual([]);
  expect(report.scrollWidth, `${state}: page overflow`).toBeLessThanOrEqual(
    report.clientWidth + 1,
  );
}
for (const width of [320, 1280]) {
  test.describe(`text spacing at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const language of languages) {
      test(`controls and headings are not clipped (${language})`, async ({
        page,
      }) => {
        await open(page, language);
        await page.addStyleTag({ content: textSpacing });
        expect(
          await page.evaluate(
            () => getComputedStyle(document.body).wordSpacing,
          ),
        ).not.toBe("0px");
        await notClipped(page, "entry");
        await roleButton(page, 1).click();
        for (const index of [1, 2, 3, 0]) {
          await page.getByRole("navigation").getByRole("button").nth(index).click();
          await notClipped(page, `provider section ${index}`);
        }
        await scenarioButton(page).click();
        await scenarioButton(page).click();
        await notClipped(page, "offer sent");
        await roleButton(page, 2).click();
        await notClipped(page, "patient offer");
        await page.locator(".offer-actions .primary-button").click();
        await notClipped(page, "confirmation");
        await page.locator(".confirmation .primary-button").click();
        await expect(page.locator('[aria-live="polite"]')).toContainText(
          moved[language],
        );
        await notClipped(page, "accepted");
      });
    }
  });
}

// Longest running animation or transition anywhere in the document, in seconds.
function longestMotion(page: Page) {
  return page.evaluate(() => {
    const seconds = (value: string) =>
      Math.max(
        0,
        ...value
          .split(",")
          .map((v) =>
            v.trim().endsWith("ms")
              ? Number.parseFloat(v) / 1000
              : Number.parseFloat(v),
          ),
      );
    const transitions = [...document.querySelectorAll("body *")].map((el) => {
      const s = getComputedStyle(el);
      return {
        el: `${el.tagName}.${el.getAttribute("class") ?? ""}`,
        s: s.transitionProperty === "none" ? 0 : seconds(s.transitionDuration),
      };
    });
    const animations = document.getAnimations().map((a) => ({
      el: "animation",
      s: Number(a.effect?.getTiming().duration ?? 0) / 1000,
    }));
    return [...transitions, ...animations].reduce(
      (max, item) => (item.s > max.s ? item : max),
      { el: "none", s: 0 },
    );
  });
}
test("motion check detects transitions when no preference is set", async ({
  page,
}) => {
  // Guards the reduced-motion test against passing because nothing animates.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#/provider");
  expect((await longestMotion(page)).s).toBeGreaterThan(0.01);
});
test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  for (const language of languages) {
    test(`no animation or transition outlasts 0.01s (${language})`, async ({
      page,
    }) => {
      await open(page, language);
      expect(
        await page.evaluate(
          () => matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      ).toBe(true);
      const check = async (state: string) =>
        expect((await longestMotion(page)).s <= 0.01, state).toBe(true);
      await check("entry");
      await roleButton(page, 1).hover();
      await check("hover role");
      await roleButton(page, 1).click();
      await scenarioButton(page).hover();
      await check("hover primary");
      await page.getByRole("navigation").getByRole("button").nth(1).click();
      await check("schedule");
      await page.getByRole("navigation").getByRole("button").nth(0).click();
      await completeWorkflow(page, language);
      await check("accepted");
    });
  }
});

// WCAG 2.4.11: every control reached by Tab is at least partly on screen and
// the center of its visible part hit-tests to the control, not a cover.
async function focusWalk(page: Page, state: string) {
  await page.locator(".skip-link").focus();
  const results: { name: string; ok: boolean; detail: string }[] = [];
  for (let i = 0; i < 120; i++) {
    const result = await page.evaluate((first) => {
      const el = document.activeElement as HTMLElement | null;
      // Stop once focus leaves the page or wraps back to the skip link.
      if (!el || el === document.body || (!first && el.matches(".skip-link")))
        return null;
      const box = el.getBoundingClientRect();
      const { clientWidth, clientHeight } = document.documentElement;
      const left = Math.max(box.left, 0);
      const right = Math.min(box.right, clientWidth);
      const top = Math.max(box.top, 0);
      const bottom = Math.min(box.bottom, clientHeight);
      const visible = right - left > 0 && bottom - top > 0;
      const hit = visible
        ? document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
        : null;
      return {
        name: `${el.tagName}.${el.getAttribute("class") ?? ""} "${el.textContent?.trim().slice(0, 30)}"`,
        ok: visible && !!hit && (hit === el || el.contains(hit)),
        detail: `box ${[box.left, box.top, box.right, box.bottom].map(Math.round)} hit ${hit ? `${hit.tagName}.${hit.getAttribute("class") ?? ""}` : "none"}`,
      };
    }, i === 0);
    if (!result) break;
    results.push(result);
    await page.keyboard.press("Tab");
  }
  expect(results.length, `${state}: focus walk`).toBeGreaterThan(5);
  expect(
    results.filter((r) => !r.ok).map((r) => `${r.name} ${r.detail}`),
    `${state}: obscured focus`,
  ).toEqual([]);
}
for (const { width, height } of [
  { width: 320, height: 900 },
  { width: 568, height: 320 },
]) {
  test.describe(`focus not obscured at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });
    for (const language of languages) {
      test(`every tab stop is visible (${language})`, async ({ page }) => {
        await open(page, language);
        await focusWalk(page, "entry");
        await roleButton(page, 1).click();
        await focusWalk(page, "provider overview");
        await page.getByRole("navigation").getByRole("button").nth(1).click();
        await focusWalk(page, "provider schedule");
        await scenarioButton(page).click();
        await scenarioButton(page).click();
        await roleButton(page, 2).click();
        await focusWalk(page, "patient offer");
        await page.locator(".offer-actions .primary-button").click();
        await focusWalk(page, "confirmation");
      });
    }
  });
}
