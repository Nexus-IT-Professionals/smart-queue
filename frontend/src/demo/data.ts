import {
  capacityReducer,
  currentMonth,
  generateCapacity,
  type CapacityState,
  type CapacityAction,
} from "./capacity.ts";
import {
  defaultPriorityConfig,
  eligible,
  minutes,
  priorityLevel,
  sortPatients,
  validConfig,
  type PriorityConfig,
  type PriorityId,
  type WaitingPatient,
} from "./scheduling.ts";
// Fictional, in-memory fixtures for the UI preview. Never patient or API data.
export const DEMO_DATE = "2026-10-08";
export const OFFICE = "Isla Care · San Juan";
export type Appointment = {
  date: string;
  office: string;
  provider: string;
  duration: number;
  patientId?: string;
  priority?: PriorityId;
  id: string;
  name: string;
  time: string;
  type: string;
  status: "Completed" | "Scheduled" | "Open slot" | "Canceled";
};
export const appointments: Appointment[] = [
  {
    // Record IDs are assigned in booking order, not by time: SQ-009 is the
    // next unused ID, so the existing SQ-001…SQ-008 references stay stable.
    id: "SQ-009",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Adrián López",
    time: "8:30 AM",
    type: "Follow-up",
    status: "Scheduled",
  },
  {
    id: "SQ-001",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Lucía Rivera",
    time: "9:00 AM",
    type: "Follow-up",
    status: "Completed",
  },
  {
    id: "SQ-002",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Mateo Santos",
    time: "9:30 AM",
    type: "Consultation",
    status: "Completed",
  },
  {
    id: "SQ-003",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Isabel Cruz",
    time: "10:00 AM",
    type: "Follow-up",
    status: "Completed",
  },
  {
    id: "SQ-004",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Daniel Vega",
    time: "10:30 AM",
    type: "Consultation",
    status: "Scheduled",
  },
  {
    id: "SQ-005",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Sofía Torres",
    time: "11:00 AM",
    type: "Follow-up",
    status: "Scheduled",
  },
  {
    id: "SQ-006",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Available appointment",
    time: "2:00 PM",
    type: "Consultation",
    status: "Open slot",
  },
  {
    id: "SQ-007",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Gabriel Ortiz",
    time: "2:30 PM",
    type: "Consultation",
    status: "Scheduled",
  },
  {
    id: "SQ-008",
    date: DEMO_DATE,
    office: "ISLA",
    provider: "DR-01",
    duration: 30,
    name: "Valentina Ríos",
    time: "3:00 PM",
    type: "Follow-up",
    status: "Scheduled",
  },
];
export const waitlist: WaitingPatient[] = [
  {
    // Demo patient and default offer recipient. Same P3 level as Elena Morales
    // and Camila Soto, but the oldest request (October 4), so the deterministic
    // tie-break (priority rank, then request date, then ID) ranks him first.
    id: "WL-004",
    priority: "P3",
    condition: "Synthetic routine follow-up; afternoon visit requested",
    from: DEMO_DATE,
    through: "2026-10-21",
    start: 780,
    end: 960,
    office: "ISLA",
    provider: "DR-01",
    visitType: "Consultation",
    duration: 30,
    bookingDate: "2026-10-22",
    bookingTime: "2:00 PM",
    name: "José Pérez",
    availability: "Afternoons · 1–4 PM",
    since: "2026-10-04",
    reason: "Earlier appointment",
    language: "Spanish",
  },
  {
    id: "WL-001",
    priority: "P3",
    condition: "Synthetic knee discomfort; earlier routine visit requested",
    from: DEMO_DATE,
    through: "2026-10-21",
    start: 780,
    end: 960,
    office: "ISLA",
    provider: "DR-01",
    visitType: "Consultation",
    duration: 30,
    bookingDate: "2026-10-22",
    // Also afternoon-compatible, but her request (October 5) is newer than
    // José Pérez's, so she is the second eligible candidate.
    bookingTime: "3:30 PM",
    name: "Elena Morales",
    availability: "Afternoons · 1–4 PM",
    since: "2026-10-05",
    reason: "Earlier appointment",
    language: "Spanish",
  },
  {
    id: "WL-002",
    priority: "P3",
    condition: "Synthetic back discomfort; morning visit requested",
    from: DEMO_DATE,
    through: "2026-10-21",
    start: 540,
    end: 660,
    office: "ISLA",
    provider: "DR-01",
    visitType: "Consultation",
    duration: 30,
    bookingDate: "2026-10-22",
    bookingTime: "2:30 PM",
    name: "Nicolás Díaz",
    availability: "Mornings · 9–11 AM",
    since: "2026-10-06",
    reason: "Earlier appointment",
    language: "English",
  },
  {
    id: "WL-003",
    priority: "P3",
    condition: "Synthetic follow-up request; flexible afternoon",
    from: DEMO_DATE,
    through: "2026-10-21",
    start: 840,
    end: 1020,
    office: "ISLA",
    provider: "DR-01",
    visitType: "Consultation",
    duration: 30,
    bookingDate: "2026-10-22",
    bookingTime: "3:00 PM",
    name: "Camila Soto",
    availability: "Afternoons · 2–5 PM",
    since: "2026-10-07",
    reason: "Rescheduling",
    language: "Spanish",
  },
];
// Four public demo roles. A role selector, not a login, session or permission.
export type DemoWorkspace = "demo" | "staff" | "maria" | "jose";
export function demoWorkspaceFromHash(hash: string): DemoWorkspace {
  if (hash === "#/provider" || hash === "#/staff") return "staff";
  if (hash === "#/patient/maria") return "maria";
  // #/patient is the earlier single-patient link; it opens the waiting patient.
  if (hash === "#/patient" || hash === "#/patient/jose") return "jose";
  // #/login is an optional, always-public entry alias, not an auth gate.
  return "demo";
}
export const workspaceHash: Record<DemoWorkspace, string> = {
  demo: "/demo",
  staff: "/provider",
  maria: "/patient/maria",
  jose: "/patient/jose",
};
export const demoIdentities = {
  staff: {
    name: "Dr. Carlos Rivera",
    label: "Demo Provider · fictional identity",
  },
  maria: {
    name: "María Rodríguez",
    label: "Demo Patient · fictional identity",
  },
  jose: {
    name: "José Pérez",
    label: "Demo Patient · fictional identity",
  },
};
// The office view belongs to Ana; she observes Dr. Carlos Rivera's schedule.
export const demoAssistant = {
  name: "Ana Martínez",
  label: "Medical Office Assistant · fictional identity",
};
// The simulated assistant: fixed, deterministic rules. No model, no network.
export const AI_ASSISTANT = "AI assistant (simulated)";
export type DemoPhase =
  | "scheduled" // María holds the October 8, 2:00 PM appointment.
  | "cancelled" // María cancelled it in her patient view.
  | "detected" // AI: noticed the cancellation.
  | "selected" // AI: ranked the waitlist and chose the best match.
  | "unmatched" // AI: nobody on the waitlist fits; the slot stays open.
  | "offered" // AI: sent the simulated offer; waits for the patient.
  | "accepted" // The selected patient accepted in their own view.
  | "updated" // AI: moved the booking, released the old one, updated the waitlist.
  | "notified"; // AI: notified Ana. End of the story.
