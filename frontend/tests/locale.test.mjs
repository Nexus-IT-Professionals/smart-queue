import test from "node:test";
import assert from "node:assert/strict";
import { translate, formatDate, formatTime } from "../src/i18n/locale.ts";
import { spanish } from "../src/i18n/catalog.ts";
import {
  demoReducer,
  initialDemoState,
  responseMessages,
  waitlist,
} from "../src/demo/data.ts";
test("catalog values are nonempty and default language preserves English", () => {
  for (const [en, es] of Object.entries(spanish)) {
    assert.ok(es.trim(), en);
    assert.equal(translate("en", en), en);
    assert.equal(translate("es", en), es);
  }
  assert.equal(translate("es", "Elena Morales"), "Elena Morales");
});
test("Puerto Rico calendar and time formatting are independent of host timezone", () => {
  assert.equal(formatDate("en", "2026-10-08"), "Thursday, October 8");
  assert.equal(formatDate("es", "2026-10-08"), "jueves, 8 de octubre");
  assert.match(formatTime("es", "2:00 PM"), /2:00/);
  assert.equal(formatDate("es", ""), "");
});
test("all response and reducer event messages have Spanish translations", () => {
  const open = demoReducer(initialDemoState(), { type: "cancel" });
  const offered = demoReducer(open, { type: "offer" });
  for (const response of ["accepted", "declined", "help"]) {
    const state = demoReducer(offered, { type: "respond", response });
    for (const event of state.events) assert.ok(spanish[event], event);
    assert.ok(spanish[responseMessages[response]]);
  }
  for (const person of waitlist) assert.ok(formatDate("es", person.since));
});
// The catalog is keyed by the English source text, so EN/ES key parity is
// structural; what can drift is the content of each pair. Every Spanish value
// must keep the English placeholders, line breaks and numbers (times, dates,
// counts, IDs) and must actually be translated unless explicitly allowlisted.
const sameInBothLanguages = new Set(["30 min"]); // "min" is also Spanish.
test("catalog pairs keep placeholders, line breaks and numbers", () => {
  const tokens = (text, pattern) => (text.match(pattern) ?? []).sort();
  for (const [en, es] of Object.entries(spanish)) {
    assert.equal(en, en.trim(), `untrimmed key: ${en}`);
    assert.equal(es, es.trim(), `untrimmed value: ${en}`);
    assert.deepEqual(tokens(es, /\{\w+\}/g), tokens(en, /\{\w+\}/g), en);
    assert.deepEqual(tokens(es, /\n/g), tokens(en, /\n/g), en);
    assert.deepEqual(tokens(es, /\d+/g), tokens(en, /\d+/g), en);
    if (!sameInBothLanguages.has(en)) assert.notEqual(es, en, en);
  }
});
// Explicit expected strings: these only hold if the formatter pins
// America/Puerto_Rico, so tests/timezone.test.mjs reruns this file under
// far-away host timezones. Whitespace is normalized because ICU may emit
// narrow/no-break spaces before AM/PM.
test("formatter output matches Puerto Rico wall-clock values exactly", () => {
  const plain = (text) => text.replace(/\s/g, " ");
  const expected = {
    en: ["9:00 AM", "2:00 PM", "2:30 PM", "Thursday, October 22", "Oct 8, 2026", "Oct 5"],
    es: ["9:00 a. m.", "2:00 p. m.", "2:30 p. m.", "jueves, 22 de octubre", "8 oct 2026", "5 oct"],
  };
  for (const [language, values] of Object.entries(expected))
    assert.deepEqual(
      [
        formatTime(language, "9:00 AM"),
        formatTime(language, "2:00 PM"),
        formatTime(language, "2:30 PM"),
        formatDate(language, "2026-10-22"),
        formatDate(language, "2026-10-08", { month: "short", day: "numeric", year: "numeric" }),
        formatDate(language, "2026-10-05", { month: "short", day: "numeric" }),
      ].map(plain),
      values,
    );
});
