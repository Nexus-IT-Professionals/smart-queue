import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page, type Locator } from "@playwright/test";

for (const language of ["en", "es"]) {
  test(`accessible semantics and contrast across demo states (${language})`, async ({
    page,
  }) => {
    // ~20 full axe scans in one test can exceed 30s under parallel workers on real Edge.
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
    // Header switch: 0 Demo access, 1 María, 2 José, 3 Ana (office).
    const role = (index: number) =>
      page.locator(".workspace-switch button").nth(index).click();
    await role(3);
    await audit("office overview");
    const nav = page.getByRole("navigation");
    for (const index of [1, 2, 3, 4, 0]) {
      await nav.getByRole("button").nth(index).click();
      await audit(`office section ${index}`);
    }
    await role(1);
    await audit("María scheduled");
    await page.locator(".offer-actions .secondary-button").click();
    await audit("María confirmation");
    await page.locator(".confirmation .primary-button").click();
    await audit("María cancelled, AI offered");
    await role(3);
    await audit("office: AI offered");
    await role(2);
    await audit("José offer");
    await page.locator(".offer-actions .primary-button").click();
    await audit("José confirmation");
    await page.locator(".confirmation .primary-button").click();
    await audit("José accepted, AI updated");
    await role(1);
    await audit("María after the story");
    await role(3);
    await audit("office: Ana notified");
    await nav.getByRole("button").nth(3).click();
    await audit("activity log with AI steps");
    await page.locator(".demo-identity button").click();
    await audit("reset");
    await role(2);
    await audit("José no offer");
    await role(3);
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
async function tabBackTo(page: Page, target: Locator) {
  for (let i = 0; i < 60; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Shift+Tab");
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
    // María (header switch 1) cancels with the keyboard.
    await tabTo(page, page.locator(".workspace-switch button").nth(1));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    const cancel = page.locator(".offer-actions .secondary-button");
    await tabTo(page, cancel);
    await page.keyboard.press("Enter");
    await expect(page.locator(".confirmation")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(".confirmation .primary-button")).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(cancel).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator(".response-notice")).toBeFocused();
    await expect(page.locator('[aria-live="polite"]')).toContainText(
      language === "es" ? "Cita cancelada" : "Appointment cancelled",
    );
    await expect(page.locator('.demo-scenario [role="status"]')).toContainText(
      language === "es" ? "asistente de IA (simulado)" : "AI assistant (simulated)",
    );
    // On to José: "Open José's view" sits in the guide above.
    await tabBackTo(page, page.locator(".demo-scenario-actions button"));
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
      language === "es" ? "Cita adelantada" : "Appointment moved",
    );
    await expect(page.locator('.demo-scenario [role="status"]')).toContainText(
      language === "es" ? "notificó a la oficina" : "notified the office",
    );
    // "See what the office sees" in the guide above.
    await tabBackTo(page, page.locator(".demo-scenario-actions button"));
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await page.goBack();
    await expect(page.getByRole("main")).toBeFocused();
    await page.goForward();
    await expect(page.getByRole("main")).toBeFocused();
  });
}

test("focus is retained after cancellation, resets and resets during confirmation", async ({
  page,
}) => {
  await page.goto("/#/patient/maria");
  await page.getByRole("button", { name: "Cancel my appointment", exact: true }).click();
  await page.getByRole("button", { name: "Yes, cancel my appointment", exact: true }).click();
  await expect(page.locator(".response-notice")).toBeFocused();
  await page
    .getByRole("button", { name: "Reset demo scenario", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel my appointment", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Cancel my appointment", exact: true }).click();
  await page.getByRole("button", { name: "Yes, cancel my appointment", exact: true }).click();
  await page.getByRole("button", { name: "Open José's view" }).click();
  await page
    .getByRole("button", { name: "Accept earlier visit", exact: true })
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
