import { test, expect, type Page } from "@playwright/test";
import { spanish } from "../src/i18n/catalog";
import { switchRole } from "./story";

type Language = "en" | "es";
const plain = (text: string) => text.replace(/\s+/g, " ").trim();
const label = (language: Language, text: string) =>
  language === "es" ? (spanish[text] ?? text) : text;
// Catalog strings that must never appear in the other language: the English
// source when Spanish is selected, and the Spanish value when English is.
// Built from every key, not only keys whose Spanish differs: an entry left
// untranslated (es === en) must still count as English leaking into Spanish.
// Only entries that are correct in both languages are exempt (the parity unit
// test in tests/locale.test.mjs enforces the same exemption).
const sameInBothLanguages = new Set(["30 min"]);
const translated = Object.entries(spanish)
  .filter(([en]) => !sameInBothLanguages.has(en))
  .map(([en, es]) => ({ en: plain(en), es: plain(es) }));
// Whole-phrase containment: "Consultation" must not count as containing the
// Spanish "Consulta", nor "confirmó" as containing the English "confirm".
const letter = /\p{L}/u;
const containsPhrase = (text: string, phrase: string) => {
  for (let at = text.indexOf(phrase); at >= 0; at = text.indexOf(phrase, at + 1))
    if (
      !letter.test(text[at - 1] ?? "") &&
      !letter.test(text[at + phrase.length] ?? "")
    )
      return true;
  return false;
};
// Common words that only occur in one language, to also catch text that never
// went through the catalog at all.
const foreignWords: Record<Language, RegExp> = {
  es: /(?<!\p{L})(the|and|your|you|with|this|that|from|are|will|has|have|is|for|not|only|appointments?|schedule|waitlist|patients?|provider|available|open|view|confirm|cancel|offer|help)(?!\p{L})/iu,
  en: /(?<!\p{L})(de|la|el|los|las|del|su|una|cita|citas|para|con|que|espera|paciente)(?!\p{L})/iu,
};
// Text that is correct in both languages. Keep this small and justified.
const allowed: Record<Language, Set<string>> = {
  // Language switch buttons name each language in itself (lang="en"/"es").
  es: new Set(["English"]),
  en: new Set(["Español"]),
};
async function visibleTexts(page: Page) {
  return page.evaluate(() => {
    const texts = [document.title];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode())
      // Editable configuration values, like input values, remain staff-authored.
      if (!node.parentElement?.closest("textarea"))
        texts.push(node.textContent ?? "");
    const attributes = ["aria-label", "title", "placeholder", "alt"];
    for (const element of document.querySelectorAll(
      attributes.map((name) => `[${name}]`).join(","),
    ))
      for (const name of attributes)
        texts.push(element.getAttribute(name) ?? "");
    return texts;
  });
}
async function scan(page: Page, language: Language, state: string) {
  const other = language === "es" ? "en" : "es";
  const found: string[] = [];
  for (const raw of await visibleTexts(page)) {
    const text = plain(raw);
    if (!text || allowed[language].has(text)) continue;
    const leaked = translated.find(
      (pair) =>
        // An untranslated pair is English, not Spanish leaking into English.
        !(other === "es" && pair.es === pair.en) &&
        (text === pair[other] ||
          (pair[other].includes(" ") && containsPhrase(text, pair[other]))),
    );
    if (leaked || foreignWords[language].test(text))
      found.push(`${state}: "${text}"`);
  }
  return found;
}
async function walkEveryState(page: Page, language: Language) {
  const L = (text: string) => label(language, text);
  const click = (name: string) =>
    page.getByRole("button", { name: L(name), exact: true }).click();
  const nav = (name: string) =>
    page
      .getByRole("navigation")
      .getByRole("button", { name: new RegExp(`^${L(name)}`) })
      .click();
  const found: string[] = [];
  const check = async (state: string) =>
    found.push(...(await scan(page, language, state)));
  await page.goto("/#/demo");
  await page
    .getByRole("button", {
      name: language === "es" ? "Español" : "English",
      exact: true,
    })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", language);
  await check("entry");
  const role = (who: "maria" | "jose" | "ana") => switchRole(page, who, L);
  await role("jose");
  await expect(
    page.getByRole("heading", { name: L("No earlier offer yet") }),
  ).toBeVisible();
  await check("José, no offer");
  await role("maria");
  await check("María, scheduled");
  await role("ana");
  await check("office overview");
  for (const view of ["Schedule", "Waitlist", "Activity log"]) {
    await nav(view);
    await check(`provider ${view}`);
  }
  await nav("Overview");
  await page.getByRole("searchbox").fill("zzz");
  await expect(
    page.getByRole("heading", { name: L("No matching appointments") }),
  ).toBeVisible();
  await check("empty search filter");
  await click("Reset filters and demo date");
  // The Overview is always the demo day; other dates live on the Schedule.
  await nav("Schedule");
  await page.getByLabel(L("Schedule date"), { exact: true }).fill("2026-10-09");
  await expect(
    page.getByRole("heading", {
      name: L("No sample appointments on this date"),
    }),
  ).toBeVisible();
  await check("empty demo date");
  await click("Reset filters and demo date");
  // María cancels; the AI assistant (simulated) detects, selects and offers.
  await role("maria");
  await click("Cancel my appointment");
  await check("María confirmation");
  await click("Keep my appointment");
  await click("Cancel my appointment");
  await click("Yes, cancel my appointment");
  await check("María cancelled, AI offered");
  await role("ana");
  for (const view of ["Overview", "Schedule", "Waitlist", "Activity log"]) {
    await nav(view);
    await check(`office ${view} while the AI offer is pending`);
  }
  await role("jose");
  await check("José offer");
  await click("Accept earlier visit");
  await check("José confirmation");
  await click("Go back");
  await click("Accept earlier visit");
  await click("Yes, move my appointment");
  await check("José accepted, AI updated and notified");
  await role("maria");
  await check("María after the story");
  await role("ana");
  for (const view of ["Overview", "Schedule", "Waitlist", "Activity log"]) {
    await nav(view);
    await check(`office ${view} after Ana is notified`);
  }
  await click("Reset demo scenario");
  await check("office after reset");
  return found;
}