// Why the assistant chose the patient: the inputs of the deterministic ranking
// (eligible() and sortPatients()), captured when it decided.
export type SelectionReasoning = {
  scanned: number;
  availability: string;
  priority: PriorityId;
  priorityLabel: string;
  since: string;
  decidedBy: "priority" | "request" | "id" | "only";
  tiedWith: string[];
  next?: { name: string; since: string };
  excluded: { name: string; availability: string; reason: "time" | "other" }[];
};
export type StoryEvent =
  | { kind: "cancelled"; name: string }
  | { kind: "detected"; name: string }
  | {
      kind: "selected";
      patientId: string;
      name: string;
      reasoning: SelectionReasoning;
    }
  | { kind: "unmatched" }
  | { kind: "offered"; patientId: string; name: string }
  | { kind: "accepted"; patientId: string; name: string }
  | {
      kind: "updated";
      patientId: string;
      name: string;
      releasedDate: string;
      releasedTime: string;
      waitlistBefore: number;
      waitlistAfter: number;
    }
  | { kind: "notified"; name: string };
// Staff edits stay plain sentences; story steps are structured so every view
// can render them in either language.
export type DemoEvent = string | StoryEvent;
export const isStoryEvent = (event: DemoEvent): event is StoryEvent =>
  typeof event !== "string";
// Steps taken by the assistant (not by a person).
export const isAssistantEvent = (event: DemoEvent): event is StoryEvent =>
  isStoryEvent(event) &&
  event.kind !== "cancelled" &&
  event.kind !== "accepted";
export const CANCELLING_PATIENT = "María Rodríguez";
export type DemoState = {
  capacity: CapacityState;
  capacityArchives: Record<string, CapacityState>;
  phase: DemoPhase;
  events: DemoEvent[];
  config: PriorityConfig;
  patients: WaitingPatient[];
  candidateId?: string;
};
export type DemoAction =
  | { type: "capacity"; action: CapacityAction }
  // María cancels; the selected patient accepts. Everything else is the AI.
  | { type: "cancel" | "accept" | "reset" }
  | {
      type: "priority";
      patientId: string;
      priority: PriorityId;
      staffConfirmed: boolean;
    }
  | { type: "configure"; config: PriorityConfig };
