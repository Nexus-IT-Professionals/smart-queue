import { test, expect, type Page } from "@playwright/test";
import { spanish } from "../src/i18n/catalog";

// Julio's 2026-10-09 UI changes: instructions first, footer copy, Adrián's
// 8:30 AM slot, Ana Martínez (assistant), José Pérez atop the waitlist,
// Patient card left / Provider card right, Provider always opens on Overview.
type Language = "en" | "es";
const languages: Language[] = ["en", "es"];
const plain = (text: string) => text.replace(/\s+/g, " ").trim();

async function open(page: Page, path: string, language: Language) {
  await page.goto(path);
  if (language === "es") {
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  }
  return (text: string) => (language === "es" ? spanish[text] : text);
}
async function texts(page: Page, selector: string) {
  return (await page.locator(selector).allInnerTexts()).map(plain);
}

for (const language of languages) {
  test.describe(`UI changes (${language})`, () => {
    test("1 & 6: instructions come first, then Patient card left and Provider card right", async ({
      page,
    }) => {
      const t = await open(page, "/#/demo", language);
      // Instructions sit directly below the heading block, before the cards.
      const guide = page.locator(".page-heading + .demo-guide");
      await expect(guide.getByRole("heading", { level: 2 })).toHaveText(
        t("A complete demo in one browser"),
      );
      await expect(page.locator(".demo-guide + .demo-access-grid")).toHaveCount(
        1,
      );
      // Heading order (what a screen reader's heading list announces).
      expect(
        (await texts(page, "main h1, main h2")).slice(0, 4),
      ).toEqual([
        t("Explore care without the wait."),
        t("A complete demo in one browser"),
        t("Patient workspace"),
        t("Provider workspace"),
      ]);
      const guideBox = await guide.boundingBox();
      const patient = page.locator(".demo-access-card").nth(0);
      const provider = page.locator(".demo-access-card").nth(1);
      await expect(patient.getByRole("heading")).toHaveText(
        t("Patient workspace"),
      );
      await expect(provider.getByRole("heading")).toHaveText(
        t("Provider workspace"),
      );
      const patientBox = await patient.boundingBox();
      const providerBox = await provider.boundingBox();
      if (!guideBox || !patientBox || !providerBox) throw new Error("No box");
      expect(guideBox.y + guideBox.height).toBeLessThanOrEqual(patientBox.y);
      // Visual order matches DOM order: Patient left, Provider right.
      expect(patientBox.x + patientBox.width).toBeLessThanOrEqual(
        providerBox.x,
      );
      expect(Math.abs(patientBox.y - providerBox.y)).toBeLessThan(2);
      // Keyboard order matches visual order.
      await page.getByRole("main").focus();
      const order: string[] = [];
      for (let i = 0; i < 30 && order.length < 2; i++) {
        await page.keyboard.press("Tab");
        const name = plain(
          await page.evaluate(() => document.activeElement?.textContent ?? ""),
        );
        if (name.startsWith(t("Continue as Demo Patient"))) order.push("patient");
        if (name.startsWith(t("Continue as Demo Provider")))
          order.push("provider");
      }
      expect(order).toEqual(["patient", "provider"]);
    });

    test("6: on a narrow screen the Patient card stacks above the Provider card", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await open(page, "/#/demo", language);
      const boxes = await page
        .locator(".demo-access-card")
        .evaluateAll((cards) =>
          cards.map((card) => card.getBoundingClientRect().top),
        );
      expect(boxes).toHaveLength(2);
      expect(boxes[0]).toBeLessThan(boxes[1]);
      await expect(page.locator(".demo-access-card").first()).toHaveClass(
        /patient-access/,
      );
    });

    test("2: footer reads 'Made in and for Puerto Rico with love!'", async ({
      page,
    }) => {
      await open(page, "/#/demo", language);
      const foot = page.locator(".sidebar-foot");
      await expect(foot).toBeVisible();
      expect(plain(await foot.innerText()).replace(/\s*↗$/, "")).toBe(
        language === "es"
          ? "¡Hecho en y para Puerto Rico con amor!"
          : "Made in and for Puerto Rico with love!",
      );
    });

    test("3: Adrián López holds the first 8:30 AM slot; María Rodríguez holds 2:00 PM; counts include both", async ({
      page,
    }) => {
      const t = await open(page, "/#/provider", language);
      const rows = page.locator(".schedule-panel tbody tr");
      await expect(rows).toHaveCount(9);
      const first = rows.first();
      await expect(first.locator(".time-cell")).toContainText(
        language === "es" ? "8:30 a. m." : "8:30 AM",
      );
      await expect(first.locator(".time-cell")).toContainText("30 min");
      await expect(first).toContainText("Adrián López");
      await expect(first).toContainText("SQ-009");
      await expect(
        page.getByRole("row").filter({ hasText: "SQ-006" }),
      ).toContainText("María Rodríguez");
      await expect(
        page.getByRole("row").filter({ hasText: "María Rodríguez" }),
      ).toHaveCount(1);
      await expect(first.locator("td").nth(2)).toHaveText(t("Follow-up"));
      await expect(first.locator("td").nth(3)).toHaveText(t("Scheduled"));
      const metric = (label: string) =>
        page
          .locator(".metric-card")
          .filter({ hasText: t(label) })
          .locator(".metric-value");
      await expect(metric("Appointment slots")).toHaveText("09");
      await expect(metric("Completed visits")).toHaveText("03");
      await expect(metric("Open slots")).toHaveText("00");
      await expect(page.locator(".schedule-panel .panel-heading")).toContainText(
        `9 ${t("slots")}`,
      );
      await expect(page.locator(".table-footer [role=status]")).toHaveText(
        `${t("Showing")} 9 ${t("of")} 9 ${t("slots")}`,
      );
      await page
        .getByRole("button", { name: t("Confirm demo cancellation") })
        .click();
      await expect(metric("Open slots")).toHaveText("01");
    });

    test("4: Ana Martínez is shown beside Dr. Carlos Rivera and acts on cancellation and offer", async ({
      page,
    }) => {
      const t = await open(page, "/#/provider", language);
      const people = page.locator(".demo-identity-people > span");
      expect(await people.allInnerTexts().then((all) => all.map(plain))).toEqual(
        [
          `Dr. Carlos Rivera · ${t("Demo Provider · fictional identity")}`,
          `Ana Martínez · ${
            language === "es"
              ? "Asistente de oficina médica · identidad ficticia"
              : "Medical Office Assistant · fictional identity"
          }`,
        ],
      );
      await page
        .getByRole("button", { name: t("Confirm demo cancellation") })
        .click();
      await page
        .getByRole("button", { name: t("Send demo offer to José") })
        .click();
      await page
        .getByRole("navigation")
        .getByRole("button", { name: t("Activity log") })
        .click();
      expect(await texts(page, ".timeline li p")).toEqual(
        language === "es"
          ? [
              "Ana Martínez, asistente de oficina médica, confirmó la cancelación de ejemplo: 8 de octubre, 2:00 p. m.",
              "Ana Martínez, asistente de oficina médica, envió una oferta simulada a José Pérez.",
            ]
          : [
              "Ana Martínez, Medical Office Assistant, confirmed the sample cancellation: October 8, 2:00 PM.",
              "Ana Martínez, Medical Office Assistant, sent a simulated in-app offer to José Pérez.",
            ],
      );
      // No new role or login: the Patient view shows only José.
      await page.getByRole("button", { name: t("Patient view") }).click();
      await expect(page.locator(".demo-identity")).toContainText(
        "José Pérez",
      );
      await expect(page.locator(".demo-identity")).not.toContainText(
        "Ana Martínez",
      );
    });

    test("5: José Pérez tops the waitlist, receives the offer and is the only one removed; Elena keeps waiting", async ({
      page,
    }) => {
      const t = await open(page, "/#/provider", language);
      const nav = page.getByRole("navigation");
      await expect(
        nav.getByRole("button", { name: `${t("Waitlist")} 4` }),
      ).toBeVisible();
      await expect(
        page
          .locator(".metric-card")
          .filter({ hasText: t("Patients waiting") })
          .locator(".metric-value"),
      ).toHaveText("04");
      await nav.getByRole("button", { name: new RegExp(`^${t("Waitlist")}`) }).click();
      await expect(page.locator(".waitlist-list").locator("..")).toContainText(
        `4 ${t("patients")}`,
      );
      expect(await texts(page, ".waitlist-person strong")).toEqual([
        "José Pérez",
        "Elena Morales",
        "Nicolás Díaz",
        "Camila Soto",
      ]);
      const jose = page.locator(".waitlist-person").first();
      await expect(jose).toContainText(t("Afternoons · 1–4 PM"));
      await expect(jose.locator(".badge")).toHaveText("ES");
      await page
        .getByRole("button", { name: t("Confirm demo cancellation") })
        .click();
      await page
        .getByRole("button", { name: t("Send demo offer to José"), exact: true })
        .click();
      await page.getByRole("button", { name: t("Patient view") }).click();
      await page.getByRole("button", { name: t("Accept earlier visit") }).click();
      await page
        .getByRole("button", { name: t("Yes, move my appointment"), exact: true })
        .click();
      await page.getByRole("button", { name: t("Provider view") }).click();
      await expect(
        page.getByRole("row").filter({ hasText: "SQ-006" }),
      ).toContainText("José Pérez");
      await expect(
        nav.getByRole("button", { name: `${t("Waitlist")} 3` }),
      ).toBeVisible();
      await nav.getByRole("button", { name: new RegExp(`^${t("Waitlist")}`) }).click();
      expect(await texts(page, ".waitlist-person strong")).toEqual([
        "Elena Morales",
        "Nicolás Díaz",
        "Camila Soto",
      ]);
    });

    test("7: the Provider view always opens on Overview when entered", async ({
      page,
    }) => {
      const t = await open(page, "/#/provider", language);
      const nav = page.getByRole("navigation");
      const expectOverview = async (route: string) => {
        await expect(page, route).toHaveURL(/#\/provider$/);
        await expect(
          nav.getByRole("button", { name: t("Overview"), exact: true }),
          route,
        ).toHaveAttribute("aria-current", "page");
        await expect(page.getByRole("heading", { level: 1 }), route).toHaveText(
          t("Today at Isla Care"),
        );
      };
      const leaveOnActivity = async () => {
        await nav.getByRole("button", { name: t("Activity log") }).click();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          t("Activity log"),
        );
      };
      await expectOverview("direct #/provider link");
      // Entry page card.
      await leaveOnActivity();
      await page.getByRole("button", { name: t("Demo access") }).click();
      await page
        .getByRole("button", { name: t("Continue as Demo Provider") })
        .click();
      await expectOverview("entry card");
      // Header role switch.
      await leaveOnActivity();
      await page.getByRole("button", { name: t("Patient view") }).click();
      await page.getByRole("button", { name: t("Provider view") }).click();
      await expectOverview("header switch");
      // Patient workspace's "Open Demo Provider" button.
      await leaveOnActivity();
      await page.getByRole("button", { name: t("Patient view") }).click();
      await page.getByRole("button", { name: t("Open Demo Provider") }).click();
      await expectOverview("patient button");
      // A #/provider link followed from another workspace (hashchange).
      await leaveOnActivity();
      await page.getByRole("button", { name: t("Patient view") }).click();
      await page.evaluate(() => {
        window.location.hash = "/provider";
      });
      await expectOverview("hash link");
      // Browser back into the Provider workspace.
      await leaveOnActivity();
      await page.getByRole("button", { name: t("Patient view") }).click();
      await page.goBack();
      await expectOverview("browser back");
      // Switching sections inside the Provider workspace still works.
      await nav.getByRole("button", { name: t("Schedule"), exact: true }).click();
      await expect(
        nav.getByRole("button", { name: t("Schedule"), exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });
  });
}
