import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function open(page: import("@playwright/test").Page) {
  await page.goto("/#/provider");
  await page
    .getByRole("button", { name: "Capacity & statistics", exact: true })
    .click();
  const dashboard = page.getByRole("region", {
    name: "Capacity & statistics",
    exact: true,
  });
  await dashboard
    .getByText("Capacity configuration & regenerate", { exact: true })
    .click();
  await dashboard
    .getByLabel("Generated month", { exact: true })
    .fill("2026-10");
  await dashboard.getByLabel("Confirm reset of generated month").check();
  await dashboard
    .getByRole("button", { name: "Apply & regenerate demo" })
    .click();
  await dashboard
    .getByText("Capacity configuration & regenerate", { exact: true })
    .click();
  return dashboard;
}
const metric = (d: import("@playwright/test").Locator, label: string) =>
  d.locator(".metric-card").filter({ hasText: label }).locator(".metric-value");
test("monthly capacity, daily cancellation and priority reassignment recalculate immediately", async ({
  page,
}) => {
  const d = await open(page);
  await expect(metric(d, "Total capacity")).toHaveText("440");
  await expect(metric(d, "Occupied seats")).toHaveText("396");
  await d.getByLabel("Schedule date", { exact: true }).fill("2026-10-08");
  await d
    .getByRole("group", { name: "Statistics period" })
    .getByRole("button", { name: "Day", exact: true })
    .click();
  await expect(metric(d, "Occupied seats")).toHaveText("18");
  await d
    .locator(".capacity-slots button")
    .filter({ hasText: "Scheduled" })
    .first()
    .click();
  await expect(
    d.getByRole("button", { name: "Cancel selected appointment" }),
  ).toBeDisabled();
  await d.getByLabel("Staff confirmation · synthetic scheduling only").check();
  await d.getByRole("button", { name: "Cancel selected appointment" }).click();
  await expect(metric(d, "Occupied seats")).toHaveText("17");
  await expect(metric(d, "Cancellations")).toHaveText("2");
  await expect(d.getByLabel("Eligible waiting-list candidates")).toContainText(
    "P1",
  );
  await d.getByLabel("Staff confirmation · synthetic scheduling only").check();
  await d
    .getByRole("button", { name: "Confirm waiting-list assignment" })
    .click();
  await expect(metric(d, "Occupied seats")).toHaveText("18");
  await expect(metric(d, "Waiting-list fill rate")).toHaveText("50.0%");
  await expect(metric(d, "Successfully reassigned appointments")).toHaveText(
    "1",
  );
  await d
    .getByRole("group", { name: "Statistics period" })
    .getByRole("button", { name: "Week", exact: true })
    .click();
  await expect(metric(d, "Total capacity")).toHaveText("100");
  await d
    .getByRole("group", { name: "Statistics period" })
    .getByRole("button", { name: "Month", exact: true })
    .click();
  await expect(metric(d, "Total capacity")).toHaveText("440");
  await d.locator(".capacity-trends button").first().click();
  await expect(
    d
      .getByRole("group", { name: "Statistics period" })
      .getByRole("button", { name: "Week", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("configuration validates limits, supports resources, reset and previous-month snapshots", async ({
  page,
}) => {
  const d = await open(page);
  await d
    .getByText("Capacity configuration & regenerate", { exact: true })
    .click();
  await d.getByLabel("Seats per day per resource").fill("21");
  await d.getByLabel("Confirm reset of generated month").check();
  await d.getByRole("button", { name: "Apply & regenerate demo" }).click();
  await expect(d.getByRole("status")).toContainText("Invalid capacity");
  await d.getByLabel("Seats per day per resource").fill("20");
  await d.getByLabel("Provider resources", { exact: true }).fill("2");
  await d.getByRole("button", { name: "Apply & regenerate demo" }).click();
  await expect(metric(d, "Total capacity")).toHaveText("880");
  await d
    .getByLabel("Provider resource", { exact: true })
    .selectOption("RESOURCE-2");
  await expect(metric(d, "Total capacity")).toHaveText("440");
  await d.getByLabel("Generated month", { exact: true }).fill("2026-11");
  await d.getByLabel("Confirm reset of generated month").check();
  await d.getByRole("button", { name: "Apply & regenerate demo" }).click();
  await expect(d).toContainText("Previous month occupancy: 90.0%");
});
for (const width of [320, 1280])
  test(`capacity workspace accessible and fits ${width}px in both languages`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const d = await open(page);
    await expect(d.locator(".capacity-calendar button")).toHaveCount(42);
    for (const language of ["English", "Español"]) {
      await page.getByRole("button", { name: language, exact: true }).click();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .include(".capacity-dashboard")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    await page.screenshot({
      path: `/tmp/capacity-${width}.png`,
      fullPage: true,
    });
  });