export function initialDemoState(): DemoState {
  return {
    capacity: generateCapacity(currentMonth()),
    capacityArchives: {},
    phase: "scheduled",
    events: [],
    config: defaultPriorityConfig(),
    patients: waitlist.map((p) => ({ ...p })),
  };
}
export function selectedPatient(state: DemoState) {
  return (
    state.patients.find((p) => p.id === state.candidateId) ??
    state.patients.find((p) => p.id === "WL-004") ??
    state.patients[0]
  );
}
// Days between the patient's original booking and the offered October 8 slot.
export function daysEarlier(patient: WaitingPatient) {
  return Math.round(
    (Date.parse(patient.bookingDate) - Date.parse(DEMO_DATE)) / 86_400_000,
  );
}
export function eligibleCandidates(state: DemoState) {
  const bookings = calendarAppointments(state);
  const slot = bookings.find((a) => a.id === "SQ-006");
  if (!slot) return [];
  return sortPatients(
    demoWaitlist(state).filter((p) => eligible(p, slot, bookings)),
    state.config,
  );
}
// Explains the head of eligibleCandidates() from the same inputs it ranked.
export function selectionReasoning(
  state: DemoState,
  candidates: WaitingPatient[],
): SelectionReasoning {
  const [first, second] = candidates;
  const rank = (p: WaitingPatient) => priorityLevel(state.config, p.priority).rank;
  const slot = calendarAppointments(state).find((a) => a.id === "SQ-006");
  const start = minutes(slot?.time ?? ""),
    end = start + (slot?.duration ?? 0);
  const waiting = demoWaitlist(state);
  return {
    scanned: waiting.length,
    availability: first.availability,
    priority: priorityLevel(state.config, first.priority).id,
    priorityLabel: priorityLevel(state.config, first.priority).label,
    since: first.since,
    decidedBy: !second
      ? "only"
      : rank(first) < rank(second)
        ? "priority"
        : first.since < second.since
          ? "request"
          : "id",
    tiedWith: candidates
      .slice(1)
      .filter((p) => rank(p) === rank(first))
      .map((p) => p.name),
    next: second && { name: second.name, since: second.since },
    excluded: waiting
      .filter((p) => !candidates.some((c) => c.id === p.id))
      .map((p) => ({
        name: p.name,
        availability: p.availability,
        reason: start < p.start || end > p.end ? "time" : "other",
      })),
  };
}
// One step of the simulated assistant. Returns the same state when it has
// nothing to do (it is waiting for a person, or the story is over).
export function assistantStep(state: DemoState): DemoState {
  const add = (phase: DemoPhase, event: StoryEvent, patch = {}) => ({
    ...state,
    ...patch,
    phase,
    events: [...state.events, event],
  });
  if (state.phase === "cancelled")
    return add("detected", { kind: "detected", name: CANCELLING_PATIENT });
  if (state.phase === "detected") {
    const candidates = eligibleCandidates(state);
    if (!candidates.length) return add("unmatched", { kind: "unmatched" });
    const [patient] = candidates;
    return add(
      "selected",
      {
        kind: "selected",
        patientId: patient.id,
        name: patient.name,
        reasoning: selectionReasoning(state, candidates),
      },
      { candidateId: patient.id },
    );
  }
  if (state.phase === "selected") {
    const patient = selectedPatient(state);
    return add("offered", {
      kind: "offered",
      patientId: patient.id,
      name: patient.name,
    });
  }
  if (state.phase === "accepted") {
    const patient = selectedPatient(state);
    const next = { ...state, phase: "updated" as const };
    return add(
      "updated",
      {
        kind: "updated",
        patientId: patient.id,
        name: patient.name,
        releasedDate: patient.bookingDate,
        releasedTime: patient.bookingTime,
        waitlistBefore: demoWaitlist(state).length,
        waitlistAfter: demoWaitlist(next).length,
      },
    );
  }
  if (state.phase === "updated")
    return add("notified", { kind: "notified", name: demoAssistant.name });
  return state;
}
// Runs the assistant until it must wait for a person or the story ends.
export function runAssistant(state: DemoState): DemoState {
  let current = state;
  for (let next = assistantStep(current); next !== current; ) {
    current = next;
    next = assistantStep(current);
  }
  return current;
}
// Browser memory is the existing POC storage boundary, not authorization.
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "reset") return initialDemoState();
  if (action.type === "capacity") {
    const capacity = capacityReducer(
      state.capacity,
      action.action,
      state.config,
    );
    if (capacity === state.capacity) return state;
    const capacityArchives =
      action.action.type === "generate" &&
      capacity.month !== state.capacity.month
        ? {
            ...state.capacityArchives,
            [state.capacity.month]: structuredClone(state.capacity),
          }
        : state.capacityArchives;
    return {
      ...state,
      capacity,
      capacityArchives,
      events: [...state.events, "Staff updated monthly demo scheduling."],
    };
  }
  if (action.type === "configure") {
    if (!validConfig(action.config)) return state;
    const config = {
      ...action.config,
      levels: action.config.levels.map((l) => ({
        ...l,
        label: l.label.trim(),
        description: l.description.trim(),
      })),
    };
    return {
      ...state,
      config,
      capacity: {
        ...state.capacity,
        slots: state.capacity.slots.map((s) => ({
          ...s,
          priority: s.priority
            ? priorityLevel(config, s.priority).id
            : undefined,
        })),
        waiting: state.capacity.waiting.map((p) => ({
          ...p,
          priority: priorityLevel(config, p.priority).id,
        })),
      },
      patients: state.patients.map((p) => ({
        ...p,
        priority: priorityLevel(config, p.priority).id,
      })),
      events: [
        ...state.events,
        "Staff updated scheduling priority configuration.",
      ],
    };
  }
  if (action.type === "priority") {
    if (
      !action.staffConfirmed ||
      !state.config.levels.some((l) => l.id === action.priority && l.enabled) ||
      !demoWaitlist(state).some(
        (p) => p.id === action.patientId && p.priority !== action.priority,
      )
    )
      return state;
    return {
      ...state,
      patients: state.patients.map((p) =>
        p.id === action.patientId ? { ...p, priority: action.priority } : p,
      ),
      events: [
        ...state.events,
        `Staff confirmed scheduling priority: ${action.patientId} → ${action.priority}.`,
      ],
    };
  }
  // María cancels in her own view (after an explicit confirmation); the
  // assistant then detects, selects and offers on its own.
  if (action.type === "cancel" && state.phase === "scheduled")
    return runAssistant({
      ...state,
      phase: "cancelled",
      events: [...state.events, { kind: "cancelled", name: CANCELLING_PATIENT }],
    });
  if (action.type === "accept" && state.phase === "offered") {
    // Revalidate compatibility/conflicts at acceptance, never silently replace the selected patient.
    if (!eligibleCandidates(state).some((p) => p.id === state.candidateId))
      return state;
    const patient = selectedPatient(state);
    return runAssistant({
      ...state,
      phase: "accepted",
      events: [
        ...state.events,
        { kind: "accepted", patientId: patient.id, name: patient.name },
      ],
    });
  }
  return state;
}
// The booking moves only once the assistant has applied the acceptance.
export const scheduleUpdated = (state: DemoState) =>
  state.phase === "updated" || state.phase === "notified";
