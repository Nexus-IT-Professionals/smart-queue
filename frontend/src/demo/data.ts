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
    "Acceptance preview recorded. Your existing appointment is unchanged; no real booking was made.",
  declined: "Decline preview recorded. Your existing appointment is unchanged.",
  help: "Help request preview recorded. No message was sent to the office.",
};
