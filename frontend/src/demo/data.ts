// Fictional, in-memory fixtures for the UI preview. Never patient or API data.
export const DEMO_DATE = "2026-10-08";
export const OFFICE = "Isla Care · San Juan";
export type Appointment = {
  id: string;
  name: string;
  time: string;
  type: string;
  status: "Completed" | "Scheduled" | "Open slot";
};
export const appointments: Appointment[] = [
  {
    id: "SQ-001",
    name: "Lucía Rivera",
    time: "9:00 AM",
    type: "Follow-up",
    status: "Completed",
  },
  {
    id: "SQ-002",
    name: "Mateo Santos",
    time: "9:30 AM",
    type: "Consultation",
    status: "Completed",
  },
  {
    id: "SQ-003",
    name: "Isabel Cruz",
    time: "10:00 AM",
    type: "Follow-up",
    status: "Completed",
  },
  {
    id: "SQ-004",
    name: "Daniel Vega",
    time: "10:30 AM",
    type: "Consultation",
    status: "Scheduled",
  },
  {
    id: "SQ-005",
    name: "Sofía Torres",
    time: "11:00 AM",
    type: "Follow-up",
    status: "Scheduled",
  },
  {
    id: "SQ-006",
    name: "Available appointment",
    time: "2:00 PM",
    type: "Consultation",
    status: "Open slot",
  },
  {
    id: "SQ-007",
    name: "Gabriel Ortiz",
    time: "2:30 PM",
    type: "Consultation",
    status: "Scheduled",
  },
  {
    id: "SQ-008",
    name: "Valentina Ríos",
    time: "3:00 PM",
    type: "Follow-up",
    status: "Scheduled",
  },
];
export const waitlist = [
  {
    id: "WL-001",
    name: "Elena Morales",
    availability: "Afternoons · 1–4 PM",
    since: "Oct 5",
    reason: "Earlier appointment",
    language: "Spanish",
  },
  {
    id: "WL-002",
    name: "Nicolás Díaz",
    availability: "Mornings · 9–11 AM",
    since: "Oct 6",
    reason: "Earlier appointment",
    language: "English",
  },
  {
    id: "WL-003",
    name: "Camila Soto",
    availability: "Afternoons · 2–5 PM",
    since: "Oct 7",
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
export type DemoPhase =
  "scheduled" | "open" | "offered" | "accepted" | "declined" | "help";
export type DemoState = { phase: DemoPhase; events: string[] };
export type DemoAction =
  | { type: "cancel" | "offer" | "reset" }
  | { type: "respond"; response: Exclude<PreviewResponse, null> };
export function initialDemoState(): DemoState {
  return { phase: "scheduled", events: [] };
}
// This reducer is a synthetic, single-browser simulation, never authorization.
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "reset") return initialDemoState();
  if (action.type === "cancel" && state.phase === "scheduled") {
    return {
      phase: "open",
      events: [
        ...state.events,
        "Provider confirmed the sample cancellation: October 8, 2:00 PM.",
      ],
    };
  }
  if (action.type === "offer" && state.phase === "open") {
    return {
      phase: "offered",
      events: [
        ...state.events,
        "Provider sent a simulated in-app offer to Elena Morales.",
      ],
    };
  }
  if (
    action.type === "respond" &&
    (state.phase === "offered" || state.phase === "help")
  ) {
    if (state.phase === "help" && action.response === "help") return state;
    const event =
      action.response === "accepted"
        ? "Patient accepted: demo booking moved from October 22 to October 8, 2:00 PM; waitlist entry removed."
        : action.response === "declined"
          ? "Patient declined: October 22 demo booking preserved; October 8 slot remains open."
          : "Patient requested help in this browser; the offer remains available.";
    return { phase: action.response, events: [...state.events, event] };
  }
  // Invalid or repeated actions never create extra bookings/events.
  return state;
}
export function demoAppointments(state: DemoState): Appointment[] {
  return appointments.map((appointment) =>
    appointment.id !== "SQ-006"
      ? appointment
      : {
          ...appointment,
          name:
            state.phase === "scheduled"
              ? "Adrián López"
              : state.phase === "accepted"
                ? "Elena Morales"
                : "Available appointment",
          status:
            state.phase === "scheduled" || state.phase === "accepted"
              ? "Scheduled"
              : "Open slot",
        },
  );
}
export function demoWaitlist(state: DemoState) {
  return state.phase === "accepted"
    ? waitlist.filter((person) => person.id !== "WL-001")
    : waitlist;
}