export function demoAppointments(state: DemoState): Appointment[] {
  const patient = selectedPatient(state);
  const moved = scheduleUpdated(state);
  return appointments.map((appointment) =>
    appointment.id !== "SQ-006"
      ? appointment
      : {
          ...appointment,
          name:
            state.phase === "scheduled"
              ? CANCELLING_PATIENT
              : moved
                ? patient.name
                : "Available appointment",
          patientId: moved ? patient.id : undefined,
          priority: moved ? patient.priority : undefined,
          status:
            state.phase === "scheduled" || moved ? "Scheduled" : "Open slot",
        },
  );
}
export function demoWaitlist(state: DemoState) {
  return sortPatients(
    scheduleUpdated(state)
      ? state.patients.filter((p) => p.id !== state.candidateId)
      : state.patients,
    state.config,
  );
}
export function calendarAppointments(state: DemoState): Appointment[] {
  const released = (p: WaitingPatient) =>
    scheduleUpdated(state) && p.id === state.candidateId;
  return [
    ...demoAppointments(state),
    ...state.patients.map((p) => ({
      id: `BOOK-${p.id}`,
      date: p.bookingDate,
      time: p.bookingTime,
      name: released(p) ? "Available appointment" : p.name,
      office: p.office,
      provider: p.provider,
      duration: p.duration,
      type: p.visitType,
      patientId: released(p) ? undefined : p.id,
      priority: released(p) ? undefined : p.priority,
      status: released(p) ? ("Open slot" as const) : ("Scheduled" as const),
    })),
  ];
}
export function cancellationHistory(state: DemoState): Appointment[] {
  return state.phase === "scheduled"
    ? []
    : [
        {
          ...(appointments.find((a) => a.id === "SQ-006") as Appointment),
          id: "CANCELED-SQ-006",
          name: CANCELLING_PATIENT,
          status: "Canceled",
        },
      ];
}
