import { test, expect, type Page } from "@playwright/test";
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
for (const width of [320, 375, 768, 1024, 1440]) {
  test(`public workflow fits ${width}px with reachable controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/demo");
    await fits(page);
    await page
      .getByRole("button", { name: "Continue as Demo Provider" })
      .click();
    await fits(page);
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    for (const section of [
      "Schedule",
      "Waitlist",
      "Activity log",
      "Overview",
    ]) {
      await nav
        .getByRole("button", { name: new RegExp(`^${section}`) })
        .click();
      await fits(page);
    }
    if (width <= 375) {
      const table = page.getByRole("region", { name: "Daily appointments" });
      await table.focus();
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => table.evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(0);
      await fits(page);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: test.info().outputPath(`provider-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Confirm demo cancellation", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Send demo offer to Elena", exact: true })
      .click();
    await fits(page);
    await page
      .getByRole("button", { name: "Patient view", exact: true })
      .click();
    await fits(page);
    await page
      .getByRole("button", { name: "Preview acceptance", exact: true })
      .click();
    await fits(page);
    await page
      .getByRole("button", { name: "Confirm preview", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Thursday, October 8", exact: true }),
    ).toBeVisible();
    await fits(page);
    await page
      .getByRole("button", { name: "Reset demo scenario", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "No earlier offer yet" }),
    ).toBeVisible();
    await fits(page);
    await page.screenshot({
      path: test.info().outputPath(`patient-${width}.png`),
      fullPage: true,
    });
  });
}
