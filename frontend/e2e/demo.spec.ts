import { test as base, expect, type Page } from "@playwright/test";

// Every test forbids API/external traffic and catches uncaught browser errors.
const test = base.extend<{ networkGuard: undefined }>({
  networkGuard: [
    async ({ page }, use) => {
      const forbidden: string[] = [];
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (
          url.origin !== "http://127.0.0.1:4175" ||
          url.pathname.startsWith("/api/") ||
          request.method() !== "GET"
        ) {
          forbidden.push(`${request.method()} ${url.origin}${url.pathname}`);
          await route.abort();
        } else await route.continue();
      });
      await use(undefined);
      expect(
        forbidden,
        "Demo must not attempt APIs, external traffic or writes",
      ).toEqual([]);
      expect(errors, "No uncaught browser errors").toEqual([]);
    },
    { auto: true },
  ],
});
async function offer(page: Page) {
  await page.goto("/#/provider");
  await page
    .getByRole("button", { name: "Confirm demo cancellation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send demo offer to José", exact: true })
    .click();
  await page.getByRole("button", { name: "Patient view", exact: true }).click();
}
for (const [path, title] of [
  ["/", "Explore care without the wait."],
  ["/#/login", "Explore care without the wait."],
  ["/#/provider", "A clearer day. Better access."],
  ["/#/staff", "A clearer day. Better access."],
  ["/#/patient", "Your care, a little closer."],
  ["/#/nope", "Explore care without the wait."],
  ["/#/../patient", "Explore care without the wait."],
]) {
  test(`direct anonymous access: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(
      page.getByText("Standalone demo · No API connection"),
    ).toBeVisible();
  });
}
test("entry from either role and browser back/forward remain public", async ({
  page,
}) => {
  await page.goto("/#/login");
  await page.getByRole("button", { name: "Continue as Demo Patient" }).click();
  await page.getByRole("button", { name: "Demo access", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Explore care without the wait.",
  );
  await page.getByRole("button", { name: "Continue as Demo Provider" }).click();
  await page.getByRole("button", { name: "Demo access", exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/#\/provider$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A clearer day. Better access.",
  );
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Explore care without the wait.",
  );
});
// Switching pages from the top bar must not scroll the header out of view.
test("top bar and sidebar navigation keep the page at the top", async ({
  page,
}) => {
  await page.goto("/#/demo");
  for (const name of ["Provider view", "Patient view", "Demo access"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("main")).toBeFocused();
    expect(await page.evaluate(() => window.scrollY), name).toBe(0);
    await expect(page.locator(".topbar")).toBeInViewport();
  }
  await page
    .getByRole("button", { name: "Provider view", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(page.getByRole("main")).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
test("all provider sections, search, empty state and filters", async ({
  page,
}) => {
  await page.goto("/#/provider");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("button", { name: "Schedule", exact: true }).click();
  const search = page.getByRole("searchbox");
  await search.fill("SQ-006");
  await expect(page.getByRole("table")).toContainText("María Rodríguez");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  await search.fill("no matching patient");
  await expect(page.getByRole("table")).not.toBeVisible();
  await search.fill("");
  await page
    .getByRole("combobox", { name: "Appointment status" })
    .selectOption("Completed");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);
  await nav.getByRole("button", { name: "Waitlist 4" }).click();
  await expect(
    page.getByRole("heading", { name: "Ready for an earlier visit" }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Activity log" }).click();
  await expect(
    page.getByRole("heading", { name: "No demo actions yet" }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A snapshot of your day" }),
  ).toBeVisible();
});
test("explicit confirmation updates booking, waitlist and activity; reset restores state", async ({
  page,
}) => {
  await offer(page);
  await page
    .getByRole("button", { name: "Preview acceptance", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Confirm preview acceptance" }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Thursday, October 22", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Preview acceptance", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Confirm preview", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thursday, October 8", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Demo access", exact: true }).click();
  await page.getByRole("button", { name: "Continue as Demo Provider" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("José Pérez");
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
  await page.getByRole("button", { name: "Review activity" }).click();
  await expect(page.locator(".timeline li")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Reset demo scenario", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No demo actions yet" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Waitlist 4" })).toBeVisible();
});
test("help permits a later response; decline preserves appointment; reload clears state", async ({
  page,
}) => {
  await offer(page);
  await page.getByRole("button", { name: "I need help", exact: true }).click();
  await expect(
    page.getByText(
      "Help request preview recorded. No message was sent to the office.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview acceptance", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Keep my current visit", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thursday, October 22", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview acceptance", exact: true }),
  ).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No earlier offer yet" }),
  ).toBeVisible();
});
test("double activation of confirm applies the acceptance only once", async ({
  page,
}) => {
  await offer(page);
  await page
    .getByRole("button", { name: "Preview acceptance", exact: true })
    .click();
  // Two clicks in one task, before React re-renders: the worst-case double-click.
  await page
    .getByRole("button", { name: "Confirm preview", exact: true })
    .evaluate((button: HTMLElement) => {
      button.click();
      button.click();
    });
  await expect(
    page.getByRole("heading", { name: "Thursday, October 8", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Provider view", exact: true }).click();
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
  await page.getByRole("button", { name: "Activity log" }).click();
  await expect(page.locator(".timeline li")).toHaveCount(3);
});
test("reload while an offer is pending returns to the initial scenario", async ({
  page,
}) => {
  await offer(page);
  await expect(
    page.getByRole("button", { name: "Preview acceptance", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/#\/patient$/);
  await expect(
    page.getByRole("heading", { name: "No earlier offer yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Provider view", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("María Rodríguez");
  await expect(
    page.getByRole("button", { name: "Confirm demo cancellation", exact: true }),
  ).toBeVisible();
});
test("back/forward after completing the scenario keeps the accepted state", async ({
  page,
}) => {
  await offer(page);
  await page
    .getByRole("button", { name: "Preview acceptance", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm preview", exact: true })
    .click();
  await page.getByRole("button", { name: "Provider view", exact: true }).click();
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/patient$/);
  await expect(
    page.getByRole("heading", { name: "Thursday, October 8", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview acceptance", exact: true }),
  ).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL(/#\/provider$/);
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("José Pérez");
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
});
