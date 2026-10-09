import CapacityDashboard from "./CapacityDashboard";
import {
  PriorityBadge,
  PriorityEditor,
  PriorityConfiguration,
  CandidateReview,
  ProviderCalendar,
} from "./SchedulingTools";
import { priorityDisclaimer } from "../../demo/scheduling";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useEffect, useRef, useState } from "react";
import type { StaffView } from "../../App";
import DemoGuide from "../../components/DemoGuide";
import {
  Avatar,
  Badge,
  EmptyState,
  Icon,
  type IconName,
} from "../../components/ui";
import {
  calendarAppointments,
  eligibleCandidates,
  daysEarlier,
  selectedPatient,
  demoWaitlist,
  DEMO_DATE,
  type DemoState,
  type DemoAction,
} from "../../demo/data";

const titles: Record<StaffView, [string, string]> = {
  overview: [
    "Today at Isla Care",
    "Fill cancelled appointments with patients who want an earlier visit.",
  ],
  schedule: ["Schedule", "Appointments by day, week or month."],
  waitlist: [
    "Waitlist",
    "Patients who asked for an earlier appointment, in priority order.",
  ],
  activity: ["Activity log", "Every step of the demo, in order."],
};
function WaitlistPanel({
  full = false,
  onNavigate,
  demo,
  onAction,
}: {
  full?: boolean;
  onAction: (action: DemoAction) => void;
  demo: DemoState;
  onNavigate: (view: StaffView) => void;
}) {
  const { t, dateText } = useLanguage();
  const waitlist = demoWaitlist(demo);
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{t("Ready for an earlier visit")}</h2>
          <p>{t("Priority order · oldest request first within a level")}</p>
        </div>
        <Badge tone="blue">
          {waitlist.length} {t("patients")}
        </Badge>
      </div>
      <div className="waitlist-list">
        {waitlist.map((person) => (
          <div className="waitlist-person" key={person.id}>
            <Avatar name={person.name} />
            <div className="person-details">
              <strong>{person.name}</strong>
              <span>{t(person.availability)}</span>
              {full && (
                <span>
                  {t(person.reason)} {t("· Joined")}{" "}
                  {dateText(person.since, { month: "short", day: "numeric" })} ·{" "}
                  {t(person.language)}
                </span>
              )}
            </div>
            <PriorityBadge
              demo={demo}
              priority={person.priority}
              hideDefault={!full}
            />
            {full && (
              <div className="waitlist-editor">
                <p>{t(person.condition)}</p>
                <PriorityEditor
                  key={`${person.id}-${person.priority}`}
                  person={person}
                  demo={demo}
                  onAction={onAction}
                />
              </div>
            )}
            <Badge>{person.language === "Spanish" ? "ES" : "EN"}</Badge>
          </div>
        ))}
      </div>
      {!full && (
        <button
          type="button"
          className="panel-link"
          onClick={() => onNavigate("waitlist")}
        >
          {" "}
          {t("View waitlist")} <Icon name="arrow" />
        </button>
      )}
      {full && (
        <div className="panel-note">
          <Icon name="shield" />
          <p> {t(priorityDisclaimer)} </p>
        </div>
      )}
    </section>
  );
}
const SHORT_DATE = { month: "short", day: "numeric" } as const;
export default function StaffWorkspace({
  view,
  onNavigate,
  demo,
  onAction,
  onPatient,
}: {
  view: StaffView;
  onNavigate: (view: StaffView) => void;
  demo: DemoState;
  onAction: (action: DemoAction) => void;
  onPatient: () => void;
}) {
  const { t, dateText, timeText } = useLanguage();
  const scenarioStatus = useRef<HTMLParagraphElement>(null);
  const previousPhase = useRef(demo.phase);
  useEffect(() => {
    if (previousPhase.current !== demo.phase) scenarioStatus.current?.focus();
    previousPhase.current = demo.phase;
  }, [demo.phase]);
  const [utilization, setUtilization] = useState(false);
  const [date, setDate] = useState(DEMO_DATE);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const day = calendarAppointments(demo).filter((a) => a.date === date);
  const candidates = eligibleCandidates(demo);
  const [chosenId, setChosenId] = useState("");
  const candidateId = candidates.some((p) => p.id === chosenId)
    ? chosenId
    : (candidates[0]?.id ?? "");
  const patient = selectedPatient(demo);
  const waitlist = demoWaitlist(demo);
  const filtered = day.filter(
    (a) =>
      `${a.name} ${a.id}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()) &&
      (status === "All statuses" || a.status === status),
  );
  const completed = day.filter((a) => a.status === "Completed").length;
  const open = day.filter((a) => a.status === "Open slot").length;
  const metrics: {
    label: string;
    value: number;
    detail: string;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: "Appointment slots",
      value: day.length,
      detail: "On the selected date",
      icon: "calendar",
      tone: "blue",
    },
    {
      label: "Completed visits",
      value: completed,
      detail: "Already seen",
      icon: "check",
      tone: "green",
    },
    {
      label: "Open slots",
      value: open,
      detail: "An opportunity for earlier care",
      icon: "clock",
      tone: "coral",
    },
    {
      label: "Patients waiting",
      value: waitlist.length,
      detail: "Want an earlier visit",
      icon: "users",
      tone: "purple",
    },
  ];
  return (
    <div className="workspace-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t("ISLA CARE / PROVIDER WORKSPACE")}</p>
          <h1>{t(titles[view][0])}</h1>
          <p>{t(titles[view][1])}</p>
        </div>
        {!utilization && (view === "overview" || view === "schedule") && (
          <label className="date-control">
            <Icon name="calendar" />
            <span className="sr-only">{t("Schedule date")}</span>
            <input
              type="date"
              aria-label={t("Schedule date")}
              value={date}
              onChange={(event) => {
                if (event.target.value) setDate(event.target.value);
              }}
            />
          </label>
        )}
      </div>
      {(view === "overview" || view === "schedule") && (
        <div className="capacity-entry">
          <button
            type="button"
            className="secondary-button"
            aria-pressed={utilization}
            onClick={() => setUtilization(!utilization)}
          >
            {t(
              utilization
                ? "Guided cancellation demo"
                : "Capacity & statistics",
            )}
          </button>
        </div>
      )}
      {utilization && (view === "overview" || view === "schedule") && (
        <CapacityDashboard demo={demo} onAction={onAction} />
      )}
      {!(utilization && (view === "overview" || view === "schedule")) && (
        <DemoGuide
          phase={demo.phase}
          statusRef={scenarioStatus}
          status={
            demo.phase === "scheduled" ? (
              t(
                "María Rodríguez cancelled her October 8, 2:00 PM visit. Confirm it to open the slot.",
              )
            ) : demo.phase === "open" ? (
              t(
                "The 2:00 PM slot is open. The best match is ranked first below; send the offer.",
              )
            ) : demo.phase === "offered" ? (
              `${t("Offer sent to")} ${patient.name}. ${t("Nothing changes until the patient accepts. Open the Patient view to answer.")}`
            ) : demo.phase === "accepted" ? (
              <>
                <strong>{t("Open slot filled in 3 steps.")}</strong>{" "}
                {patient.name} ·{" "}
                {dateText(patient.bookingDate, SHORT_DATE)} →{" "}
                {dateText(DEMO_DATE, SHORT_DATE)} · {daysEarlier(patient)}{" "}
                {t("days sooner")} · {t("Waitlist")} {demo.patients.length} →{" "}
                {waitlist.length}
              </>
            ) : demo.phase === "declined" ? (
              t(
                "Offer declined. The slot remains open and the original patient appointment is preserved. Reset to replay.",
              )
            ) : (
              t(
                "The selected patient requested help. Return to Patient; no message leaves this browser.",
              )
            )
          }
        >
          {demo.phase === "scheduled" && (
            <button
              type="button"
              className="primary-button"
              onClick={() => onAction({ type: "cancel" })}
            >
              {" "}
              {t("Confirm demo cancellation")}{" "}
            </button>
          )}
          {demo.phase === "open" && (
            <button
              type="button"
              className="primary-button"
              disabled={!candidateId}
              onClick={() => onAction({ type: "offer", candidateId })}
            >
              {" "}
              {candidateId === "WL-004"
                ? t("Send demo offer to José")
                : t("Confirm offer to selected patient")}{" "}
            </button>
          )}
          {(demo.phase === "offered" || demo.phase === "help") && (
            <button
              type="button"
              className="primary-button"
              onClick={onPatient}
            >
              {" "}
              {t("Open Demo Patient")} <Icon name="arrow" />
            </button>
          )}
          {(demo.phase === "accepted" || demo.phase === "declined") && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("activity")}
            >
              {" "}
              {t("Review activity")}{" "}
            </button>
          )}
        </DemoGuide>
      )}
      <p className="priority-disclaimer">{t(priorityDisclaimer)}</p>
      {demo.phase === "open" && (
        <CandidateReview
          demo={demo}
          candidateId={candidateId}
          onSelect={setChosenId}
        />
      )}
      {!utilization && (view === "overview" || view === "schedule") && (
        <>
          <ProviderCalendar demo={demo} date={date} onDate={setDate} />
          <div className="metrics-grid">
            {metrics.map((metric) => (
              <section className="metric-card" key={t(metric.label)}>
                <div className="metric-top">
                  <span>{t(metric.label)}</span>
                  <span className={`metric-icon ${metric.tone}`}>
                    <Icon name={metric.icon} />
                  </span>
                </div>
                <strong className="metric-value">
                  {metric.value}
                </strong>
                <p>{t(metric.detail)}</p>
              </section>
            ))}
          </div>
          <div className={view === "overview" ? "schedule-grid" : ""}>
            <section className="panel schedule-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t("Daily schedule")}</h2>
                  <p>
                    {dateText(date)} {t("· Atlantic Standard Time")}{" "}
                  </p>
                </div>
                <Badge>
                  {day.length} {t("slots")}
                </Badge>
              </div>
              <div className="table-toolbar">
                <label className="search-field">
                  <Icon name="search" />
                  <span className="sr-only">
                    {" "}
                    {t("Search schedule by name or record ID")}{" "}
                  </span>
                  <input
                    type="search"
                    placeholder={t("Search name or record ID")}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <label>
                  <span className="sr-only">
                    {t("Filter by appointment status")}
                  </span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    aria-label={t("Appointment status")}
                  >
                    <option value="All statuses">{t("All statuses")}</option>
                    <option value="Scheduled">{t("Scheduled")}</option>
                    <option value="Completed">{t("Completed")}</option>
                    <option value="Open slot">{t("Open slot")}</option>
                  </select>
                </label>
              </div>
              {filtered.length ? (
                <section
                  className="table-scroll"
                  aria-label={t("Daily appointments")}
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable region needs keyboard scrolling.
                  tabIndex={0}
                >
                  <table>
                    <caption className="sr-only">
                      {" "}
                      {t("Synthetic appointment schedule")}{" "}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("TIME")}</th>
                        <th scope="col">{t("PATIENT")}</th>
                        <th scope="col">{t("VISIT TYPE")}</th>
                        <th scope="col">{t("STATUS")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((appointment) => {
                        const slot = appointment.id === "SQ-006";
                        const pending =
                          slot &&
                          (demo.phase === "offered" || demo.phase === "help");
                        const filled = slot && demo.phase === "accepted";
                        return (
                          <tr
                            key={appointment.id}
                            className={
                              pending
                                ? "pending-row"
                                : filled
                                  ? "filled-row"
                                  : appointment.status === "Open slot"
                                    ? "open-row"
                                    : ""
                            }
                          >
                            <td className="time-cell">
                              {timeText(appointment.time)}
                              <span>{t("30 min")}</span>
                            </td>
                            <td>
                              <div className="table-person">
                                {appointment.status === "Open slot" ? (
                                  <span className="avatar open-avatar">
                                    <Icon name="calendar" />
                                  </span>
                                ) : (
                                  <Avatar name={t(appointment.name)} />
                                )}
                                <div>
                                  <strong>{t(appointment.name)}</strong>
                                  {appointment.status !== "Open slot" && (
                                    <PriorityBadge
                                      demo={demo}
                                      priority={appointment.priority}
                                      hideDefault
                                    />
                                  )}
                                  {filled && (
                                    <Badge tone="green">{t("Just filled")}</Badge>
                                  )}
                                  <span>
                                    {pending
                                      ? `${t("Waiting for")} ${patient.name}`
                                      : appointment.status === "Open slot"
                                        ? t("Staff-confirmed sample cancellation")
                                        : appointment.id}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{t(appointment.type)}</td>
                            <td>
                              <Badge
                                tone={
                                  appointment.status === "Completed"
                                    ? "green"
                                    : appointment.status === "Open slot"
                                      ? "amber"
                                      : "blue"
                                }
                              >
                                {pending
                                  ? t("Offer sent")
                                  : t(appointment.status)}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              ) : (
                <EmptyState
                  title={
                    day.length
                      ? t("No matching appointments")
                      : t("No sample appointments on this date")
                  }
                >
                  <p>
                    {day.length
                      ? t("Try another name or clear your filters.")
                      : t(
                          "Sample appointments are available on October 8, 2026.",
                        )}
                  </p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setQuery("");
                      setStatus("All statuses");
                      setDate(DEMO_DATE);
                    }}
                  >
                    {" "}
                    {t("Reset filters and demo date")}{" "}
                  </button>
                </EmptyState>
              )}
              <div className="table-footer">
                <span role="status">
                  {" "}
                  {t("Showing")} {filtered.length} {t("of")} {day.length}{" "}
                  {t("slots")}{" "}
                </span>
                <span>{t("Single office · 30-minute visits")}</span>
              </div>
            </section>
            {view === "overview" && (
              <div className="right-column">
                <WaitlistPanel
                  onNavigate={onNavigate}
                  demo={demo}
                  onAction={onAction}
                />
              </div>
            )}
          </div>
        </>
      )}
      {view === "waitlist" && (
        <>
          <div className="section-notice">
            <Icon name="users" />
            <p>
              <strong>{t("A smaller wait starts with a good match.")}</strong>{" "}
              {t(
                "Synthetic scheduling only. Assign staff-confirmed priorities, then review eligible candidates after cancellation.",
              )}{" "}
            </p>
          </div>
          <WaitlistPanel
            full
            onNavigate={onNavigate}
            demo={demo}
            onAction={onAction}
          />
          <PriorityConfiguration demo={demo} onAction={onAction} />
        </>
      )}
      {view === "activity" && (
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>{t("Preview activity")}</h2>
              <p>{t("Resets when you reload or reset the demo")}</p>
            </div>
          </div>
          {demo.events.length ? (
            <ol className="timeline">
              {demo.events.map((event, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Session activity is append-only; positions never reorder.
                <li key={`${index}-${event}`}>
                  <span className="timeline-icon">
                    <Icon name="check" />
                  </span>
                  <div>
                    <strong>
                      {t("Demo event")} {index + 1}
                    </strong>
                    <p>{t(event)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title={t("No demo actions yet")}>
              <p>
                {t(
                  "Confirm the sample cancellation to start the activity log.",
                )}
              </p>
            </EmptyState>
          )}
        </section>
      )}
    </div>
  );
}
