import test from "node:test";
import assert from "node:assert/strict";
import {
  initialDemoState,
  demoReducer,
  demoWaitlist,
  eligibleCandidates,
  calendarAppointments,
  cancellationHistory,
} from "../src/demo/data.ts";
import {
  defaultPriorityConfig,
  validConfig,
  sortPatients,
  eligible,
  calendarDays,
  shiftMonth,
} from "../src/demo/scheduling.ts";
const open = () => demoReducer(initialDemoState(), { type: "cancel" });
const update = (s, id, priority) =>
  demoReducer(s, {
    type: "priority",
    patientId: id,
    priority,
    staffConfirmed: true,
  });
test("compatible candidates exclude higher-priority morning patient; confirmed urgent patient leads", () => {
  let state = update(open(), "WL-002", "P2");
  assert.equal(demoWaitlist(state)[0].id, "WL-002");
  assert.deepEqual(
    eligibleCandidates(state).map((p) => p.id),
    ["WL-004", "WL-001", "WL-003"],
  );
  assert.equal(
    demoReducer(state, {
      type: "priority",
      patientId: "WL-003",
      priority: "P1",
      staffConfirmed: false,
    }),
    state,
  );
  state = update(state, "WL-003", "P1");
  assert.equal(eligibleCandidates(state)[0].id, "WL-003");
  assert.equal(demoWaitlist(state)[0].id, "WL-003");
});
test("priority ties use request date then stable ID, without mutating inputs", () => {
  const state = initialDemoState();
  const people = [
    {
      ...state.patients.find((p) => p.id === "WL-003"),
      priority: "P3",
      since: "2026-10-05",
    },
    { ...state.patients.find((p) => p.id === "WL-001") },
  ];
  const before = structuredClone(people);
  assert.deepEqual(
    sortPatients(people, state.config).map((p) => p.id),
    ["WL-001", "WL-003"],
  );
  assert.deepEqual(people, before);
  people[0].since = "2026-10-04";
  assert.equal(sortPatients(people, state.config)[0].id, "WL-003");
});
test("configuration validates unique ranks and enabled nonurgent default; disabled records migrate safely", () => {
  let state = update(initialDemoState(), "WL-003", "P1");
  for (const mutate of [
    (c) => (c.defaultId = "P1"),
    (c) =>
      c.levels.forEach((l) => {
        l.enabled = false;
      }),
    (c) => (c.levels[0].rank = 2),
    (c) => (c.levels[0].label = ""),
    (c) => (c.levels[0].rank = 1.5),
    (c) => (c.levels[0].tone = "unknown"),
  ]) {
    const config = defaultPriorityConfig();
    mutate(config);
    assert.equal(validConfig(config), false);
    assert.equal(demoReducer(state, { type: "configure", config }), state);
  }
  const config = defaultPriorityConfig();
  config.levels[0].enabled = false;
  config.defaultId = "P4";
  state = demoReducer(state, { type: "configure", config });
  assert.equal(state.patients.find((p) => p.id === "WL-003").priority, "P4");
  assert.equal(
    demoReducer(state, {
      type: "priority",
      patientId: "WL-003",
      priority: "P1",
      staffConfirmed: true,
    }),
    state,
  );
  config.levels[3].label = "external mutation";
  assert.equal(state.config.levels[3].label, "Low");
});
test("staff priority configuration steers the AI's selection; later changes never replace an existing offer", () => {
  let state = update(initialDemoState(), "WL-003", "P4");
  const config = defaultPriorityConfig();
  config.levels[3].rank = 1;
  config.levels[0].rank = 4;
  state = demoReducer(state, { type: "configure", config });
  // Configuration alone never acts: the assistant waits for a cancellation.
  assert.equal(state.phase, "scheduled");
  assert.equal(state.candidateId, undefined);
  state = demoReducer(state, { type: "cancel" });
  assert.equal(state.phase, "offered");
  assert.equal(state.candidateId, "WL-003");
  const selected = state.events.find((e) => e.kind === "selected");
  assert.equal(selected.reasoning.decidedBy, "priority");
  assert.equal(selected.reasoning.priority, "P4");
  state = update(state, "WL-001", "P1");
  assert.equal(state.candidateId, "WL-003");
});
test("all compatibility and overlapping patient/provider constraints are enforced", () => {
  const state = open(),
    bookings = calendarAppointments(state),
    slot = bookings.find((a) => a.id === "SQ-006"),
    patient = state.patients.find((p) => p.id === "WL-001");
  assert.equal(eligible(patient, slot, bookings), true);
  for (const patch of [
    { office: "other" },
    { provider: "other" },
    { visitType: "Follow-up" },
    { duration: 60 },
    { from: "2026-10-09" },
    { through: "2026-10-07" },
    { start: 841 },
    { end: 869 },
    { bookingDate: "2026-10-08" },
    { since: "2026-10-09" },
  ])
    assert.equal(
      eligible({ ...patient, ...patch }, slot, bookings),
      false,
      JSON.stringify(patch),
    );
  for (const status of ["Scheduled", "Completed", "Canceled"])
    assert.equal(eligible(patient, { ...slot, status }, bookings), false);
  for (const conflict of [
    { provider: slot.provider, patientId: "other" },
    { provider: "other", patientId: patient.id },
  ]) {
    const b = {
      ...slot,
      ...conflict,
      id: "conflict",
      time: "2:15 PM",
      status: "Scheduled",
    };
    assert.equal(eligible(patient, slot, [...bookings, b]), false);
    assert.equal(
      eligible(patient, slot, [...bookings, { ...b, time: "2:30 PM" }]),
      true,
    );
    assert.equal(
      eligible(patient, slot, [...bookings, { ...b, status: "Canceled" }]),
      true,
    );
  }
});
test("AI selection and patient confirmation atomically move one booking and release the old slot", () => {
  let state = update(initialDemoState(), "WL-003", "P1");
  state = demoReducer(state, { type: "cancel" });
  assert.equal(state.candidateId, "WL-003");
  assert.equal(
    calendarAppointments(state).find((a) => a.id === "SQ-006").status,
    "Open slot",
  );
  assert.equal(
    calendarAppointments(state).find((a) => a.id === "BOOK-WL-003").status,
    "Scheduled",
  );
  state = demoReducer(state, { type: "accept" });
  const calendar = calendarAppointments(state);
  assert.equal(calendar.find((a) => a.id === "SQ-006").name, "Camila Soto");
  assert.equal(calendar.find((a) => a.id === "SQ-006").priority, "P1");
  assert.equal(
    calendar.find((a) => a.id === "BOOK-WL-003").status,
    "Open slot",
  );
  assert.equal(
    calendar.filter((a) => a.patientId === "WL-003" && a.status === "Scheduled")
      .length,
    1,
  );
  assert.equal(
    demoWaitlist(state).some((p) => p.id === "WL-003"),
    false,
  );
  assert.equal(demoReducer(state, { type: "accept" }), state);
  assert.equal(demoReducer(state, { type: "cancel" }), state);
  assert.equal(cancellationHistory(state).length, 1);
});
test("acceptance rechecks conflicts; reset restores safe state", () => {
  let state = demoReducer(update(initialDemoState(), "WL-003", "P1"), {
    type: "cancel",
  });
  const conflicting = {
    ...state,
    patients: state.patients.map((p) =>
      p.id === "WL-002"
        ? { ...p, bookingDate: "2026-10-08", bookingTime: "2:00 PM" }
        : p,
    ),
  };
  assert.equal(demoReducer(conflicting, { type: "accept" }), conflicting);
  assert.equal(
    calendarAppointments(state).find((a) => a.id === "BOOK-WL-003").status,
    "Scheduled",
  );
  assert.equal(demoWaitlist(state).length, 4);
  state = demoReducer(state, { type: "accept" });
  assert.deepEqual(demoReducer(state, { type: "reset" }), initialDemoState());
});
test("month/week date math covers leap years, year rollover, and Monday grids", () => {
  assert.equal(shiftMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(shiftMonth("2028-01-31", 1), "2028-02-29");
  assert.equal(shiftMonth("2026-12-31", 1), "2027-01-31");
  assert.equal(shiftMonth("2026-01-31", -1), "2025-12-31");
  assert.equal(calendarDays("2026-10-08", "week")[0], "2026-10-05");
  const days = calendarDays("2028-02-14", "month");
  assert.equal(days.length, 42);
  assert.equal(new Set(days).size, 42);
  assert.ok(days.includes("2028-02-29"));
});
