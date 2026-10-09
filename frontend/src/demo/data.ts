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
    name: "María Rodríguez",
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
    // Top of the list, but available only in the morning: the 2:00 PM demo
    // opening is still offered to Elena Morales (WL-001).
    id: "WL-004",
    priority: "P3",
    condition: "Synthetic routine follow-up; morning visit requested",
    from: DEMO_DATE,
    through: "2026-10-21",
    start: 480,
    end: 600,
    office: "ISLA",
    provider: "DR-01",
    visitType: "Consultation",
    duration: 30,
    bookingDate: "2026-10-22",
    bookingTime: "9:00 AM",
    name: "José Pérez",
    availability: "Mornings · 8–10 AM",
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
    bookingTime: "2:00 PM",
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
export type PreviewResponse = "accepted" | "declined" | "help" | null;
export const responseMessages = {
  accepted:
    "Demo appointment moved to October 8 at 2:00 PM. Provider schedule and waitlist updated in this browser only; no real booking was made.",
  declined: "Decline preview recorded. Your existing appointment is unchanged.",
  help: "Help request preview recorded. No message was sent to the office.",
};

export type DemoWorkspace = "demo" | "staff" | "patient";
export function demoWorkspaceFromHash(hash: string): DemoWorkspace {
  if (hash === "#/provider" || hash === "#/staff") return "staff";
  if (hash === "#/patient") return "patient";
  // #/login is an optional, always-public entry alias, not an auth gate.
  return "demo";
}
export const demoIdentities = {
  staff: {
    name: "Dr. Alex Rivera",
    label: "Demo Provider · fictional identity",
  },
  patient: {
    name: "Elena Morales",
    label: "Demo Patient · fictional identity",
  },
};
// Shown beside the provider identity; not a separate role or login.
export const demoAssistant = {
  name: "Ana Martínez",
  label: "Medical Office Assistant · fictional identity",
};
export type DemoPhase =
  | "scheduled"
  | "open"
  | "offered"
  | "accepted"
  | "declined"
  | "help";
export type DemoState = {
  capacity: CapacityState;
  capacityArchives: Record<string, CapacityState>;
  phase: DemoPhase;
  events: string[];
  config: PriorityConfig;
  patients: WaitingPatient[];
  candidateId?: string;
};
export type DemoAction =
  | { type: "capacity"; action: CapacityAction }
  | { type: "cancel" | "reset" }
  | { type: "offer"; candidateId?: string }
  | {
      type: "priority";
      patientId: string;
      priority: PriorityId;
      staffConfirmed: boolean;
    }
  | { type: "configure"; config: PriorityConfig }
  | { type: "respond"; response: Exclude<PreviewResponse, null> };
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
    state.patients.find((p) => p.id === "WL-001") ??
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
  if (action.type === "cancel" && state.phase === "scheduled") {
    return {
      ...state,
      phase: "open",
      events: [
        ...state.events,
        "Ana Martínez, Medical Office Assistant, confirmed the sample cancellation: October 8, 2:00 PM.",
      ],
    };
  }
  if (action.type === "offer" && state.phase === "open") {
    const candidates = eligibleCandidates(state);
    const patient = action.candidateId
      ? candidates.find((p) => p.id === action.candidateId)
      : candidates[0];
    if (!patient) return state;
    return {
      ...state,
      phase: "offered",
      candidateId: patient.id,
      events: [
        ...state.events,
        `Ana Martínez, Medical Office Assistant, sent a simulated in-app offer to ${patient.name}.`,
      ],
    };
  }
  if (
    action.type === "respond" &&
    (state.phase === "offered" || state.phase === "help")
  ) {
    if (state.phase === "help" && action.response === "help") return state;
    // Revalidate compatibility/conflicts at acceptance, never silently replace the selected patient.
    if (
      action.response === "accepted" &&
      !eligibleCandidates(state).some((p) => p.id === state.candidateId)
    )
      return state;
    const event =
      action.response === "accepted"
        ? "Patient accepted: demo booking moved from October 22 to October 8, 2:00 PM; waitlist entry removed."
        : action.response === "declined"
          ? "Patient declined: October 22 demo booking preserved; October 8 slot remains open."
          : "Patient requested help in this browser; the offer remains available.";
    return {
      ...state,
      phase: action.response,
      events: [...state.events, event],
    };
  }
  return state;
}
export function demoAppointments(state: DemoState): Appointment[] {
  const patient = selectedPatient(state);
  return appointments.map((appointment) =>
    appointment.id !== "SQ-006"
      ? appointment
      : {
          ...appointment,
          name:
            state.phase === "scheduled"
              ? "Adrián López"
              : state.phase === "accepted"
                ? patient.name
                : "Available appointment",
          patientId: state.phase === "accepted" ? patient.id : undefined,
          priority: state.phase === "accepted" ? patient.priority : undefined,
          status:
            state.phase === "scheduled" || state.phase === "accepted"
              ? "Scheduled"
              : "Open slot",
        },
  );
}
export function demoWaitlist(state: DemoState) {
  return sortPatients(
    state.phase === "accepted"
      ? state.patients.filter((p) => p.id !== state.candidateId)
      : state.patients,
    state.config,
  );
}
export function calendarAppointments(state: DemoState): Appointment[] {
  return [
    ...demoAppointments(state),
    ...state.patients.map((p) => ({
      id: `BOOK-${p.id}`,
      date: p.bookingDate,
      time: p.bookingTime,
      name:
        state.phase === "accepted" && p.id === state.candidateId
          ? "Available appointment"
          : p.name,
      office: p.office,
      provider: p.provider,
      duration: p.duration,
      type: p.visitType,
      patientId:
        state.phase === "accepted" && p.id === state.candidateId
          ? undefined
          : p.id,
      priority:
        state.phase === "accepted" && p.id === state.candidateId
          ? undefined
          : p.priority,
      status:
        state.phase === "accepted" && p.id === state.candidateId
          ? ("Open slot" as const)
          : ("Scheduled" as const),
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
          name: "Adrián López",
          status: "Canceled",
        },
      ];
}