test("Spanish mode shows no leftover English across every demo state", async ({
  page,
}) => {
  expect(await walkEveryState(page, "es")).toEqual([]);
});
test("English mode shows no leftover Spanish across every demo state", async ({
  page,
}) => {
  expect(await walkEveryState(page, "en")).toEqual([]);
});

// Far from Puerto Rico on both sides of UTC. Displayed demo dates and times
// must still be the America/Puerto_Rico values.
for (const timezoneId of ["Asia/Tokyo", "Pacific/Honolulu"]) {
  test.describe(`browser timezone ${timezoneId}`, () => {
    test.use({ timezoneId });
    test("demo dates and times stay in Puerto Rico time in EN and ES", async ({
      page,
    }) => {
      const expected = {
        en: {
          footer: "Demo date: Oct 8, 2026",
          current: "Thursday, October 22",
          range: "2:00 PM–2:30 PM",
          schedule: "Thursday, October 8 · Atlantic Standard Time",
          first: "8:30 AM",
        },
        es: {
          footer: "Fecha de la demo: 8 oct 2026",
          current: "jueves, 22 de octubre",
          range: "2:00 p. m.–2:30 p. m.",
          schedule: "jueves, 8 de octubre · Hora estándar del Atlántico",
          first: "8:30 a. m.",
        },
      };
      const text = async (selector: string) =>
        plain((await page.locator(selector).first().innerText()) ?? "");
      await page.goto("/#/patient/jose");
      expect(
        await page.evaluate(
          () => Intl.DateTimeFormat().resolvedOptions().timeZone,
        ),
      ).toBe(timezoneId);
      for (const language of ["en", "es"] as const) {
        await page
          .getByRole("button", {
            name: language === "es" ? "Español" : "English",
            exact: true,
          })
          .click();
        await page.goto("/#/patient/jose");
        const want = expected[language];
        expect(await text(".page-footer span:last-child")).toContain(
          want.footer,
        );
        expect(await text(".appointment-date h3")).toBe(want.current);
        expect(await text(".appointment-date p")).toContain(want.range);
        await page.goto("/#/provider");
        expect(await text(".schedule-panel .panel-heading p")).toBe(
          want.schedule,
        );
        expect(await text(".time-cell")).toContain(want.first);
      }
    });
  });
}

const englishTitle = "Smart Appointment Queue";
const spanishTitle = "Smart Queue · Cola de citas";
for (const stored of ["fr", "", "ES", "{garbage", "null"]) {
  test(`stored language ${JSON.stringify(stored)} falls back to English`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#/demo");
    await page.evaluate(
      (value) => localStorage.setItem("smart-queue-language", value),
      stored,
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle(englishTitle);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Explore care without the wait.",
    );
    await expect(
      page.getByRole("button", { name: "English", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(errors).toEqual([]);
  });
}
test("html lang and document title follow the selection and survive reload", async ({
  page,
}) => {
  await page.goto("/#/demo");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(englishTitle);
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveTitle(spanishTitle);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveTitle(spanishTitle);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(englishTitle);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(englishTitle);
});
