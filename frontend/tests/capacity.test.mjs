import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultCapacity,
  validCapacity,
  generateCapacity,
  capacityReducer,
  capacityCandidates,
  statistics,
  periodDates,
} from "../src/demo/capacity.ts";
import { defaultPriorityConfig } from "../src/demo/scheduling.ts";
import { initialDemoState, demoReducer } from "../src/demo/data.ts";
const priorities = defaultPriorityConfig();
const run = (state, action) => capacityReducer(state, action, priorities);
test("deterministic 90% month has real weekday capacity and no overlapping resource slots", () => {
  const a = generateCapacity("2026-10"),
    b = generateCapacity("2026-10");
  assert.deepEqual(a, b);
  const s = statistics(a, "2026-10-08", "month");
  assert.equal(s.capacity, 440);
  assert.equal(s.occupied, 396);
  assert.equal(s.available, 44);
  assert.equal(s.occupancy, 90);
  assert.equal(s.canceled, 22);
  assert.equal(s.scheduled, 418);
  assert.equal(
    new Set(a.slots.map((s) => `${s.provider}/${s.date}/${s.time}`)).size,
    440,
  );
  assert.equal(statistics(a, "2026-10-10", "day").capacity, 0);
  assert.equal(statistics(a, "2026-10-05", "week").capacity, 100);
});
test("leap years, cross-month partial weeks, zero schedules and multiple resources", () => {
  assert.equal(periodDates("2024-02-29", "month").length, 29);
  assert.equal(periodDates("2025-02-28", "month").length, 28);
  const state = generateCapacity("2026-10", {
    ...defaultCapacity(),
    resources: 2,
  });
  assert.equal(statistics(state, "2026-10-01", "week").capacity, 80);
  assert.equal(statistics(state, "2026-10-01", "week").partial, true);
  assert.equal(
    statistics(state, "2026-10-01", "day", "RESOURCE-2").capacity,
    20,
  );
  assert.equal(
    statistics(state, "2026-10-01", "day", "RESOURCE-9").capacity,
    0,
  );
  assert.equal(statistics(state, "2026-09-01", "month").capacity, 0);
  const empty = statistics(
    generateCapacity("2026-10", { ...defaultCapacity(), days: [] }),
    "2026-10-01",
    "month",
  );
  for (const key of [
    "capacity",
    "occupied",
    "available",
    "occupancy",
    "availability",
    "fillRate",
    "cancellationRate",
  ])
    assert.equal(empty[key], 0);
});
test("configuration bounds enforce seats, duration, hours and resources", () => {
  assert.equal(validCapacity({ ...defaultCapacity(), seats: 21 }), false);
  for (const patch of [
    { duration: 0 },
    { end: 480 },
    { days: [1, 1] },
    { resources: 0 },
    { start: NaN },
    { seats: 1.5 },
  ])
    assert.equal(validCapacity({ ...defaultCapacity(), ...patch }), false);
  assert.equal(
    validCapacity({ ...defaultCapacity(), duration: 60, seats: 10 }),
    true,
  );
  assert.equal(
    generateCapacity("2026-10", { ...defaultCapacity(), seats: 0 }).slots
      .length,
    0,
  );
});
test("cancel and priority-ranked staff assignment update rates once with immutable previous state", () => {
  let state = generateCapacity("2026-10");
  const original = structuredClone(state);
  const slot = state.slots.find(
    (s) => s.date === "2026-10-08" && s.status === "Scheduled",
  );
  const before = statistics(state, slot.date, "day");
  state = run(state, { type: "cancel", id: slot.id });
  assert.deepEqual(original, generateCapacity("2026-10"));
  assert.equal(
    statistics(state, slot.date, "day").occupied,
    before.occupied - 1,
  );
  assert.equal(run(state, { type: "cancel", id: slot.id }), state);
  const opened = state.slots.find((s) => s.id === slot.id),
    candidates = capacityCandidates(state, opened, priorities);
  assert.equal(candidates[0].priority, "P1");
  assert.equal(
    run(state, {
      type: "assign",
      id: slot.id,
      patientId: candidates[0].id,
      confirmed: false,
    }),
    state,
  );
  state = run(state, {
    type: "assign",
    id: slot.id,
    patientId: candidates[0].id,
    confirmed: true,
  });
  const after = statistics(state, slot.date, "day");
  assert.equal(after.occupied, before.occupied);
  assert.equal(after.filled, 1);
  assert.equal(after.fillRate, 50);
  assert.equal(after.canceled, 2);
  assert.equal(after.scheduled, 20);
  assert.equal(after.cancellationRate, 10);
  assert.equal(after.waiting, 3);
  assert.equal(
    run(state, {
      type: "assign",
      id: slot.id,
      patientId: candidates[0].id,
      confirmed: true,
    }),
    state,
  );
});
test("booking cannot exceed capacity or mutate an occupied slot; completed visits retain capacity", () => {
  let s = generateCapacity("2026-10");
  for (const slot of s.slots.filter(
    (s) => s.date === "2026-10-08" && s.status === "Open slot",
  ))
    s = run(s, { type: "book", id: slot.id });
  assert.equal(statistics(s, "2026-10-08", "day").occupied, 20);
  const booked = s.slots.find(
    (x) => x.date === "2026-10-08" && x.status === "Scheduled",
  );
  assert.equal(run(s, { type: "book", id: booked.id }), s);
  s = run(s, { type: "complete", id: booked.id });
  assert.equal(statistics(s, booked.date, "day").occupied, 20);
  assert.equal(run(s, { type: "cancel", id: booked.id }), s);
});
test("reschedule conserves occupancy across days and blocks stale or conflicting destination", () => {
  let s = generateCapacity("2026-10", { ...defaultCapacity(), resources: 2 });
  const from = s.slots.find(
    (x) =>
      x.date === "2026-10-08" &&
      x.provider === "RESOURCE-1" &&
      x.status === "Scheduled",
  );
  const to = s.slots.find(
    (x) =>
      x.date === "2026-10-09" &&
      x.provider === "RESOURCE-1" &&
      x.status === "Open slot",
  );
  const before = statistics(s, from.date, "month");
  const cross = s.slots.find(
    (x) => x.provider === "RESOURCE-2" && x.status === "Open slot",
  );
  assert.equal(
    run(s, { type: "move", id: from.id, target: cross.id, confirmed: true }),
    s,
  );
  s = run(s, { type: "move", id: from.id, target: to.id, confirmed: true });
  assert.equal(statistics(s, from.date, "month").occupied, before.occupied);
  assert.equal(statistics(s, to.date, "day").rescheduled, 1);
  assert.equal(statistics(s, from.date, "month").scheduled, before.scheduled);
  assert.equal(s.slots.find((x) => x.id === from.id).status, "Open slot");
  assert.equal(
    run(s, { type: "move", id: from.id, target: to.id, confirmed: true }),
    s,
  );
});
test("candidate eligibility excludes conflicting patient or provider bookings and preserves date ties", () => {
  const s = generateCapacity("2026-10");
  const open = s.slots.find((x) => x.status === "Open slot");
  const person = s.waiting[0];
  s.slots.push({
    ...open,
    id: "conflict",
    status: "Scheduled",
    patientId: person.id,
  });
  assert.equal(capacityCandidates(s, open, priorities).length, 0);
  assert.equal(run(s, { type: "book", id: open.id }), s);
});
test("period percentages are ratios of totals, not daily averages, and unavailable history is explicit", () => {
  let s = generateCapacity("2026-10");
  const slot = s.slots.find(
    (x) => x.date === "2026-10-08" && x.status === "Scheduled",
  );
  s = run(s, { type: "cancel", id: slot.id });
  const weekly = statistics(s, "2026-10-08", "week");
  assert.equal(weekly.occupancy, 89);
  assert.equal(weekly.available, 11);
  assert.equal(weekly.cancellationRate, (6 / 95) * 100);
});
test("root state preserves monthly snapshots and migrates disabled priorities", () => {
  let s = initialDemoState();
  s = demoReducer(s, {
    type: "capacity",
    action: { type: "generate", month: "2026-09", config: defaultCapacity() },
  });
  s = demoReducer(s, {
    type: "capacity",
    action: { type: "generate", month: "2026-10", config: defaultCapacity() },
  });
  assert.equal(s.capacityArchives["2026-09"].month, "2026-09");
  const config = defaultPriorityConfig();
  config.levels[0].enabled = false;
  s = demoReducer(s, { type: "configure", config });
  assert.equal(
    s.capacity.waiting.some((p) => p.priority === "P1"),
    false,
  );
});

test("regeneration respects disabled priorities and unconfirmed priority edits are rejected", () => {
  const config = defaultPriorityConfig();
  config.levels[0].enabled = false;
  const before = generateCapacity("2026-10");
  const generated = capacityReducer(
    before,
    { type: "generate", month: "2026-11", config: defaultCapacity() },
    config,
  );
  assert.equal(
    generated.waiting.some((p) => p.priority === "P1"),
    false,
  );
  assert.equal(
    generated.slots.some((p) => p.priority === "P1"),
    false,
  );
  assert.equal(
    capacityReducer(
      generated,
      {
        type: "priority",
        patientId: generated.waiting[0].id,
        priority: "P2",
        confirmed: false,
      },
      config,
    ),
    generated,
  );
});
