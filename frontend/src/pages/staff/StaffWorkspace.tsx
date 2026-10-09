import { useState } from "react";
import type { StaffView } from "../../App";
import {
  Avatar,
  Badge,
  EmptyState,
  Icon,
  type IconName,
} from "../../components/ui";
import {
  appointments,
  DEMO_DATE,
  waitlist,
  type PreviewResponse,
} from "../../demo/data";

const titles: Record<StaffView, [string, string]> = {
  overview: [
    "A clearer day. Better access.",
    "Keep your schedule moving and bring the next appointment closer.",
  ],
  schedule: [
    "Your daily schedule",
    "A little clarity for every appointment, from arrival to follow-up.",
  ],
  waitlist: [
    "The next opportunity for care",
    "Availability at a glance. Help patients find an earlier appointment.",
  ],
  activity: [
    "Every change, in view",
    "Follow the preview journey from an open slot to a patient response.",
  ],
};
function WaitlistPanel({
  full = false,
  onNavigate,
}: {
  full?: boolean;
  onNavigate: (view: StaffView) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Ready for an earlier visit</h2>
          <p>Sample waitlist · order is illustrative</p>
        </div>
        <Badge tone="blue">{waitlist.length} patients</Badge>
      </div>
      <div className="waitlist-list">
        {waitlist.map((person) => (
          <div className="waitlist-person" key={person.id}>
            <Avatar name={person.name} />
            <div className="person-details">
              <strong>{person.name}</strong>
              <span>{person.availability}</span>
              {full && (
                <span>
                  {person.reason} · Joined {person.since} · {person.language}
                </span>
              )}
            </div>
            <Badge>{person.language === "Spanish" ? "ES" : "EN"}</Badge>
          </div>
        ))}
      </div>
      {!full && (
        <button className="panel-link" onClick={() => onNavigate("waitlist")}>
          View waitlist <Icon name="arrow" />
        </button>
      )}
      {full && (
        <div className="panel-note">
          <Icon name="shield" />
          <p>
            Availability helps staff review a match. Insurance labels and AI do
            not decide who receives care. Patient registration and matching are
            not connected yet.
          </p>
        </div>
      )}
    </section>
  );
}
export default function StaffWorkspace({
  view,
  onNavigate,
  response,
}: {
  view: StaffView;
  onNavigate: (view: StaffView) => void;
  response: PreviewResponse;
}) {
  const [date, setDate] = useState(DEMO_DATE);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const day = date === DEMO_DATE ? appointments : [];
  const filtered = day.filter(
    (a) =>
      `${a.name} ${a.id}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()) &&
      (status === "All statuses" || a.status === status),
  );
  const completed = day.filter((a) => a.status === "Completed").length;
  const scheduled = day.filter((a) => a.status === "Scheduled").length;
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
      detail: "For the selected demo date",
      icon: "calendar",
      tone: "blue",
    },
    {
      label: "Completed visits",
      value: completed,
      detail: "Marked complete in the sample",
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
      detail: "Current sample waitlist",
      icon: "users",
      tone: "purple",
    },
  ];
  return (
    <div className="workspace-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ISLA CARE / STAFF WORKSPACE</p>
          <h1>{titles[view][0]}</h1>
          <p>{titles[view][1]}</p>
        </div>
        {(view === "overview" || view === "schedule") && (
          <label className="date-control">
            <Icon name="calendar" />
            <span className="sr-only">Schedule date</span>
            <input
              type="date"
              aria-label="Schedule date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        )}
      </div>
      {(view === "overview" || view === "schedule") && (
        <>
          <div className="metrics-grid">
            {metrics.map((metric) => (
              <section className="metric-card" key={metric.label}>
                <div className="metric-top">
                  <span>{metric.label}</span>
                  <span className={`metric-icon ${metric.tone}`}>
                    <Icon name={metric.icon} />
                  </span>
                </div>
                <strong className="metric-value">
                  {metric.value.toString().padStart(2, "0")}
                </strong>
                <p>{metric.detail}</p>
              </section>
            ))}
          </div>
          {view === "overview" && (
            <div className="overview-grid">
              <section className="panel day-panel">
                <div className="panel-heading">
                  <div>
                    <h2>A snapshot of your day</h2>
                    <p>Appointment status · selected demo date</p>
                  </div>
                  <Badge>Sample data</Badge>
                </div>
                <div className="day-chart">
                  <div
                    className="donut"
                    style={{
                      background: day.length
                        ? `conic-gradient(var(--blue) 0 ${(scheduled / day.length) * 100}%, var(--teal) ${(scheduled / day.length) * 100}% ${((scheduled + completed) / day.length) * 100}%, var(--coral) ${((scheduled + completed) / day.length) * 100}% 100%)`
                        : "var(--border)",
                    }}
                    role="img"
                    aria-label={`${scheduled} scheduled, ${completed} completed, ${open} open slots`}
                  >
                    <div>
                      <strong>{day.length}</strong>
                      <span>total slots</span>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <div>
                      <span className="legend-dot scheduled" />
                      Scheduled <strong>{scheduled}</strong>
                    </div>
                    <div>
                      <span className="legend-dot completed" />
                      Completed <strong>{completed}</strong>
                    </div>
                    <div>
                      <span className="legend-dot open" />
                      Open slots <strong>{open}</strong>
                    </div>
                    <p>Each open slot is a chance to shorten someone’s wait.</p>
                  </div>
                </div>
              </section>
              <section className="opportunity-card">
                <div className="opportunity-label">
                  <Icon name="heart" />
                  MAKE ROOM FOR EARLIER CARE
                </div>
                <h2>
                  {open
                    ? "One opening.\nA new possibility."
                    : "A little planning.\nA better patient day."}
                </h2>
                <p>
                  {open
                    ? "The 2:00 PM sample slot is open. Explore the waitlist to see who is available."
                    : "Choose October 8 to explore the sample schedule and waitlist."}
                </p>
                <button
                  className="light-button"
                  onClick={() => onNavigate("waitlist")}
                >
                  Explore waitlist <Icon name="arrow" />
                </button>
                <span className="opportunity-decoration" aria-hidden="true">
                  +
                </span>
              </section>
            </div>
          )}
          <div className={view === "overview" ? "schedule-grid" : ""}>
            <section className="panel schedule-panel">
              <div className="panel-heading">
                <div>
                  <h2>Daily schedule</h2>
                  <p>
                    {date === DEMO_DATE
                      ? "Thursday, October 8"
                      : "Selected date"}{" "}
                    · Atlantic Standard Time
                  </p>
                </div>
                <Badge>{day.length} slots</Badge>
              </div>
              <div className="table-toolbar">
                <label className="search-field">
                  <Icon name="search" />
                  <span className="sr-only">
                    Search schedule by name or record ID
                  </span>
                  <input
                    type="search"
                    placeholder="Search name or record ID"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <label>
                  <span className="sr-only">Filter by appointment status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    aria-label="Appointment status"
                  >
                    <option>All statuses</option>
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Open slot</option>
                  </select>
                </label>
              </div>
              {filtered.length ? (
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Daily appointments"
                  tabIndex={0}
                >
                  <table>
                    <caption className="sr-only">
                      Synthetic appointment schedule
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">TIME</th>
                        <th scope="col">PATIENT</th>
                        <th scope="col">VISIT TYPE</th>
                        <th scope="col">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className={
                            appointment.status === "Open slot" ? "open-row" : ""
                          }
                        >
                          <td className="time-cell">
                            {appointment.time}
                            <span>30 min</span>
                          </td>
                          <td>
                            <div className="table-person">
                              {appointment.status === "Open slot" ? (
                                <span className="avatar open-avatar">
                                  <Icon name="calendar" />
                                </span>
                              ) : (
                                <Avatar name={appointment.name} />
                              )}
                              <div>
                                <strong>{appointment.name}</strong>
                                <span>
                                  {appointment.status === "Open slot"
                                    ? "Staff-confirmed sample cancellation"
                                    : appointment.id}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{appointment.type}</td>
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
                              {appointment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title={
                    day.length
                      ? "No matching appointments"
                      : "No sample appointments on this date"
                  }
                >
                  <p>
                    {day.length
                      ? "Try another name or clear your filters."
                      : "Sample appointments are available on October 8, 2026."}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setQuery("");
                      setStatus("All statuses");
                      setDate(DEMO_DATE);
                    }}
                  >
                    Reset filters and demo date
                  </button>
                </EmptyState>
              )}
              <div className="table-footer">
                <span role="status">
                  Showing {filtered.length} of {day.length} sample slots
                </span>
                <span>Single office · 30-minute visits</span>
              </div>
            </section>
            {view === "overview" && (
              <div className="right-column">
                <WaitlistPanel onNavigate={onNavigate} />
                <section className="care-note">
                  <span className="metric-icon green">
                    <Icon name="shield" />
                  </span>
                  <h3>Patient choice comes first</h3>
                  <p>
                    Earlier appointments are always an offer. An existing
                    booking stays in place until a replacement is confirmed.
                  </p>
                </section>
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
              <strong>A smaller wait starts with a good match.</strong> This
              preview shows availability only. Sending offers and managing
              entries require the backend.
            </p>
          </div>
          <WaitlistPanel full onNavigate={onNavigate} />
        </>
      )}
      {view === "activity" && (
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Preview activity</h2>
              <p>Illustrative events, not a persisted audit log</p>
            </div>
            <Badge tone="amber">Session only</Badge>
          </div>
          <ol className="timeline">
            <li>
              <span className="timeline-icon">
                <Icon name="calendar" />
              </span>
              <div>
                <strong>A sample slot became available</strong>
                <p>
                  October 8 · 2:00 PM · Fictional staff-confirmed cancellation.
                </p>
                <Badge>Fixture</Badge>
              </div>
            </li>
            <li>
              <span className="timeline-icon">
                <Icon name="users" />
              </span>
              <div>
                <strong>An earlier-visit offer is ready to preview</strong>
                <p>
                  Elena Morales · Explore accept, decline, and help in Patient
                  view.
                </p>
                <Badge>Fixture</Badge>
              </div>
            </li>
            {response && (
              <li>
                <span className="timeline-icon">
                  <Icon name="check" />
                </span>
                <div>
                  <strong>
                    {response === "accepted"
                      ? "Patient preview: accepted"
                      : response === "declined"
                        ? "Patient preview: declined"
                        : "Patient preview: requested help"}
                  </strong>
                  <p>Local response only. No booking or message was created.</p>
                  <Badge tone="blue">This session</Badge>
                </div>
              </li>
            )}
          </ol>
        </section>
      )}
    </div>
  );
}
