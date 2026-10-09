import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test as base, expect, type Page } from "@playwright/test";
import { spanish } from "../src/i18n/catalog";

// QA-3 judge-device rehearsal: the one-tab scenario in EN and ES against
// REHEARSAL_URL (default: local build:demo preview), with a network audit
// proving no credential prompt, cookie, API call, write or third-party traffic.
type Language = "en" | "es";
type Translate = (text: string) => string;

// With the network deliberately cut (offline test) the browser's own tab-icon
// refresh of the shipped favicon.svg fails; that is not app traffic. Any other
// failure — including a /favicon.ico 404 from a broken icon link — still counts.
const offlineTabIcon = (url: string, error = "") =>
  new URL(url || "about:blank").pathname === "/favicon.svg" &&
  error.includes("ERR_INTERNET_DISCONNECTED");

const test = base.extend<{ audit: string[] }>({
  audit: [
    async ({ context, page, baseURL }, use, testInfo) => {
      const origin = new URL(baseURL ?? "").origin;
      const seen: string[] = [];
      const problems: string[] = [];
      const pending: Promise<void>[] = [];
      context.on("request", (request) => {
        const url = new URL(request.url());
        seen.push(`${request.method()} ${url.origin}${url.pathname}`);
        if (url.protocol === "data:" || url.protocol === "blob:") return;
        if (request.method() !== "GET")
          problems.push(`non-GET: ${request.method()} ${url.href}`);
        if (url.origin !== origin) problems.push(`third-party: ${url.href}`);
        if (url.pathname.startsWith("/api/"))
          problems.push(`API call: ${url.href}`);
      });
      context.on("requestfailed", (request) => {
        const error = request.failure()?.errorText;
        if (offlineTabIcon(request.url(), error))
          seen.push(`offline tab-icon refresh: ${request.url()} (${error})`);
        else problems.push(`failed: ${request.url()} (${error})`);
      });
      context.on("response", (response) => {
        if ([401, 403, 407].includes(response.status()))
          problems.push(`auth status ${response.status()}: ${response.url()}`);
        pending.push(
          response.headersArray().then((headers) => {
            if (headers.some((h) => h.name.toLowerCase() === "set-cookie"))
              problems.push(`Set-Cookie: ${response.url()}`);
          }),
        );
      });
      page.on("dialog", (dialog) => {
        problems.push(`dialog ${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const at = message.location().url;
        if (offlineTabIcon(at, message.text()))
          seen.push(`offline tab-icon refresh: ${message.text()}`);
        else problems.push(`console error: ${message.text()} (${at})`);
      });
      page.on("pageerror", (error) => problems.push(`pageerror: ${error}`));
      await use(problems);
      await Promise.all(pending);
      for (const cookie of await context.cookies())
        problems.push(`cookie in context: ${cookie.name}@${cookie.domain}`);
      await testInfo.attach("network-audit", {
        body: [...seen, "--- problems ---", ...problems].join("\n"),
        contentType: "text/plain",
      });
      expect(problems, "Network audit: static same-origin GETs only").toEqual(
        [],
      );
    },
    { auto: true },
  ],
});

const dates = {
  en: { earlier: "Thursday, October 8", original: "Thursday, October 22" },
  es: { earlier: "jueves, 8 de octubre", original: "jueves, 22 de octubre" },
};

async function open(page: Page, language: Language): Promise<Translate> {
  await page.goto("/#/demo");
  if (language === "es") {
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  }
  const t = (text: string) => (language === "es" ? spanish[text] : text);
  await expect(
    page.getByText(t("Standalone demo · No API connection")),
  ).toBeVisible();
  return t;
}

// Provider: confirm cancellation, offer Elena, then switch to her view.
async function offer(page: Page, t: Translate) {
  await page.getByRole("button", { name: t("Demo access"), exact: true }).click();
  await page
    .getByRole("button", { name: t("Continue as Demo Provider") })
    .click();
  const first = page.locator(".schedule-panel tbody tr").first();
  await expect(first).toContainText("María Rodríguez");
  await expect(first.locator(".time-cell")).toContainText(/8:30/);
  await page
    .getByRole("button", { name: t("Confirm demo cancellation"), exact: true })
    .click();
  await page
    .getByRole("button", { name: t("Send demo offer to Elena"), exact: true })
    .click();
  await page.getByRole("button", { name: t("Patient view"), exact: true }).click();
}

async function waitlist(page: Page, t: Translate) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: new RegExp(`^${t("Waitlist")}`) })
    .click();
  return (await page.locator(".waitlist-person strong").allInnerTexts()).map(
    (name) => name.trim(),
  );
}

// Full scenario: cancel -> offer -> patient accept -> provider sees the result.
async function accept(page: Page, t: Translate, language: Language) {
  await offer(page, t);
  await page
    .getByRole("button", { name: t("Accept earlier visit"), exact: true })
    .click();
  await page
    .getByRole("button", { name: t("Yes, move my appointment"), exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: dates[language].earlier, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: t("Provider view"), exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("Elena Morales");
  const nav = page.getByRole("navigation");
  await expect(
    nav.getByRole("button", { name: `${t("Waitlist")} 3` }),
  ).toBeVisible();
  expect(await waitlist(page, t)).toEqual([
    "José Pérez",
    "Nicolás Díaz",
    "Camila Soto",
  ]);
  await nav.getByRole("button", { name: t("Activity log") }).click();
  const events = page.locator(".timeline li p");
  await expect(events).toHaveCount(3);
  await expect(events.nth(0)).toContainText("Ana Martínez");
  await expect(events.nth(1)).toContainText("Ana Martínez");
  await expect(events.nth(1)).toContainText("Elena Morales");
  await expect(events.nth(2)).toHaveText(
    t(
      "Patient accepted: demo booking moved from October 22 to October 8, 2:00 PM; waitlist entry removed.",
    ),
  );
}

async function expectInitial(page: Page, t: Translate) {
  await expect(
    page.getByRole("row").filter({ hasText: "SQ-006" }),
  ).toContainText("Adrián López");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: `${t("Waitlist")} 4` }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: t("Confirm demo cancellation") }),
  ).toBeVisible();
}

for (const language of ["en", "es"] as const) {
  test.describe(`rehearsal (${language})`, () => {
    test("full one-tab scenario, then reset and reload restore the start", async ({
      page,
    }) => {
      const t = await open(page, language);
      await accept(page, t, language);
      await page
        .getByRole("button", { name: t("Reset demo scenario"), exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: t("No demo actions yet") }),
      ).toBeVisible();
      await page
        .getByRole("navigation")
        .getByRole("button", { name: t("Overview"), exact: true })
        .click();
      await expectInitial(page, t);
      // Run it again, then a reload must clear it while keeping the language.
      await accept(page, t, language);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      await expectInitial(page, t);
      expect(await waitlist(page, t)).toEqual([
        "José Pérez",
        "Elena Morales",
        "Nicolás Díaz",
        "Camila Soto",
      ]);
    });

    test("decline keeps the original appointment", async ({ page }) => {
      const t = await open(page, language);
      await offer(page, t);
      await page
        .getByRole("button", { name: t("Keep my current visit"), exact: true })
        .click();
      await expect(
        page.getByText(
          t("Decline preview recorded. Your existing appointment is unchanged."),
        ),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: dates[language].original,
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: t("Provider view"), exact: true })
        .click();
      await expect(
        page
          .getByRole("navigation")
          .getByRole("button", { name: `${t("Waitlist")} 4` }),
      ).toBeVisible();
    });

    test("help records a request and still allows a later response", async ({
      page,
    }) => {
      const t = await open(page, language);
      await offer(page, t);
      await page
        .getByRole("button", { name: t("I need help"), exact: true })
        .click();
      await expect(
        page.getByText(
          t("Help request preview recorded. No message was sent to the office."),
        ),
      ).toBeVisible();
      await page
        .getByRole("button", { name: t("Accept earlier visit"), exact: true })
        .click();
      await page
        .getByRole("button", { name: t("Yes, move my appointment"), exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: dates[language].earlier,
          exact: true,
        }),
      ).toBeVisible();
    });

    test("venue Wi-Fi drop: the scenario completes offline after first load", async ({
      page,
      context,
    }) => {
      const t = await open(page, language);
      await context.setOffline(true);
      await accept(page, t, language);
      await page
        .getByRole("button", { name: t("Reset demo scenario"), exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: t("No demo actions yet") }),
      ).toBeVisible();
    });
  });
}

// Only meaningful against a deployment: proves the live site is this commit.
test("deployment integrity: remote assets match the local build and CSP blocks APIs", async ({
  request,
  baseURL,
}) => {
  test.skip(!process.env.REHEARSAL_URL, "REHEARSAL_URL not set (local run)");
  const assets = (html: string) =>
    [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
      .map((match) => match[1])
      .sort();
  const response = await request.get(`${baseURL}/`);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const remote = assets(html);
  expect(remote.length, "remote index references assets").toBeGreaterThan(0);

  // CSP from the response header and/or the meta tag (as verify-demo.mjs emits).
  const policies = [
    response.headers()["content-security-policy"],
    html
      .match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1]
      ?.replaceAll("&#39;", "'"),
  ].filter((policy): policy is string => !!policy);
  expect(policies.length, "a Content-Security-Policy is present").toBeGreaterThan(
    0,
  );
  for (const policy of policies) {
    const directive = (name: string) =>
      policy
        .split(";")
        .map((part) => part.trim().split(/\s+/))
        .find(([key]) => key === name)
        ?.slice(1);
    const connect = directive("connect-src") ?? directive("default-src");
    expect(connect, `connect-src blocks APIs in: ${policy}`).toEqual([
      "'none'",
    ]);
  }

  const dist = new URL("../dist/", import.meta.url);
  const local = await readFile(new URL("index.html", dist), "utf8").catch(
    () => null,
  );
  test.skip(local === null, "No local frontend/dist; run npm run build:demo");
  expect(remote, "live asset filenames equal the local build").toEqual(
    assets(local ?? ""),
  );
  const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  for (const path of remote) {
    const asset = await request.get(`${baseURL}${path}`);
    expect(asset.status(), path).toBe(200);
    expect(sha(await asset.body()), `${path} bytes`).toBe(
      sha(await readFile(new URL(`.${path}`, dist))),
    );
  }
});
