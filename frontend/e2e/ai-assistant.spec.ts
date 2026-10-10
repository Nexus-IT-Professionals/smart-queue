import { test, expect, type Page } from "@playwright/test";
import { fill, switchRole, translator, type Language } from "./story";

// The whole story across the three views, as a judge walks it:
// María cancels → the AI assistant (simulated) detects, selects José and
// offers → José accepts → the AI updates the schedule and notifies Ana.
const plain = (text: string) => text.replace(/\s+/g, " ").trim();
const status = (page: Page) => page.locator(".demo-scenario [role=status]");
async function texts(page: Page, selector: string) {
  return (await page.locator(selector).allInnerTexts()).map(plain);
}

for (const language of ["en", "es"] as Language[]) {
  test(`full AI-assisted story across María, José and Ana (${language})`, async ({
    page,
  }) => {
    const t = translator(language);
    const es = language === "es";
    await page.goto("/#/demo");
    if (es) await page.getByRole("button", { name: "Español", exact: true }).click();
    await page.getByRole("button", { name: t("Start the guided demo") }).click();

    // 1. María, in her own view, cancels with an explicit confirmation.
    await expect(page).toHaveURL(/#\/patient\/maria$/);
    await expect(page.locator(".page-heading p:not(.eyebrow)")).toHaveText(
      t("Welcome, María. Plans changed? You can cancel below."),
    );
    if (es) await expect(page.locator(".page-heading p:not(.eyebrow)")).toContainText("Bienvenida, María");
    await expect(status(page)).toHaveText(
      t("Your turn: cancel your October 8, 2:00 PM appointment below."),
    );
    await page.getByRole("button", { name: t("Cancel my appointment") }).click();
    await expect(page.getByRole("group", { name: t("Confirm cancellation") })).toBeFocused();
    await page.getByRole("button", { name: t("Yes, cancel my appointment") }).click();
    // 2–4. The assistant acts on its own; María's live regions announce it.
    await expect(status(page)).toHaveText(
      t("Cancelled. The AI assistant (simulated) offered your 2:00 PM time to a waiting patient."),
    );
    await expect(page.locator(".response-notice")).toBeFocused();
    await expect(page.locator("[aria-live=polite] .response-notice")).toHaveText(
      t("Appointment cancelled in this browser only. The AI assistant (simulated) is offering the time to a waiting patient."),
    );

    // 5. José, in his own view, sees the AI's offer and accepts it.
    await page.getByRole("button", { name: t("Open José's view") }).click();
    await expect(page).toHaveURL(/#\/patient\/jose$/);
    if (es) await expect(page.locator(".page-heading p:not(.eyebrow)")).toContainText("Bienvenido, José");
    await expect(status(page)).toHaveText(
      t("The AI assistant (simulated) offered you October 8 at 2:00 PM. Review it below and decide."),
    );
    await expect(page.locator(".ai-offer-reason")).toHaveText(
      `${t("AI assistant (simulated)")} ${fill(t, "Availability {availability} covers the 2:00 PM slot.", { availability: t("Afternoons · 1–4 PM") })}`,
    );
    // Other waiting patients stay private in a patient's view.
    for (const other of ["Elena Morales", "Nicolás Díaz", "Camila Soto", "María Rodríguez"])
      await expect(page.getByRole("main")).not.toContainText(other);
    await page.getByRole("button", { name: t("Accept earlier visit") }).click();
    await page.getByRole("button", { name: t("Yes, move my appointment") }).click();
    // 6. The AI updates the schedule; José's live regions announce it.
    await expect(status(page)).toHaveText(
      t("Done. The AI assistant updated the schedule and notified the office."),
    );
    await expect(page.locator(".response-notice")).toBeFocused();
    await expect(page.locator("[aria-live=polite] .response-notice")).toHaveText(
      t("Appointment moved to October 8 at 2:00 PM. The AI assistant (simulated) updated the schedule and the waitlist and notified the office, in this browser only."),
    );

    // 7. Ana (office) is notified with a summary. End of the story.
    await page.getByRole("button", { name: t("See what the office sees") }).click();
    await expect(page).toHaveURL(/#\/provider$/);
    await expect(status(page)).toContainText(t("Open slot filled by the AI assistant."));
    await expect(status(page)).toContainText(`José Pérez`);
    await expect(status(page)).toContainText(`${t("Waitlist")} 4 → 3`);
    const notification = page.getByRole("region", {
      name: fill(t, "Notification for {name}", { name: "Ana Martínez" }),
    });
    await expect(notification).toBeVisible();
    await expect(notification.locator(".ai-label")).toHaveText(t("AI assistant (simulated)"));
    const jose = { name: "José Pérez" };
    expect(await texts(page, ".ai-summary li")).toEqual([
      fill(t, "{name} cancelled her October 8 · 2:00 PM appointment with Dr. Carlos Rivera.", { name: "María Rodríguez" }),
      [
        fill(t, "Selected {name} from {count} waiting patients.", { ...jose, count: 4 }),
        fill(t, "Availability {availability} covers the 2:00 PM slot.", { availability: t("Afternoons · 1–4 PM") }),
        fill(t, "Same priority ({priority}) as {names}; the oldest request wins ({date}).", {
          priority: `P3 · ${t("Normal")}`,
          names: es ? "Elena Morales y Camila Soto" : "Elena Morales and Camila Soto",
          date: es ? "4 oct" : "Oct 4",
        }),
      ].join(" "),
      fill(t, "{name} accepted the earlier visit in the patient view.", jose),
      plain(
        fill(t, "Moved {name} to October 8 · 2:00 PM, released the {released} appointment and updated the waitlist ({before} → {after}).", {
          ...jose,
          released: es ? "22 de octubre · 2:00 p. m." : "October 22 · 2:00 PM",
          before: 4,
          after: 3,
        }),
      ),
    ]);
    // The feed: María, three AI steps, José, two AI steps — every AI step labelled.
    await expect(page.locator(".ai-feed > li")).toHaveCount(7);
    expect(await texts(page, ".ai-feed .ai-label")).toEqual(
      Array(5).fill(t("AI assistant (simulated)")),
    );
    // The reasoning shown is the deterministic ranking's own inputs.
    expect(await texts(page, ".ai-feed .ai-reasoning li")).toEqual([
      fill(t, "Availability {availability} covers the 2:00 PM slot.", { availability: t("Afternoons · 1–4 PM") }),
      fill(t, "Same priority ({priority}) as {names}; the oldest request wins ({date}).", {
        priority: `P3 · ${t("Normal")}`,
        names: es ? "Elena Morales y Camila Soto" : "Elena Morales and Camila Soto",
        date: es ? "4 oct" : "Oct 4",
      }),
      fill(t, "Next in line: {name}, newer request ({date}).", {
        name: "Elena Morales",
        date: es ? "5 oct" : "Oct 5",
      }),
      plain(
        fill(t, "Excluded {name}: {availability} does not cover 2:00 PM.", {
          name: "Nicolás Díaz",
          availability: t("Mornings · 9–11 AM"),
        }),
      ),
    ]);
    await expect(page.getByRole("row").filter({ hasText: "SQ-006" })).toContainText("José Pérez");
    await expect(
      page.getByRole("navigation").getByRole("button", { name: `${t("Waitlist")} 3` }),
    ).toBeVisible();
    // Ana is informed, not asked: no approval or undo controls.
    for (const name of ["Approve", "Undo", "Confirm demo cancellation", "Send demo offer to José"])
      await expect(page.getByRole("button", { name: t(name) })).toHaveCount(0);
    // Reset restores every fixture.
    await page.getByRole("button", { name: t("Reset demo scenario") }).click();
    await expect(notification).toHaveCount(0);
    await expect(page.getByRole("row").filter({ hasText: "SQ-006" })).toContainText("María Rodríguez");
    await switchRole(page, "maria", t);
    await expect(page.getByRole("button", { name: t("Cancel my appointment") })).toBeVisible();
  });
}
