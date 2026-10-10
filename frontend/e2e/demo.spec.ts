import { test as base, expect, type Page } from "@playwright/test";
import { cancelAsMaria, roleName, switchRole } from "./story";

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
// María cancels; the AI assistant offers José the slot; open José's view.
async function offer(page: Page) {
  await page.goto("/#/patient/maria");
  await cancelAsMaria(page);
  await switchRole(page, "jose");
}
for (const [path, title] of [
  ["/", "Explore care without the wait."],
  ["/#/login", "Explore care without the wait."],
  ["/#/provider", "Today at Isla Care"],
  ["/#/staff", "Today at Isla Care"],
  ["/#/patient", "My appointment"],
  ["/#/patient/maria", "My appointment"],
  ["/#/patient/jose", "My appointment"],
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
  await page.getByRole("button", { name: "Continue as José" }).click();
  await page.getByRole("button", { name: "Demo access", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Explore care without the wait.",
  );
  await page.getByRole("button", { name: "Continue as Ana" }).click();
  await page.getByRole("button", { name: "Demo access", exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/#\/provider$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Today at Isla Care",
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
  for (const name of [
    roleName("ana"),
    roleName("maria"),
    roleName("jose"),
    "Demo access",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("main")).toBeFocused();
    expect(await page.evaluate(() => window.scrollY), name).toBe(0);
    await expect(page.locator(".topbar")).toBeInViewport();
  }
  await switchRole(page, "ana");
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
    page.getByRole("heading", { level: 1, name: "Today at Isla Care" }),
  ).toBeVisible();
});
test("explicit confirmation updates booking, waitlist and activity; reset restores state", async ({
  page,
}) => {
  await offer(page);
  await page
    .getByRole("button", { name: "Accept earlier visit", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Confirm earlier visit" }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Thursday, October 22", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Accept earlier visit", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Yes, move my appointment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thursday, October 8", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Demo access", exact: true }).click();
  await page.getByRole("button", { name: "Continue as Ana" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("José Pérez");
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
  await page.getByRole("button", { name: "Review activity" }).click();
  // María, 3 AI steps, José, 2 AI steps.
  await expect(page.locator(".timeline li")).toHaveCount(7);
  await page
    .getByRole("button", { name: "Reset demo scenario", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No demo actions yet" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Waitlist 4" })).toBeVisible();
});
test("María can back out before cancelling; José has only accept; reload clears state", async ({
  page,
}) => {
  await page.goto("/#/patient/maria");
  await page
    .getByRole("button", { name: "Cancel my appointment", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Confirm cancellation" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Keep my appointment", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cancel my appointment", exact: true }),
  ).toBeFocused();
  await switchRole(page, "ana");
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("María Rodríguez");
  await offer(page);
  // One story: no decline or help path, only an explicit acceptance.
  await expect(
    page.getByRole("button", { name: "Accept earlier visit", exact: true }),
  ).toBeVisible();
  for (const name of ["Keep my current visit", "I need help"])
    await expect(page.getByRole("button", { name })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No earlier offer yet" }),
  ).toBeVisible();
});
test("double activation of María's cancel confirmation applies once", async ({
  page,
}) => {
  await page.goto("/#/patient/maria");
  await page
    .getByRole("button", { name: "Cancel my appointment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yes, cancel my appointment", exact: true })
    .evaluate((button: HTMLElement) => {
      button.click();
      button.click();
    });
  await switchRole(page, "ana");
  await page.getByRole("button", { name: "Activity log" }).click();
  // María's cancellation, then detect, select, offer: each exactly once.
  await expect(page.locator(".timeline li")).toHaveCount(4);
});
test("double activation of confirm applies the acceptance only once", async ({
  page,
}) => {
  await offer(page);
  await page
    .getByRole("button", { name: "Accept earlier visit", exact: true })
    .click();
  // Two clicks in one task, before React re-renders: the worst-case double-click.
  await page
    .getByRole("button", { name: "Yes, move my appointment", exact: true })
    .evaluate((button: HTMLElement) => {
      button.click();
      button.click();
    });
  await expect(
    page.getByRole("heading", { name: "Thursday, October 8", exact: true }),
  ).toBeVisible();
  await switchRole(page, "ana");
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
  await page.getByRole("button", { name: "Activity log" }).click();
  await expect(page.locator(".timeline li")).toHaveCount(7);
});
test("reload while an offer is pending returns to the initial scenario", async ({
  page,
}) => {
  await offer(page);
  await expect(
    page.getByRole("button", { name: "Accept earlier visit", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/#\/patient\/jose$/);
  await expect(
    page.getByRole("heading", { name: "No earlier offer yet" }),
  ).toBeVisible();
  await switchRole(page, "ana");
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("María Rodríguez");
  await switchRole(page, "maria");
  await expect(
    page.getByRole("button", { name: "Cancel my appointment", exact: true }),
  ).toBeVisible();
});
test("back/forward after completing the scenario keeps the accepted state", async ({
  page,
}) => {
  await offer(page);
  await page
    .getByRole("button", { name: "Accept earlier visit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yes, move my appointment", exact: true })
    .click();
  await switchRole(page, "ana");
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/patient\/jose$/);
  await expect(
    page.getByRole("heading", { name: "Thursday, October 8", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept earlier visit", exact: true }),
  ).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL(/#\/provider$/);
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("José Pérez");
  await expect(page.getByRole("button", { name: "Waitlist 3" })).toBeVisible();
});
