import { test, expect, type Page } from "@playwright/test";
import { spanish } from "../src/i18n/catalog";
import { acceptAsJose, cancelAsMaria, fill, switchRole } from "./story";

// Julio's 2026-10-09 UI changes: instructions first, footer copy, Adrián's
// 8:30 AM slot, Ana Martínez (office), José Pérez atop the waitlist, role
// cards in story order (María, José, Ana), the office always opens on Overview.
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
    test("1 & 6: instructions come first, then the María, José and Ana cards left to right", async ({
      page,
    }) => {
      const t = await open(page, "/#/demo", language);
      // Instructions sit directly below the heading block, before the cards.
      const guide = page.locator(".page-heading + .demo-guide");
      await expect(guide.getByRole("heading", { level: 2 })).toHaveText(
        t("A complete demo in one browser"),
      );
      expect(await texts(page, ".demo-guide .entry-steps strong")).toEqual([
        t("María cancels"),
        t("AI assistant offers"),
        t("Patient accepts"),
        t("Ana is notified"),
      ]);
      await expect(page.locator(".demo-guide + .demo-access-grid")).toHaveCount(
        1,
      );
      const cards = [
        "María · patient who cancels",
        "José · waiting patient",
        "Ana · medical office",
      ].map(t);
      // Heading order (what a screen reader's heading list announces).
      expect((await texts(page, "main h1, main h2")).slice(0, 5)).toEqual([
        t("Explore care without the wait."),
        t("A complete demo in one browser"),
        ...cards,
      ]);
      const boxes = [];
      for (const [index, title] of cards.entries()) {
        const card = page.locator(".demo-access-card").nth(index);
        await expect(card.getByRole("heading")).toHaveText(title);
        boxes.push(await card.boundingBox());
      }
      const guideBox = await guide.boundingBox();
      if (!guideBox || boxes.some((box) => !box)) throw new Error("No box");
      const [maria, jose, ana] = boxes as NonNullable<(typeof boxes)[0]>[];
      expect(guideBox.y + guideBox.height).toBeLessThanOrEqual(maria.y);
      // Visual order matches DOM order: María, José, Ana.
      expect(maria.x + maria.width).toBeLessThanOrEqual(jose.x);
      expect(jose.x + jose.width).toBeLessThanOrEqual(ana.x);
      expect(Math.abs(maria.y - ana.y)).toBeLessThan(2);
      // Keyboard order matches visual order.
      await page.getByRole("main").focus();
      const order: string[] = [];
      for (let i = 0; i < 30 && order.length < 3; i++) {
        await page.keyboard.press("Tab");
        const name = plain(
          await page.evaluate(() => document.activeElement?.textContent ?? ""),
        );
        for (const who of ["María", "José", "Ana"])
          if (name.startsWith(t(`Continue as ${who}`))) order.push(who);
      }
      expect(order).toEqual(["María", "José", "Ana"]);
    });

    test("6: on a narrow screen the role cards stack in story order", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await open(page, "/#/demo", language);
      const boxes = await page
        .locator(".demo-access-card")
        .evaluateAll((cards) =>
          cards.map((card) => card.getBoundingClientRect().top),
        );
      expect(boxes).toHaveLength(3);
      expect(boxes[0]).toBeLessThan(boxes[1]);
      expect(boxes[1]).toBeLessThan(boxes[2]);
      await expect(page.locator(".demo-access-card").first()).toHaveClass(
        /maria-access/,
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
      await expect(metric("Appointment slots")).toHaveText("9");
      await expect(metric("Completed visits")).toHaveText("3");
      await expect(metric("Open slots")).toHaveText("0");
      await expect(page.locator(".schedule-panel .panel-heading")).toContainText(
        `9 ${t("slots")}`,
      );
      await expect(page.locator(".table-footer [role=status]")).toHaveText(
        `${t("Showing")} 9 ${t("of")} 9 ${t("slots")}`,
      );
      await cancelAsMaria(page, t);
      await switchRole(page, "ana", t);
      await expect(metric("Open slots")).toHaveText("1");
    });

    test("4: the office view is Ana's, observing Dr. Carlos Rivera's schedule; the AI acts after María cancels", async ({
      page,
    }) => {
      const t = await open(page, "/#/provider", language);
      const people = page.locator(".demo-identity-people > span");
      expect(await people.allInnerTexts().then((all) => all.map(plain))).toEqual(
        [
          `Ana Martínez · ${
            language === "es"
              ? "Asistente de oficina médica · identidad ficticia"
              : "Medical Office Assistant · fictional identity"
          }`,
          `${t("Observing the schedule of")} Dr. Carlos Rivera`,
        ],
      );
      // No manual staff actions remain: the office only observes.
      await expect(page.getByRole("button", { name: t("Confirm demo cancellation") })).toHaveCount(0);
      await expect(page.getByRole("button", { name: t("Send demo offer to José") })).toHaveCount(0);
      await cancelAsMaria(page, t);
      await switchRole(page, "ana", t);
      await page
        .getByRole("navigation")
        .getByRole("button", { name: t("Activity log") })
        .click();
      const name = { name: "José Pérez" };
      expect(await texts(page, ".timeline li p")).toEqual([
        fill(t, "{name} cancelled her October 8 · 2:00 PM appointment with Dr. Carlos Rivera.", { name: "María Rodríguez" }),
        fill(t, "Detected {name}'s cancellation. The October 8 · 2:00 PM slot is open.", { name: "María Rodríguez" }),
        fill(t, "Selected {name} from {count} waiting patients.", { ...name, count: 4 }),
        fill(t, "Sent {name} a simulated in-app offer for October 8 · 2:00 PM.", name),
      ]);
      // Every AI step, and only those, carries the simulated-AI label.
      await expect(page.locator(".timeline li .ai-label")).toHaveCount(3);
      await expect(page.locator(".timeline li .ai-label").first()).toHaveText(
        language === "es" ? "Asistente de IA (simulado)" : "AI assistant (simulated)",
      );
      // José's view shows only José.
      await switchRole(page, "jose", t);
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
      ).toHaveText("4");
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
      await cancelAsMaria(page, t);
      await acceptAsJose(page, t);
      await switchRole(page, "ana", t);
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

    test("7: the office view always opens on Overview when entered", async ({
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
      await page.getByRole("button", { name: t("Continue as Ana") }).click();
      await expectOverview("entry card");
      // Header role switch.
      await leaveOnActivity();
      await switchRole(page, "jose", t);
      await switchRole(page, "ana", t);
      await expectOverview("header switch");
      // A #/provider link followed from another workspace (hashchange).
      await leaveOnActivity();
      await switchRole(page, "maria", t);
      await page.evaluate(() => {
        window.location.hash = "/provider";
      });
      await expectOverview("hash link");
      // Browser back into the office view.
      await leaveOnActivity();
      await switchRole(page, "jose", t);
      await page.goBack();
      await expectOverview("browser back");
      // The patient view's "See what the office sees" button.
      await leaveOnActivity();
      await cancelAsMaria(page, t);
      await acceptAsJose(page, t);
      await page.getByRole("button", { name: t("See what the office sees") }).click();
      await expectOverview("patient button");
      // Switching sections inside the Provider workspace still works.
      await nav.getByRole("button", { name: t("Schedule"), exact: true }).click();
      await expect(
        nav.getByRole("button", { name: t("Schedule"), exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });
  });
}
