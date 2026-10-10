import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { cancelAsMaria, switchRole } from "./story";

test("the AI selects the staff-confirmed urgent eligible patient, who explicitly accepts; all calendar views update", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      new URL(request.url()).origin !== "http://127.0.0.1:4175" ||
      request.url().includes("/api/")
    )
      external.push(request.url());
  });
  await page.goto("/#/provider");
  await page.getByRole("button", { name: "Waitlist 4", exact: true }).click();
  const camila = page
    .locator(".waitlist-person")
    .filter({ hasText: "Camila Soto" });
  await camila.getByRole("combobox").selectOption("P1");
  await expect(
    camila.getByRole("button", { name: "Save priority" }),
  ).toBeDisabled();
  await camila.getByRole("checkbox").check();
  await camila.getByRole("button", { name: "Save priority" }).click();
  await expect(page.locator(".waitlist-person").first()).toContainText(
    "Camila Soto",
  );
  await cancelAsMaria(page);
  await switchRole(page, "ana");
  // The assistant follows the staff-confirmed priority; mornings-only stays excluded.
  const feed = page.locator(".ai-feed");
  await expect(feed).toContainText("Selected Camila Soto from 4 waiting patients.");
  await expect(feed.locator(".ai-reasoning")).toContainText(
    "Highest scheduling priority among eligible patients (P1 · Urgent).",
  );
  await expect(feed.locator(".ai-reasoning")).toContainText(
    "Excluded Nicolás Díaz: Mornings · 9–11 AM does not cover 2:00 PM.",
  );
  // The waiting patient's view shows whoever the assistant offered the slot.
  await switchRole(page, "jose");
  await expect(page.locator(".profile-heading")).toContainText("Camila Soto");
  await expect(page.locator(".profile-heading")).toContainText("WL-003");
  await expect(page.locator(".patient-appointment")).toContainText(
    "October 22",
  );
  await page
    .getByRole("button", { name: "Accept earlier visit", exact: true })
    .click();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.locator(".patient-appointment")).toContainText(
    "October 22",
  );
  await page
    .getByRole("button", { name: "Accept earlier visit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yes, move my appointment", exact: true })
    .click();
  await expect(page.locator(".patient-appointment")).toContainText("October 8");
  await switchRole(page, "ana");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("Camila Soto");
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("P1");
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.locator(".calendar-days button")).toHaveCount(42);
  await expect(
    page.locator(".calendar-days button[aria-pressed=true]"),
  ).toContainText("Canceled");
  await page
    .getByRole("button", { name: /Thursday, October 22, 2026/ })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Available appointment" }),
  ).toHaveCount(1);
  await expect(page.getByRole("table")).not.toContainText("Camila Soto");
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.locator(".calendar-days button")).toHaveCount(7);
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".calendar-days")).toHaveCount(0);
  await expect(page.getByRole("table")).toContainText("Elena Morales");
  expect(external).toEqual([]);
});

test("configuration validation, migration, custom labels/order and session reset", async ({
  page,
}) => {
  await page.goto("/#/provider");
  await page.getByRole("button", { name: "Waitlist 4", exact: true }).click();
  await page.getByText("Priority configuration", { exact: true }).click();
  const config = page.locator(".priority-settings");
  const p1 = config.getByRole("group", { name: "P1", exact: true });
  const p3 = config.getByRole("group", { name: "P3", exact: true });
  await p1.getByLabel("Order", { exact: true }).fill("3");
  await config.getByRole("button", { name: "Save configuration" }).click();
  await expect(config.getByRole("status")).toContainText("unique order");
  await p1.getByLabel("Order", { exact: true }).fill("1");
  await p3.getByLabel("Label", { exact: true }).fill("Routine demo");
  await p3
    .getByLabel("Description", { exact: true })
    .fill("Synthetic routine scheduling");
  await p3
    .getByRole("combobox", { name: "Indicator", exact: true })
    .selectOption("secondary");
  await config.getByRole("button", { name: "Save configuration" }).click();
  await expect(config.getByRole("status")).toContainText("saved");
  await expect(
    page.locator(".waitlist-person").filter({ hasText: "Elena Morales" }),
  ).toContainText("Routine demo");
  await p3.getByLabel("Enabled", { exact: true }).uncheck();
  await config.getByRole("button", { name: "Save configuration" }).click();
  await expect(config.getByRole("status")).toContainText(
    "enabled non-urgent default",
  );
  await config
    .getByRole("combobox", { name: "Default priority", exact: true })
    .selectOption("P4");
  await config.getByRole("button", { name: "Save configuration" }).click();
  await expect(
    page.locator(".waitlist-person").filter({ hasText: "Elena Morales" }),
  ).toContainText("P4");
  await switchRole(page, "jose");
  await switchRole(page, "ana");
  // The Overview preview hides the default level; the Waitlist shows every badge.
  await page.getByRole("button", { name: "Waitlist 4", exact: true }).click();
  await expect(
    page.locator(".waitlist-person").filter({ hasText: "Elena Morales" }),
  ).toContainText("P4");
  await page.reload();
  await page.getByRole("button", { name: "Waitlist 4", exact: true }).click();
  await expect(
    page.locator(".waitlist-person").filter({ hasText: "Elena Morales" }),
  ).toContainText("P3");
  await expect(
    page.locator(".waitlist-person").filter({ hasText: "Elena Morales" }),
  ).not.toContainText("Routine demo");
});

for (const width of [320, 768, 1440])
  test(`calendar navigation, priority indicators and accessibility at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#/patient/maria");
    await cancelAsMaria(page);
    await switchRole(page, "ana");
    // A high scheduling level does not bypass the morning-only restriction.
    await page.getByRole("button", { name: /^Waitlist/ }).click();
    const elena = page
      .locator(".waitlist-person")
      .filter({ hasText: "Elena Morales" });
    await elena.getByRole("combobox").selectOption("P1");
    await elena.getByRole("checkbox").check();
    await elena.getByRole("button", { name: "Save priority" }).click();
    await page.getByRole("button", { name: "Schedule", exact: true }).click();
    await page.getByRole("button", { name: "Month", exact: true }).click();
    await expect(
      page.locator(".calendar-days button[aria-pressed=true]"),
    ).toContainText("1 high-priority eligible");
    await page.getByRole("button", { name: "Next period" }).click();
    await expect(page.locator(".calendar-navigation")).toContainText(
      "November 2026",
    );
    await expect(page.getByRole("table")).toHaveCount(0);
    await page.getByRole("button", { name: "Previous period" }).click();
    await expect(page.locator(".calendar-navigation")).toContainText(
      "October 2026",
    );
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Mes", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".priority-disclaimer")).toContainText(
      "Sin triaje por IA",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({
      path: test.info().outputPath(`month-${width}.png`),
      fullPage: true,
    });
  });
