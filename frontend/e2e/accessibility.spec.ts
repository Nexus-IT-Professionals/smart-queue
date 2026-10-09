import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page, type Locator } from "@playwright/test";

for (const language of ["en", "es"]) {
  test(`accessible semantics and contrast across demo states (${language})`, async ({
    page,
  }) => {
    // 14 full axe scans in one test can exceed 30s under parallel workers on real Edge.
    test.slow();
    await page.goto("/#/demo");
    if (language === "es")
      await page.getByRole("button", { name: "Español", exact: true }).click();
    const findings: unknown[] = [];
    async function audit(state: string) {
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      findings.push(
        ...violations.map((v) => ({
          state,
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      );
    }
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await audit("entry");
    await page.locator(".workspace-switch button").nth(1).click();
    await audit("provider overview");
    const nav = page.getByRole("navigation");
    for (const index of [1, 2, 3, 0]) {
      await nav.getByRole("button").nth(index).click();
      await audit(`provider section ${index}`);
    }
    await page.locator(".demo-scenario-actions button").click();
    await audit("cancelled");
    await page.locator(".demo-scenario-actions button").click();
    await page.locator(".workspace-switch button").nth(2).click();
    await audit("patient offer");
    await page.locator(".offer-actions .text-button").click();
    await audit("help response");
    await page.locator(".offer-actions .primary-button").click();
    await audit("confirmation");
    await page.locator(".confirmation .primary-button").click();
    await audit("accepted");
    await page.locator(".demo-identity button").click();
    await audit("reset/no offer");
    await page.locator(".workspace-switch button").nth(1).click();
    await page.locator(".demo-scenario-actions button").click();
    await page.locator(".demo-scenario-actions button").click();
    await page.locator(".workspace-switch button").nth(2).click();
    await page.locator(".offer-actions .secondary-button").click();
    await audit("declined");
    await page.locator(".workspace-switch button").nth(1).click();
    await page.getByRole("navigation").getByRole("button").nth(1).click();
    await page.getByRole("searchbox").fill("no matching record");
    await audit("empty schedule");
    expect(findings).toEqual([]);
  });
}

async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 60; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}
for (const language of ["en", "es"]) {
  test(`keyboard focus and live announcements (${language})`, async ({
    page,
  }) => {
    await page.goto("/#/demo");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    if (language === "es") {
      await tabTo(
        page,
        page.getByRole("button", { name: "Español", exact: true }),
      );
      await page.keyboard.press("Enter");
    }
    await tabTo(page, page.locator(".workspace-switch button").nth(1));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await tabTo(page, page.locator(".demo-scenario-actions button"));
    await page.keyboard.press("Enter");
    await expect(page.locator('.demo-scenario [role="status"]')).toBeFocused();
    await tabTo(page, page.locator(".demo-scenario-actions button"));
    await page.keyboard.press("Enter");
    await expect(page.locator('.demo-scenario [role="status"]')).toBeFocused();
    await tabTo(page, page.locator(".demo-scenario-actions button"));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await tabTo(page, page.locator(".offer-actions .primary-button"));
    await page.keyboard.press("Enter");
    await expect(page.locator(".confirmation")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(".confirmation .primary-button")).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator(".offer-actions .primary-button")).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator(".response-notice")).toBeFocused();
    await expect(page.locator('[aria-live="polite"]')).toContainText(
      language === "es" ? "Cita demo adelantada" : "Demo appointment moved",
    );
    await tabTo(page, page.locator(".offer-panel > .text-button"));
    await page.keyboard.press("Enter");
    await expect(page.locator(".patient-grid .demo-access-card")).toBeFocused();
    await page.goBack();
    await expect(page.getByRole("main")).toBeFocused();
    await page.goForward();
    await expect(page.getByRole("main")).toBeFocused();
  });
}

test("focus is retained after help, decline and resets during confirmation", async ({
  page,
}) => {
  await page.goto("/#/provider");
  await page
    .getByRole("button", { name: "Confirm demo cancellation", exact: true })
    .click();
  await page.getByRole("button", { name: "Send demo offer to Elena" }).click();
  await page.getByRole("button", { name: "Open Demo Patient" }).click();
  await page.getByRole("button", { name: "I need help", exact: true }).click();
  await expect(page.locator(".response-notice")).toBeFocused();
  await page.getByRole("button", { name: "Keep my current visit" }).click();
  await expect(page.locator(".response-notice")).toBeFocused();
  await page
    .getByRole("button", { name: "Reset demo scenario", exact: true })
    .click();
  await expect(page.locator(".patient-grid .demo-access-card")).toBeFocused();
  await page.getByRole("button", { name: "Open Demo Provider" }).click();
  await page
    .getByRole("button", { name: "Confirm demo cancellation", exact: true })
    .click();
  await page.getByRole("button", { name: "Send demo offer to Elena" }).click();
  await page.getByRole("button", { name: "Open Demo Patient" }).click();
  await page
    .getByRole("button", { name: "Preview acceptance", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset demo scenario", exact: true })
    .click();
  await expect(page.locator(".patient-grid .demo-access-card")).toBeFocused();
  await expect(page.locator(".confirmation")).toHaveCount(0);
});

test("keyboard focus indicators contrast with both light and dark surfaces", async ({
  page,
}) => {
  await page.goto("/#/demo");
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await expect(skip).toHaveCSS("outline-style", "solid");
  await tabTo(page, page.getByRole("button", { name: "English", exact: true }));
  await expect(
    page.getByRole("button", { name: "English", exact: true }),
  ).toHaveCSS("outline-style", "solid");
  const ratios = await page.evaluate(() => {
    const active = document.activeElement;
    if (!active) throw new Error("No focused element");
    const style = getComputedStyle(active);
    const luminance = (color: string) => {
      const channels = color
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number);
      if (channels?.length !== 3)
        throw new Error("Unsupported color");
      const linear = channels.map((c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const ring = luminance(style.outlineColor);
    return [".topbar", ":root"].map((selector) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error("Missing surface");
      const surface = luminance(getComputedStyle(element).backgroundColor);
      return (
        (Math.max(ring, surface) + 0.05) / (Math.min(ring, surface) + 0.05)
      );
    });
  });
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(3);
});
