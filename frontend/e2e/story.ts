import { expect, type Page } from "@playwright/test";
import { spanish } from "../src/i18n/catalog";

// Shared steps of the single demo story: María cancels → the AI assistant
// (simulated) offers José the slot → José accepts → the AI updates the
// schedule and notifies Ana. Not a spec file; imported by the specs.
export type Language = "en" | "es";
export type Translate = (text: string) => string;
export const english: Translate = (text) => text;
export const translator =
  (language: Language): Translate =>
  (text) =>
    language === "es" ? (spanish[text] ?? text) : text;
// Header role switch: the three people in the story.
export const roleName = (who: "maria" | "jose" | "ana", t: Translate = english) =>
  who === "maria"
    ? `María ${t("(patient)")}`
    : who === "jose"
      ? `José ${t("(patient)")}`
      : `Ana ${t("(office)")}`;
export async function switchRole(
  page: Page,
  who: "maria" | "jose" | "ana",
  t: Translate = english,
) {
  await page
    .getByRole("group", { name: t("Demo workspace") })
    .getByRole("button", { name: roleName(who, t), exact: true })
    .click();
}
// María cancels in her own view (explicit confirmation); the AI then offers.
export async function cancelAsMaria(page: Page, t: Translate = english) {
  if (!/#\/patient\/maria$/.test(page.url())) await switchRole(page, "maria", t);
  await page
    .getByRole("button", { name: t("Cancel my appointment"), exact: true })
    .click();
  await page
    .getByRole("button", { name: t("Yes, cancel my appointment"), exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: t("Open José's view") }),
  ).toBeVisible();
}
// José accepts in his own view (explicit confirmation); the AI does the rest.
export async function acceptAsJose(page: Page, t: Translate = english) {
  if (!/#\/patient(\/jose)?$/.test(page.url())) await switchRole(page, "jose", t);
  await page
    .getByRole("button", { name: t("Accept earlier visit"), exact: true })
    .click();
  await page
    .getByRole("button", { name: t("Yes, move my appointment"), exact: true })
    .click();
  await expect(page.locator(".success-head")).toBeVisible();
}
// Fills a catalog template ({name}, …) in the given language.
export const fill = (
  t: Translate,
  text: string,
  values: Record<string, string | number>,
) =>
  t(text).replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
