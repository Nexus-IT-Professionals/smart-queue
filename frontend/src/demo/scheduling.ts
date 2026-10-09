// Deterministic scheduling support for synthetic fixtures; never clinical triage.
export type PriorityId = "P1" | "P2" | "P3" | "P4";
export type PriorityTone = "danger" | "warning" | "info" | "secondary";
export type PriorityLevel = {
  id: PriorityId;
  label: string;
  description: string;
  tone: PriorityTone;
  rank: number;
  enabled: boolean;
};
export type PriorityConfig = { levels: PriorityLevel[]; defaultId: PriorityId };
export const defaultPriorityConfig = (): PriorityConfig => ({
  defaultId: "P3",
  levels: [
    {
      id: "P1",
      label: "Urgent",
      description: "Patient requires prompt attention",
      tone: "danger",
      rank: 1,
      enabled: true,
    },
    {
      id: "P2",
      label: "High",
      description: "Patient needs an earlier appointment",
      tone: "warning",
      rank: 2,
      enabled: true,
    },
    {
      id: "P3",
      label: "Normal",
      description: "Standard waiting-list request",
      tone: "info",
      rank: 3,
      enabled: true,
    },
    {
      id: "P4",
      label: "Low",
      description: "Flexible scheduling request",
      tone: "secondary",
      rank: 4,
      enabled: true,
    },
  ],
});
export const priorityDisclaimer =
  "Scheduling support only, not emergency medical assessment. Urgency must be entered or confirmed by qualified staff. No AI triage.";
export function validConfig(config: PriorityConfig) {
  const ids = ["P1", "P2", "P3", "P4"];
  return (
    config.levels.length === 4 &&
    ids.every((id) => config.levels.filter((l) => l.id === id).length === 1) &&
    config.levels.some((l) => l.id === config.defaultId && l.enabled) &&
    // A default must not assign urgent status without an individual staff confirmation.
    config.defaultId !== "P1" &&
    new Set(config.levels.map((l) => l.rank)).size === 4 &&
    config.levels.every(
      (l) =>
        l.label.trim().length > 0 &&
        l.label.length <= 32 &&
        l.description.trim().length > 0 &&
        l.description.length <= 160 &&
        ["danger", "warning", "info", "secondary"].includes(l.tone) &&
        Number.isInteger(l.rank) &&
        l.rank >= 1 &&
        l.rank <= 4,
    )
  );
}
export function priorityLevel(config: PriorityConfig, id?: PriorityId) {
  return (
    config.levels.find((l) => l.id === id && l.enabled) ??
    config.levels.find((l) => l.id === config.defaultId && l.enabled) ??
    defaultPriorityConfig().levels[2]
  );
}
export type WaitingPatient = {
  id: string;
  name: string;
  availability: string;
  since: string;
  reason: string;
  language: string;
  priority: PriorityId;
  condition: string;
  from: string;
  through: string;
  start: number;
  end: number;
  office: string;
  provider: string;
  visitType: string;
  duration: number;
  bookingDate: string;
  bookingTime: string;
};
export type Slot = {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  office: string;
  provider: string;
  duration: number;
  patientId?: string;
};
export function sortPatients(
  patients: WaitingPatient[],
  config: PriorityConfig,
) {
  return [...patients].sort(
    (a, b) =>
      priorityLevel(config, a.priority).rank -
        priorityLevel(config, b.priority).rank ||
      a.since.localeCompare(b.since) ||
      a.id.localeCompare(b.id),
  );
}
export function minutes(time: string) {
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time);
  if (!match) return NaN;
  return (
    ((Number(match[1]) % 12) + (match[3] === "PM" ? 12 : 0)) * 60 +
    Number(match[2])
  );
}
export function eligible(
  patient: WaitingPatient,
  slot: Slot,
  bookings: Slot[],
) {
  const start = minutes(slot.time),
    end = start + slot.duration;
  return (
    slot.status === "Open slot" &&
    patient.office === slot.office &&
    patient.provider === slot.provider &&
    patient.visitType === slot.type &&
    patient.duration <= slot.duration &&
    patient.since <= slot.date &&
    slot.date >= patient.from &&
    slot.date <= patient.through &&
    slot.date < patient.bookingDate &&
    start >= patient.start &&
    end <= patient.end &&
    !bookings.some(
      (b) =>
        b.id !== slot.id &&
        b.date === slot.date &&
        ["Scheduled", "Completed"].includes(b.status) &&
        (b.patientId === patient.id || b.provider === slot.provider) &&
        minutes(b.time) < end &&
        minutes(b.time) + b.duration > start,
    )
  );
}
export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return dateKey(d);
}
export function shiftMonth(date: string, offset: number) {
  const d = new Date(`${date}T12:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return dateKey(d);
}
export function calendarDays(date: string, mode: "week" | "month") {
  const d = new Date(`${date}T12:00:00Z`);
  if (mode === "month") d.setUTCDate(1);
  const first = shiftDate(dateKey(d), -((d.getUTCDay() + 6) % 7));
  const length = mode === "week" ? 7 : 42;
  return Array.from({ length }, (_, i) => shiftDate(first, i));
}

export function endTime(time: string, duration: number) {
  const total = minutes(time) + duration;
  const hour = Math.floor(total / 60) % 24;
  return `${hour % 12 || 12}:${String(total % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
