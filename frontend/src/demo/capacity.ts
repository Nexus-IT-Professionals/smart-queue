import {
  calendarDays,
  eligible,
  minutes,
  priorityLevel,
  endTime,
  shiftDate,
  sortPatients,
  type PriorityConfig,
  type PriorityId,
  type WaitingPatient,
} from "./scheduling.ts";

export type Period = "day" | "week" | "month";
export type CapacityConfig = {
  days: number[];
  start: number;
  end: number;
  duration: number;
  seats: number;
  resources: number;
};
export type CapacitySlot = {
  id: string;
  date: string;
  time: string;
  type: string;
  status: "Scheduled" | "Completed" | "Open slot";
  office: string;
  provider: string;
  duration: number;
  patientId?: string;
  name: string;
  priority?: PriorityId;
  scheduled: number;
  released: { eligible: boolean; filled: boolean }[];
  moved: number;
  assigned: number;
};
export type CapacityState = {
  config: CapacityConfig;
  month: string;
  slots: CapacitySlot[];
  waiting: WaitingPatient[];
  revision: number;
};
export type CapacityAction =
  | { type: "generate"; month: string; config: CapacityConfig }
  | { type: "cancel" | "complete" | "book"; id: string }
  | { type: "assign"; id: string; patientId: string; confirmed: boolean }
  | { type: "move"; id: string; target: string; confirmed: boolean }
  | {
      type: "priority";
      patientId: string;
      priority: PriorityId;
      confirmed: boolean;
    };
