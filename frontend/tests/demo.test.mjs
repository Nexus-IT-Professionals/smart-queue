import test from "node:test";
import assert from "node:assert/strict";
import {
  demoWorkspaceFromHash,
  demoReducer,
  initialDemoState,
  demoAppointments,
  demoWaitlist,
  demoIdentities,
  demoAssistant,
} from "../src/demo/data.ts";
import { spanish } from "../src/i18n/catalog.ts";
const slot = (state) =>
  demoAppointments(state).find((row) => row.id === "SQ-006");
const offer = () =>
  demoReducer(demoReducer(initialDemoState(), { type: "cancel" }), {
    type: "offer",
  });

test("public entry, login alias, direct role links and unknown routes never require credentials", () => {
  for (const hash of ["", "#/demo", "#/login", "#/unknown"])
    assert.equal(demoWorkspaceFromHash(hash), "demo");
  assert.equal(demoWorkspaceFromHash("#/provider"), "staff");
  assert.equal(demoWorkspaceFromHash("#/staff"), "staff");
  assert.equal(demoWorkspaceFromHash("#/patient"), "patient");
});
test("cancellation to offer to acceptance updates schedule, waitlist and activity", () => {
  let state = initialDemoState();
  assert.equal(slot(state).status, "Scheduled");
  state = demoReducer(state, { type: "cancel" });
  assert.equal(slot(state).status, "Open slot");
  state = demoReducer(state, { type: "offer" });
  for (const hash of ["#/patient", "#/demo", "#/login", "#/provider"])
    demoWorkspaceFromHash(hash);
  assert.equal(state.phase, "offered");
  state = demoReducer(state, { type: "respond", response: "accepted" });
  assert.equal(slot(state).name, "José Pérez");
  assert.equal(slot(state).status, "Scheduled");
  assert.equal(demoWaitlist(state).length, 3);
  assert.equal(state.events.length, 3);
  assert.deepEqual(
    demoReducer(state, { type: "respond", response: "accepted" }),
    state,
  );
});
test("out-of-order and duplicate provider actions do not mutate the demo", () => {
  const initial = initialDemoState();
  assert.equal(demoReducer(initial, { type: "offer" }), initial);
  assert.equal(
    demoReducer(initial, { type: "respond", response: "accepted" }),
    initial,
  );
  const offered = offer();
  assert.equal(demoReducer(offered, { type: "cancel" }), offered);
  assert.equal(demoReducer(offered, { type: "offer" }), offered);
});
test("decline preserves waitlist and open capacity; help permits a later answer", () => {
  const declined = demoReducer(offer(), {
    type: "respond",
    response: "declined",
  });
  assert.equal(slot(declined).status, "Open slot");
  assert.equal(demoWaitlist(declined).length, 4);
  assert.equal(
    demoReducer(declined, { type: "respond", response: "accepted" }),
    declined,
  );
  const help = demoReducer(offer(), { type: "respond", response: "help" });
  assert.equal(demoReducer(help, { type: "respond", response: "help" }), help);
  assert.equal(
    demoReducer(help, { type: "respond", response: "accepted" }).phase,
    "accepted",
  );
});
test("reset and independent judge sessions do not share state", () => {
  const first = demoReducer(offer(), { type: "respond", response: "accepted" });
  const second = initialDemoState();
  assert.equal(slot(second).name, "María Rodríguez");
  assert.equal(second.events.length, 0);
  const reset = demoReducer(first, { type: "reset" });
  assert.deepEqual(reset, second);
  assert.equal(demoWaitlist(reset).length, 4);
});

test("Adrián López is the first 8:30 AM slot; María Rodríguez holds the 2:00 PM slot; the day has 9 slots", () => {
  const day = demoAppointments(initialDemoState());
  assert.equal(day.length, 9);
  assert.deepEqual(day[0], {
    id: "SQ-009",
    date: "2026-10-08",
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Adrián López",
    time: "8:30 AM",
    type: "Follow-up",
    status: "Scheduled",
  });
  const twoPm = day.find((row) => row.id === "SQ-006");
  assert.deepEqual(
    [twoPm.name, twoPm.time, twoPm.status],
    ["María Rodríguez", "2:00 PM", "Scheduled"],
  );
  assert.equal(
    day.filter((row) => row.name === "María Rodríguez").length,
    1,
    "no duplicate María",
  );
  assert.equal(new Set(day.map((row) => row.id)).size, 9, "record IDs unique");
  const counts = (status) => day.filter((row) => row.status === status).length;
  assert.deepEqual(
    [counts("Scheduled"), counts("Completed"), counts("Open slot")],
    [6, 3, 0],
  );
});
test("José Pérez tops the waitlist, receives the offer and is the one removed; Elena stays waiting", () => {
  const names = (state) => demoWaitlist(state).map((person) => person.name);
  assert.deepEqual(names(initialDemoState()), [
    "José Pérez",
    "Elena Morales",
    "Nicolás Díaz",
    "Camila Soto",
  ]);
  const offered = offer();
  assert.equal(offered.candidateId, "WL-004");
  assert.match(offered.events.at(-1), /offer to José Pérez.$/);
  const accepted = demoReducer(offered, {
    type: "respond",
    response: "accepted",
  });
  assert.equal(slot(accepted).name, "José Pérez");
  assert.deepEqual(names(accepted), [
    "Elena Morales",
    "Nicolás Díaz",
    "Camila Soto",
  ]);
  for (const person of demoWaitlist(initialDemoState()))
    assert.ok(person.availability in spanish, person.availability);
});
test("Ana Martínez is the fictional assistant and the actor on cancellation and offer events", () => {
  assert.deepEqual(demoAssistant, {
    name: "Ana Martínez",
    label: "Medical Office Assistant · fictional identity",
  });
  assert.equal(demoIdentities.staff.name, "Dr. Carlos Rivera");
  assert.equal(demoIdentities.patient.name, "José Pérez");
  assert.equal(
    spanish[demoAssistant.label],
    "Asistente de oficina médica · identidad ficticia",
  );
  const [cancelled, offered] = offer().events;
  assert.equal(
    cancelled,
    "Ana Martínez, Medical Office Assistant, confirmed the sample cancellation: October 8, 2:00 PM.",
  );
  assert.equal(
    offered,
    "Ana Martínez, Medical Office Assistant, sent a simulated in-app offer to José Pérez.",
  );
  assert.match(
    spanish[cancelled],
    /^Ana Martínez, asistente de oficina médica, confirmó/,
  );
  assert.match(
    spanish[offered],
    /^Ana Martínez, asistente de oficina médica, envió .* a José Pérez.$/,
  );
});

test("demo health request omits credentials and preserves abort signal", async () => {
  const { getHealth } = await import("../src/api/client.ts");
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ status: "ok" }) };
  };
  try {
    assert.deepEqual(await getHealth(controller.signal), { status: "ok" });
    assert.equal(request.url, "/api/health");
    assert.equal(request.options.credentials, "omit");
    assert.equal(request.options.signal, controller.signal);
    assert.equal(request.options.body, undefined);
    assert.equal(request.options.headers.Authorization, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
