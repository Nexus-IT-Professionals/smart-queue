import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_ASSISTANT,
  assistantStep,
  calendarAppointments,
  demoWorkspaceFromHash,
  demoReducer,
  initialDemoState,
  demoAppointments,
  demoWaitlist,
  demoIdentities,
  demoAssistant,
  isAssistantEvent,
  runAssistant,
} from "../src/demo/data.ts";
import { spanish } from "../src/i18n/catalog.ts";
const slot = (state) =>
  demoAppointments(state).find((row) => row.id === "SQ-006");
const kinds = (state) =>
  state.events.filter((e) => typeof e !== "string").map((e) => e.kind);
const cancel = () => demoReducer(initialDemoState(), { type: "cancel" });
const finish = () => demoReducer(cancel(), { type: "accept" });

test("public entry, login alias, direct role links and unknown routes never require credentials", () => {
  for (const hash of ["", "#/demo", "#/login", "#/unknown", "#/patient/elena"])
    assert.equal(demoWorkspaceFromHash(hash), "demo");
  assert.equal(demoWorkspaceFromHash("#/provider"), "staff");
  assert.equal(demoWorkspaceFromHash("#/staff"), "staff");
  assert.equal(demoWorkspaceFromHash("#/patient/maria"), "maria");
  assert.equal(demoWorkspaceFromHash("#/patient/jose"), "jose");
  // The earlier single-patient link still opens the waiting patient (José).
  assert.equal(demoWorkspaceFromHash("#/patient"), "jose");
});
test("the AI assistant walks every phase: detect → select → offer, then update → notify Ana", () => {
  let state = { ...initialDemoState(), phase: "cancelled" };
  const phases = [];
  for (let next = assistantStep(state); next !== state; next = assistantStep(state)) {
    state = next;
    phases.push(state.phase);
  }
  assert.deepEqual(phases, ["detected", "selected", "offered"]);
  state = { ...state, phase: "accepted" };
  for (let next = assistantStep(state); next !== state; next = assistantStep(state)) {
    state = next;
    phases.push(state.phase);
  }
  assert.deepEqual(phases, [
    "detected",
    "selected",
    "offered",
    "updated",
    "notified",
  ]);
  // Nothing more to do: the story ends with Ana's notification.
  assert.equal(assistantStep(state), state);
  assert.equal(runAssistant(state), state);
});
test("María cancels, the AI offers José, José accepts, the AI updates the schedule and notifies Ana", () => {
  let state = initialDemoState();
  assert.equal(slot(state).status, "Scheduled");
  assert.equal(slot(state).name, "María Rodríguez");
  state = demoReducer(state, { type: "cancel" });
  // The assistant runs on its own after María's cancellation and waits for José.
  assert.equal(state.phase, "offered");
  assert.equal(state.candidateId, "WL-004");
  assert.deepEqual(kinds(state), ["cancelled", "detected", "selected", "offered"]);
  assert.equal(slot(state).status, "Open slot");
  assert.equal(demoWaitlist(state).length, 4, "nothing moves before José accepts");
  state = demoReducer(state, { type: "accept" });
  assert.equal(state.phase, "notified");
  assert.deepEqual(kinds(state), [
    "cancelled",
    "detected",
    "selected",
    "offered",
    "accepted",
    "updated",
    "notified",
  ]);
  assert.equal(slot(state).name, "José Pérez");
  assert.equal(slot(state).status, "Scheduled");
  const released = calendarAppointments(state).find((a) => a.id === "BOOK-WL-004");
  assert.deepEqual(
    [released.date, released.time, released.status],
    ["2026-10-22", "2:00 PM", "Open slot"],
  );
  assert.equal(demoWaitlist(state).length, 3);
  const updated = state.events.find((e) => e.kind === "updated");
  assert.deepEqual(
    [updated.name, updated.releasedDate, updated.releasedTime, updated.waitlistBefore, updated.waitlistAfter],
    ["José Pérez", "2026-10-22", "2:00 PM", 4, 3],
  );
  assert.deepEqual(state.events.at(-1), { kind: "notified", name: "Ana Martínez" });
  // Only the assistant's own steps carry the AI label.
  assert.deepEqual(
    state.events.filter(isAssistantEvent).map((e) => e.kind),
    ["detected", "selected", "offered", "updated", "notified"],
  );
});
test("the AI's reasoning is the deterministic ranking's own inputs", () => {
  const selected = cancel().events.find((e) => e.kind === "selected");
  assert.equal(selected.name, "José Pérez");
  assert.deepEqual(selected.reasoning, {
    scanned: 4,
    availability: "Afternoons · 1–4 PM",
    priority: "P3",
    priorityLabel: "Normal",
    since: "2026-10-04",
    // Same P3 level as Elena and Camila: the oldest request (Oct 4) decides.
    decidedBy: "request",
    tiedWith: ["Elena Morales", "Camila Soto"],
    next: { name: "Elena Morales", since: "2026-10-05" },
    // Nicolás is mornings only; 2:00 PM is outside his window.
    excluded: [
      { name: "Nicolás Díaz", availability: "Mornings · 9–11 AM", reason: "time" },
    ],
  });
});
test("guards: accept before the offer is ignored; double cancel and double accept apply once", () => {
  const initial = initialDemoState();
  assert.equal(demoReducer(initial, { type: "accept" }), initial);
  const offered = cancel();
  assert.equal(demoReducer(offered, { type: "cancel" }), offered);
  const done = demoReducer(offered, { type: "accept" });
  assert.equal(demoReducer(done, { type: "accept" }), done);
  assert.equal(demoReducer(done, { type: "cancel" }), done);
  assert.equal(done.events.length, 7);
  assert.equal(demoWaitlist(done).length, 3);
});
test("no eligible patient: the AI reports it and leaves the slot open", () => {
  const nobody = {
    ...initialDemoState(),
    patients: initialDemoState().patients.map((p) => ({ ...p, start: 540, end: 660 })),
  };
  const state = demoReducer(nobody, { type: "cancel" });
  assert.equal(state.phase, "unmatched");
  assert.deepEqual(kinds(state), ["cancelled", "detected", "unmatched"]);
  assert.equal(slot(state).status, "Open slot");
  assert.equal(demoReducer(state, { type: "accept" }), state);
});
test("reset restores every fixture; independent judge sessions do not share state", () => {
  const first = finish();
  const second = initialDemoState();
  assert.equal(slot(second).name, "María Rodríguez");
  assert.equal(second.events.length, 0);
  const reset = demoReducer(first, { type: "reset" });
  assert.deepEqual(reset, second);
  assert.equal(reset.phase, "scheduled");
  assert.equal(reset.candidateId, undefined);
  assert.equal(demoWaitlist(reset).length, 4);
  assert.equal(
    calendarAppointments(reset).find((a) => a.id === "BOOK-WL-004").status,
    "Scheduled",
  );
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
  const offered = cancel();
  assert.equal(offered.candidateId, "WL-004");
  assert.deepEqual(offered.events.at(-1), {
    kind: "offered",
    patientId: "WL-004",
    name: "José Pérez",
  });
  const accepted = demoReducer(offered, { type: "accept" });
  assert.equal(slot(accepted).name, "José Pérez");
  assert.deepEqual(names(accepted), [
    "Elena Morales",
    "Nicolás Díaz",
    "Camila Soto",
  ]);
  for (const person of demoWaitlist(initialDemoState()))
    assert.ok(person.availability in spanish, person.availability);
});
test("the roles: María cancels, José waits, Ana (office) observes Dr. Carlos Rivera's schedule", () => {
  assert.deepEqual(demoAssistant, {
    name: "Ana Martínez",
    label: "Medical Office Assistant · fictional identity",
  });
  assert.equal(demoIdentities.staff.name, "Dr. Carlos Rivera");
  assert.equal(demoIdentities.maria.name, "María Rodríguez");
  assert.equal(demoIdentities.jose.name, "José Pérez");
  assert.equal(
    spanish[demoAssistant.label],
    "Asistente de oficina médica · identidad ficticia",
  );
  assert.equal(AI_ASSISTANT, "AI assistant (simulated)");
  assert.equal(spanish[AI_ASSISTANT], "Asistente de IA (simulado)");
  // María's cancellation and José's acceptance are theirs, not the AI's.
  const [cancelled] = finish().events;
  assert.deepEqual(cancelled, { kind: "cancelled", name: "María Rodríguez" });
  assert.equal(isAssistantEvent(cancelled), false);
  assert.match(
    spanish["Welcome, María. Plans changed? You can cancel below."],
    /^Bienvenida, María\./,
  );
  assert.match(
    spanish["Welcome, José. An earlier appointment could fit your day."],
    /^Bienvenido, José\./,
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