export const defaultCapacity = (): CapacityConfig => ({
  days: [1, 2, 3, 4, 5],
  start: 480,
  end: 1080,
  duration: 30,
  seats: 20,
  resources: 1,
});
export function validCapacity(c: CapacityConfig) {
  return (
    [c.start, c.end, c.duration, c.seats, c.resources].every(
      Number.isInteger,
    ) &&
    c.start >= 0 &&
    c.end <= 1440 &&
    c.end > c.start &&
    c.duration >= 5 &&
    c.duration <= 240 &&
    c.seats >= 0 &&
    c.seats <= Math.floor((c.end - c.start) / c.duration) &&
    c.resources >= 1 &&
    c.resources <= 4 &&
    new Set(c.days).size === c.days.length &&
    c.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  );
}
export function periodDates(date: string, period: Period): string[] {
  if (period === "day") return [date];
  if (period === "week") return calendarDays(date, "week");
  const first = `${date.slice(0, 7)}-01`;
  const result = [];
  for (let d = first; d.slice(0, 7) === date.slice(0, 7); d = shiftDate(d, 1))
    result.push(d);
  return result;
}
export function capacityOn(date: string, c: CapacityConfig) {
  return c.days.includes(new Date(`${date}T12:00:00Z`).getUTCDay())
    ? c.seats * c.resources
    : 0;
}
export function currentMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Puerto_Rico",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}
const names = [
  "Alma Vega",
  "Bruno Cruz",
  "Clara Soto",
  "Diego Ríos",
  "Eva Ortiz",
  "Félix Rivera",
  "Gloria Díaz",
  "Hugo Torres",
];
export function generateCapacity(
  month: string,
  config = defaultCapacity(),
): CapacityState {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !validCapacity(config))
    throw new Error("Invalid demo configuration");
  const slots: CapacitySlot[] = [];
  const waiting: WaitingPatient[] = [];
  const last = periodDates(`${month}-01`, "month").at(-1) as string;
  for (let r = 1; r <= config.resources; r++) {
    const provider = `RESOURCE-${r}`;
    for (let p = 0; p < 4; p++)
      waiting.push({
        id: `CW-${r}-${p}`,
        name: names[(r + p) % names.length],
        priority: (["P1", "P2", "P3", "P4"] as const)[p],
        condition: "Synthetic patient",
        availability: "Flexible scheduling request",
        since: `${month}-01`,
        reason: "Earlier appointment",
        language: "Spanish",
        from: `${month}-01`,
        through: last,
        start: config.start,
        end: config.end,
        office: "ISLA",
        provider,
        visitType: "Consultation",
        duration: config.duration,
        bookingDate: shiftDate(last, 14),
        bookingTime: "9:00 AM",
      });
    for (const date of periodDates(`${month}-01`, "month")) {
      if (!capacityOn(date, config)) continue;
      const occupied = Math.round(config.seats * 0.9);
      // Stable, varying open times while retaining approximately 90% occupancy.
      const offset = Number(date.slice(-2)) % Math.max(1, config.seats);
      for (let i = 0; i < config.seats; i++) {
        const rank = (i + offset) % config.seats;
        const booked = rank < occupied;
        const canceled = rank === occupied;
        const id = `CAP-${date}-${r}-${i}`;
        slots.push({
          id,
          date,
          time: endTime("12:00 AM", config.start + i * config.duration),
          duration: config.duration,
          office: "ISLA",
          provider,
          type: "Consultation",
          status: booked ? (rank < 3 ? "Completed" : "Scheduled") : "Open slot",
          name: booked
            ? names[(i + r) % names.length]
            : "Available appointment",
          patientId: booked ? `SYN-${id}` : undefined,
          priority: booked
            ? (["P1", "P2", "P3", "P4"] as const)[i % 4]
            : undefined,
          scheduled: booked || canceled ? 1 : 0,
          released: canceled ? [{ eligible: true, filled: false }] : [],
          moved: 0,
          assigned: 0,
        });
      }
    }
  }
  return {
    config: structuredClone(config),
    month,
    slots,
    waiting,
    revision: 0,
  };
}
export function capacityCandidates(
  state: CapacityState,
  slot: CapacitySlot,
  config: PriorityConfig,
) {
  return sortPatients(
    state.waiting.filter((p) => eligible(p, slot, state.slots)),
    config,
  );
}
export function capacityReducer(
  state: CapacityState,
  action: CapacityAction,
  priorities: PriorityConfig,
): CapacityState {
  if (action.type === "generate") {
    if (
      !validCapacity(action.config) ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(action.month)
    )
      return state;
    const generated = generateCapacity(action.month, action.config);
    generated.waiting = generated.waiting.map((p) => ({
      ...p,
      priority: priorityLevel(priorities, p.priority).id,
    }));
    generated.slots = generated.slots.map((s) => ({
      ...s,
      priority: s.priority
        ? priorityLevel(priorities, s.priority).id
        : undefined,
    }));
    return generated;
  }
  if (action.type === "priority") {
    if (
      !action.confirmed ||
      !priorities.levels.some((p) => p.id === action.priority && p.enabled)
    )
      return state;
    return {
      ...state,
      waiting: state.waiting.map((p) =>
        p.id === action.patientId ? { ...p, priority: action.priority } : p,
      ),
    };
  }
  const source = state.slots.find((s) => s.id === action.id);
  if (!source) return state;
  const next = structuredClone(state),
    slot = next.slots.find((s) => s.id === action.id) as CapacitySlot;
  const revision = state.revision + 1;
  if (
    (action.type === "book" || action.type === "assign") &&
    state.slots.some(
      (s) =>
        s.id !== slot.id &&
        s.date === slot.date &&
        s.provider === slot.provider &&
        s.status !== "Open slot" &&
        minutes(s.time) < minutes(slot.time) + slot.duration &&
        minutes(s.time) + s.duration > minutes(slot.time),
    )
  )
    return state;

  const clear = () => {
    slot.status = "Open slot";
    slot.name = "Available appointment";
    delete slot.patientId;
    delete slot.priority;
  };
  if (action.type === "cancel" && slot.status === "Scheduled") {
    const open = { ...slot, status: "Open slot" as const };
    slot.released.push({
      eligible: capacityCandidates(state, open, priorities).length > 0,
      filled: false,
    });
    clear();
  } else if (action.type === "complete" && slot.status === "Scheduled")
    slot.status = "Completed";
  else if (action.type === "book" && slot.status === "Open slot") {
    slot.status = "Scheduled";
    slot.name = names[revision % names.length];
    slot.patientId = `NEW-${revision}`;
    slot.priority = priorities.defaultId;
    slot.scheduled++;
  } else if (
    action.type === "assign" &&
    action.confirmed &&
    slot.status === "Open slot"
  ) {
    const p = capacityCandidates(state, slot, priorities).find(
      (p) => p.id === action.patientId,
    );
    if (!p) return state;
    slot.status = "Scheduled";
    slot.name = p.name;
    slot.patientId = p.id;
    slot.priority = p.priority;
    slot.scheduled++;
    slot.assigned++;
    const released = slot.released.at(-1);
    if (released?.eligible && !released.filled) released.filled = true;
    next.waiting = next.waiting.filter((w) => w.id !== p.id);
  } else if (
    action.type === "move" &&
    action.confirmed &&
    slot.status === "Scheduled"
  ) {
    const target = next.slots.find((s) => s.id === action.target);
    if (
      target?.status !== "Open slot" ||
      target.provider !== slot.provider ||
      target.duration !== slot.duration ||
      target.type !== slot.type
    )
      return state;
    const candidate: WaitingPatient = {
      id: slot.patientId ?? slot.id,
      name: slot.name,
      priority: slot.priority ?? priorities.defaultId,
      availability: "",
      since: "0001-01-01",
      reason: "",
      language: "",
      condition: "",
      from: `${state.month}-01`,
      through: periodDates(`${state.month}-01`, "month").at(-1) as string,
      start: state.config.start,
      end: state.config.end,
      office: slot.office,
      provider: slot.provider,
      visitType: slot.type,
      duration: slot.duration,
      bookingDate: "9999-12-31",
      bookingTime: slot.time,
    };
    if (
      !eligible(
        candidate,
        target,
        next.slots.filter((s) => s.id !== slot.id),
      )
    )
      return state;
    Object.assign(target, {
      status: "Scheduled",
      name: slot.name,
      patientId: slot.patientId,
      priority: slot.priority,
      scheduled: target.scheduled + 1,
      moved: target.moved + 1,
    });
    slot.scheduled--; // Move the reservation denominator with the booking, never count it twice.
    clear();
  } else return state;
  return { ...next, revision };
}
export function statistics(
  state: CapacityState,
  date: string,
  period: Period,
  resource = "all",
) {
  const dates = periodDates(date, period),
    wanted = new Set(dates);
  const rows = state.slots.filter(
    (s) =>
      wanted.has(s.date) && (resource === "all" || s.provider === resource),
  );
  // Only generated snapshots have known capacity; never invent empty historical months.
  const resourceExists =
    resource === "all" ||
    Array.from(
      { length: state.config.resources },
      (_, i) => `RESOURCE-${i + 1}`,
    ).includes(resource);
  const known = dates.filter(
    (d) => resourceExists && d.slice(0, 7) === state.month,
  );
  const capacity = known.reduce(
    (n, d) =>
      n +
      capacityOn(d, state.config) /
        (resource === "all" ? 1 : state.config.resources),
    0,
  );
  const occupied = rows.filter((s) => s.status !== "Open slot").length;
  const canceled = rows.reduce((n, s) => n + s.released.length, 0);
  const releases = rows.flatMap((s) => s.released),
    eligibleReleases = releases.filter((e) => e.eligible).length;
  const filled = releases.filter((e) => e.eligible && e.filled).length;
  const scheduled = rows.reduce((n, s) => n + s.scheduled, 0);
  const percent = (n: number, d: number) => (d ? (100 * n) / d : 0);
  const waiting = state.waiting.filter(
    (p) => resource === "all" || p.provider === resource,
  );
  const trend = dates
    .filter(
      (d) => d.slice(0, 7) === state.month && capacityOn(d, state.config) > 0,
    )
    .map((d) => ({
      date: d,
      capacity:
        capacityOn(d, state.config) /
        (resource === "all" ? 1 : state.config.resources),
      occupied: rows.filter((s) => s.date === d && s.status !== "Open slot")
        .length,
    }));
  return {
    capacity,
    occupied,
    available: capacity - occupied,
    occupancy: percent(occupied, capacity),
    availability: percent(capacity - occupied, capacity),
    canceled,
    scheduled,
    cancellationRate: percent(canceled, scheduled),
    eligibleReleases,
    filled,
    assigned: rows.reduce((n, s) => n + s.assigned, 0),
    fillRate: percent(filled, eligibleReleases),
    completed: rows.filter((s) => s.status === "Completed").length,
    rescheduled: rows.reduce((n, s) => n + s.moved, 0),
    waiting: waiting.length,
    priorities: Object.fromEntries(
      (["P1", "P2", "P3", "P4"] as const).map((p) => [
        p,
        waiting.filter((w) => w.priority === p).length,
      ]),
    ),
    trend,
    partial: known.length !== dates.length,
  };
}
