import { spanish } from "./catalog.ts";
export type Language = "en" | "es";
export function translate(language: Language, text: string) {
  return language === "es" ? (spanish[text] ?? text) : text;
}
export function formatDate(
  language: Language,
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
) {
  // Calendar dates are parsed at noon UTC, independent of the viewer's timezone.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const value = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(value.getTime())) return "";
  return new Intl.DateTimeFormat(language === "es" ? "es-PR" : "en-US", {
    ...options,
    timeZone: "America/Puerto_Rico",
  }).format(value);
}
export function formatTime(language: Language, time: string) {
  const match = /^(\d+):(\d+) (AM|PM)$/.exec(time);
  if (!match) return time;
  const hour = (Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0);
  return new Intl.DateTimeFormat(language === "es" ? "es-PR" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Puerto_Rico",
  }).format(new Date(Date.UTC(2026, 9, 8, hour + 4, Number(match[2]))));
}
