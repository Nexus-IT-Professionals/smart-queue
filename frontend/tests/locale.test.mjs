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
