import { useEffect, useState } from "react";
import {
  demoIdentities,
  type DemoAction,
  type DemoState,
} from "../../demo/data";
import {
  capacityCandidates,
  currentMonth,
  periodDates,
  statistics,
  validCapacity,
  type CapacityAction,
  type Period,
} from "../../demo/capacity";
import {
  calendarDays,
  endTime,
  shiftDate,
  shiftMonth,
  sortPatients,
} from "../../demo/scheduling";
import { useLanguage } from "../../i18n/LanguageProvider";
import { PriorityBadge, PriorityEditor } from "./SchedulingTools";

export default function CapacityDashboard({
  demo,
  onAction,
}: {
  demo: DemoState;
  onAction: (action: DemoAction) => void;
}) {
  const { t, dateText, timeText } = useLanguage();
  const state = demo.capacity;
  // Resource 1 is the demo provider; extra generated resources are numbered.
  const resourceName = (id: string) =>
    id === "RESOURCE-1"
      ? demoIdentities.staff.name
      : `${t("Provider")} ${id.replace("RESOURCE-", "")}`;
  const [date, setDate] = useState(`${state.month}-01`);
  const [period, setPeriod] = useState<Period>("month");
  const [resource, setResource] = useState("all");
  const [draft, setDraft] = useState(state.config);
  const [month, setMonth] = useState(state.month);
  const [confirmed, setConfirmed] = useState(false);
  const [regenerateConfirmed, setRegenerateConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  const [patientId, setPatientId] = useState("");
  const [target, setTarget] = useState("");
  useEffect(() => {
    setDraft(state.config);
    setMonth(state.month);
  }, [state.config, state.month]);
  useEffect(() => {
    const active = state.slots.find((s) => s.id === selected);
    if (
      active &&
      active.date === date &&
      (resource === "all" || active.provider === resource)
    )
      return;
    setSelected("");
    setConfirmed(false);
    setTarget("");
  }, [date, resource, selected, state.slots]);
  const dispatch = (action: CapacityAction) => {
    onAction({ type: "capacity", action });
    setMessage("Demo data updated.");
    setConfirmed(false);
    setRegenerateConfirmed(false);
  };
  const stats = statistics(state, date, period, resource);
  const dates = periodDates(date, period);
  const rows = state.slots.filter(
    (s) => s.date === date && (resource === "all" || s.provider === resource),
  );
  const slot = state.slots.find((s) => s.id === selected);
  const candidates = slot ? capacityCandidates(state, slot, demo.config) : [];
  const candidateId = candidates.some((p) => p.id === patientId)
    ? patientId
    : (candidates[0]?.id ?? "");
  const previousMonth = shiftMonth(date, -1).slice(0, 7);
  const previous = demo.capacityArchives[previousMonth];
  const previousStats = previous
    ? statistics(previous, `${previousMonth}-01`, "month", resource)
    : null;
  const weekly = Array.from(
    new Set(stats.trend.map((d) => calendarDays(d.date, "week")[0])),
  ).map((first) => ({
    first,
    days: stats.trend.filter((d) => calendarDays(d.date, "week")[0] === first),
  }));
  const ranked = [...stats.trend].sort(
    (a, b) =>
      b.occupied / b.capacity - a.occupied / a.capacity ||
      a.date.localeCompare(b.date),
  );
  const leastBusy = [...ranked].sort(
    (a, b) =>
      a.occupied / a.capacity - b.occupied / b.capacity ||
      a.date.localeCompare(b.date),
  )[0];
  const evenOccupancy =
    ranked.length > 0 &&
    ranked[0].occupied / ranked[0].capacity ===
      leastBusy.occupied / leastBusy.capacity;
  const metrics: [string, number | string][] = [
    ["Total capacity", stats.capacity],
    ["Occupied seats", stats.occupied],
    ["Available seats", stats.available],
    ["Waiting-list fill rate", `${stats.fillRate.toFixed(1)}%`],
    ["Cancellations", stats.canceled],
    ["Completed visits", stats.completed],
    ["Rescheduled appointments", stats.rescheduled],
    ["Successfully reassigned appointments", stats.assigned],
  ];
  const go = (offset: number) =>
    setDate(
      period === "month"
        ? shiftMonth(date, offset)
        : shiftDate(date, offset * (period === "week" ? 7 : 1)),
    );
  const inputTime = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const readTime = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  };
  return (
    <section
      className="capacity-dashboard"
      aria-label={t("Capacity & statistics")}
    >
      <div className="panel capacity-header">
        <div className="calendar-toolbar">
          <p>{t("Synthetic monthly operations · session only")}</p>
          <fieldset
            className="calendar-switch"
            aria-label={t("Statistics period")}
          >
            {(["day", "week", "month"] as const).map((p, i) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {t(["Day", "Week", "Month"][i])}
              </button>
            ))}
          </fieldset>
        </div>
        <div className="capacity-controls">
          <button
            type="button"
            className="secondary-button"
            aria-label={t("Previous period")}
            onClick={() => go(-1)}
          >
            ←
          </button>
          <strong aria-live="polite">
            {dateText(dates[0], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {dates.length > 1
              ? ` – ${dateText(dates[dates.length - 1], { month: "short", day: "numeric", year: "numeric" })}`
              : ""}
          </strong>
          <button
            type="button"
            className="secondary-button"
            aria-label={t("Next period")}
            onClick={() => go(1)}
          >
            →
          </button>
          <label>
            {t("Schedule date")}
            <input
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </label>
          <label>
            {t("Provider resource")}
            <select
              aria-label={t("Provider resource")}
              value={resource}
              onChange={(e) => setResource(e.target.value)}
            >
              <option value="all">{t("All resources")}</option>
              {Array.from(
                { length: state.config.resources },
                (_, i) => i + 1,
              ).map((id) => (
                <option key={id} value={`RESOURCE-${id}`}>
                  {resourceName(`RESOURCE-${id}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p>
          {dateText(`${state.month}-01`, { month: "long", year: "numeric" })}{" "}
          · {t("Operating hours")}:{" "}
          {timeText(endTime("12:00 AM", state.config.start))}–
          {timeText(endTime("12:00 AM", state.config.end))} ·{" "}
          {state.config.duration} {t("minutes")} · {state.config.seats}{" "}
          {t("seats per provider each day")}
        </p>
        {stats.partial && (
          <p className="section-notice">
            {t(
              "Partial coverage: only the generated month contributes capacity. Generate this month to explore it.",
            )}
          </p>
        )}
      </div>
      <section className="panel capacity-lead">
        <span>{t("Cancelled slots refilled from the waitlist")}</span>
        <strong className="metric-value">
          {stats.filled} {t("of")} {stats.eligibleReleases}
        </strong>
        <p>
          {t(
            "Each refill is a waiting patient seen sooner. Pick a day, cancel a visit and confirm a waitlist assignment to add one.",
          )}
        </p>
      </section>
      <div className="capacity-kpis">
        {metrics.map(([label, value]) => (
          <section className="metric-card" key={label}>
            <span>{t(label)}</span>
            <strong className="metric-value">{value}</strong>
          </section>
        ))}
      </div>
      <section className="panel capacity-summary">
        <h3>
          {t("Occupancy rate")}: {stats.occupancy.toFixed(1)}%
        </h3>
        <meter
          aria-label={t("Occupancy rate")}
          min={0}
          max={100}
          value={stats.occupancy}
        />
        <p>
          {t("Availability")}: {stats.availability.toFixed(1)}% ·{" "}
          {t("Cancellation rate")}: {stats.cancellationRate.toFixed(1)}% ·{" "}
          {t("Eligible released slots")}: {stats.eligibleReleases}
        </p>
        <p>
          {t("Patients waiting")}: {stats.waiting} ·{" "}
          {Object.entries(stats.priorities)
            .map(([p, n]) => `${p}: ${n}`)
            .join(" · ")}
        </p>
        {period === "month" && (
          <p>
            {previousStats
              ? `${t("Previous month occupancy")}: ${previousStats.occupancy.toFixed(1)}% · ${t("Change")}: ${(stats.occupancy - previousStats.occupancy).toFixed(1)} ${t("percentage points")}`
              : t("No previous-month snapshot available.")}
          </p>
        )}
        <p className="small-text">
          {t(
            "Completed visits consume capacity. Rates use aggregate counts; zero denominators display 0%. Waiting-list counts are the current session snapshot.",
          )}
        </p>
      </section>
      {period !== "day" && (
        <section className="panel capacity-grid-panel">
          <h3>{t("Select a day")}</h3>
          <section
            className="capacity-calendar-scroll"
            aria-label={t("Calendar days")}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable calendar needs keyboard access.
            tabIndex={0}
          >
            <div className="capacity-calendar">
              {calendarDays(date, period).map((d) => {
                const s = statistics(state, d, "day", resource);
                const high = new Set(
                  state.slots
                    .filter(
                      (slot) =>
                        slot.date === d &&
                        slot.status === "Open slot" &&
                        (resource === "all" || slot.provider === resource),
                    )
                    .flatMap((slot) =>
                      capacityCandidates(state, slot, demo.config),
                    )
                    .filter((p) => ["P1", "P2"].includes(p.priority))
                    .map((p) => p.id),
                ).size;
                return (
                  <button
                    type="button"
                    className={
                      d.slice(0, 7) !== date.slice(0, 7) ? "outside-month" : ""
                    }
                    key={d}
                    aria-pressed={date === d}
                    onClick={() => setDate(d)}
                  >
                    <strong>
                      {dateText(d, { weekday: "short", day: "numeric" })}
                    </strong>
                    <span>
                      {s.occupied}/{s.capacity}
                    </span>
                    <span>
                      {s.occupancy.toFixed(0)}% {t("occupied")}
                    </span>
                    <span>
                      {s.available} {t("available")}
                    </span>
                    {high > 0 && (
                      <span className="priority-badge priority-danger">
                        {high} {t("high-priority eligible")}
                      </span>
                    )}
                    {s.canceled > 0 && (
                      <span>
                        {s.canceled} {t("Canceled")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      )}
      {period !== "day" && (
        <section className="panel capacity-summary">
          <h3>
            {t(
              period === "month"
                ? "Weekly occupancy trend"
                : "Daily occupancy trend",
            )}
          </h3>
          <div className="capacity-trends">
            {(period === "month"
              ? weekly.map((w) => ({
                  date: w.first,
                  capacity: w.days.reduce((n, d) => n + d.capacity, 0),
                  occupied: w.days.reduce((n, d) => n + d.occupied, 0),
                }))
              : stats.trend
            ).map((d) => (
              <button
                type="button"
                key={d.date}
                onClick={() => {
                  setDate(
                    period === "month"
                      ? (weekly.find((w) => w.first === d.date)?.days[0]
                          ?.date ?? d.date)
                      : d.date,
                  );
                  setPeriod(period === "month" ? "week" : "day");
                }}
              >
                <span>
                  {dateText(d.date, { month: "short", day: "numeric" })}
                </span>
                <meter
                  min={0}
                  max={Math.max(1, d.capacity)}
                  value={d.occupied}
                  aria-label={t("Occupancy rate")}
                />
                <strong>
                  {d.occupied}/{d.capacity} ·{" "}
                  {(d.capacity ? (d.occupied / d.capacity) * 100 : 0).toFixed(
                    1,
                  )}
                  %
                </strong>
              </button>
            ))}
          </div>
          {ranked.length > 0 && (
            <p>
              {evenOccupancy
                ? t("Every operating day in this period has the same occupancy.")
                : `${t("Busiest day")}: ${dateText(ranked[0].date)} · ${t("Least busy day")}: ${dateText(leastBusy.date)}`}
            </p>
          )}
        </section>
      )}
      <section className="panel capacity-summary">
        <div className="calendar-toolbar">
          <h3>
            {t("Daily appointments")} · {dateText(date)}
          </h3>
          <button
            type="button"
            className="text-button"
            onClick={() => setPeriod("day")}
          >
            {t("Day")}
          </button>
        </div>
        <p>
          {t(
            "Choose an appointment to cancel, complete, reschedule, or refill with staff confirmation.",
          )}
        </p>
        <div className="capacity-slots">
          {rows.map((s) => (
            <button
              type="button"
              key={s.id}
              aria-pressed={selected === s.id}
              onClick={() => {
                setSelected(s.id);
                setConfirmed(false);
                setTarget("");
              }}
            >
              <strong>
                {timeText(s.time)} · {resourceName(s.provider)}
              </strong>
              <span>{t(s.name)}</span>
              <span>{t(s.status)}</span>
              {s.priority && (
                <PriorityBadge demo={demo} priority={s.priority} />
              )}
            </button>
          ))}
        </div>
        {!rows.length && (
          <p>{t("No bookable slots in this day or resource.")}</p>
        )}
        {slot && (
          <div className="capacity-actions">
            <h3>
              {t("Selected appointment")}: {dateText(slot.date)} ·{" "}
              {timeText(slot.time)} · {resourceName(slot.provider)}
            </h3>
            <label className="check-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              {t("Staff confirmation · synthetic scheduling only")}
            </label>
            {slot.status === "Scheduled" && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!confirmed}
                  onClick={() => dispatch({ type: "cancel", id: slot.id })}
                >
                  {t("Cancel selected appointment")}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!confirmed}
                  onClick={() => dispatch({ type: "complete", id: slot.id })}
                >
                  {t("Mark completed")}
                </button>
                <label>
                  {t("Reschedule destination")}
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="">{t("Select an available slot")}</option>
                    {state.slots
                      .filter(
                        (s) =>
                          s.status === "Open slot" &&
                          s.provider === slot.provider,
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {dateText(s.date, { month: "short", day: "numeric" })}{" "}
                          · {timeText(s.time)}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!confirmed || !target}
                  onClick={() =>
                    dispatch({ type: "move", id: slot.id, target, confirmed })
                  }
                >
                  {t("Confirm reschedule")}
                </button>
              </>
            )}
            {slot.status === "Open slot" && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!confirmed}
                  onClick={() => dispatch({ type: "book", id: slot.id })}
                >
                  {t("Book synthetic patient")}
                </button>
                <label>
                  {t("Eligible waiting-list candidates")}
                  <select
                    value={candidateId}
                    onChange={(e) => setPatientId(e.target.value)}
                  >
                    {!candidates.length && (
                      <option value="">{t("No eligible candidates")}</option>
                    )}
                    {candidates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.priority} · {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="primary-button"
                  disabled={!confirmed || !candidateId}
                  onClick={() =>
                    dispatch({
                      type: "assign",
                      id: slot.id,
                      patientId: candidateId,
                      confirmed,
                    })
                  }
                >
                  {t("Confirm waiting-list assignment")}
                </button>
              </>
            )}
          </div>
        )}
      </section>
      <details className="panel capacity-summary">
        <summary>{t("Monthly demo waiting list")}</summary>
        <p>
          {t(
            "Seeded priorities are fictional staff-confirmed scheduling examples, never automated triage.",
          )}
        </p>
        {sortPatients(state.waiting, demo.config).map((p) => (
          <div className="capacity-waiting" key={p.id}>
            <strong>
              {p.name} · {resourceName(p.provider)}
            </strong>
            <PriorityBadge demo={demo} priority={p.priority} />
            <PriorityEditor
              demo={demo}
              person={p}
              onAction={(action) => {
                if (action.type === "priority")
                  dispatch({
                    type: "priority",
                    patientId: action.patientId,
                    priority: action.priority,
                    confirmed: action.staffConfirmed,
                  });
              }}
            />
          </div>
        ))}
      </details>
      <details className="panel capacity-summary">
        <summary>{t("Capacity configuration & regenerate")}</summary>
        <p>
          {t(
            "Applying configuration regenerates the selected month and resets its bookings and waitlist. Other generated months retain their last snapshot. Reload clears all demo data.",
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validCapacity(draft)) {
              setMessage(
                "Invalid capacity: seats must fit operating hours and slot duration.",
              );
              return;
            }
            if (!regenerateConfirmed) return;
            dispatch({ type: "generate", month, config: draft });
            setDate(`${month}-01`);
            setSelected("");
            setResource("all");
          }}
        >
          <div className="capacity-config">
            <label>
              {t("Generated month")}
              <input
                type="month"
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setMonth(currentMonth())}
            >
              {t("Current month")}
            </button>
            <label>
              {t("Opening time")}
              <input
                type="time"
                required
                value={inputTime(draft.start)}
                onChange={(e) =>
                  setDraft({ ...draft, start: readTime(e.target.value) })
                }
              />
            </label>
            <label>
              {t("Closing time")}
              <input
                type="time"
                required
                value={inputTime(draft.end)}
                onChange={(e) =>
                  setDraft({ ...draft, end: readTime(e.target.value) })
                }
              />
            </label>
            {(
              [
                ["Slot duration", "duration", 5, 240],
                ["Seats per day per resource", "seats", 0, 288],
                ["Provider resources", "resources", 1, 4],
              ] as const
            ).map(([label, key, min, max]) => (
              <label key={key}>
                {t(label)}
                <input
                  type="number"
                  min={min}
                  max={max}
                  required
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <fieldset className="capacity-days">
            <legend>{t("Operating days")}</legend>
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((name, i) => (
              <label key={name}>
                <input
                  type="checkbox"
                  checked={draft.days.includes(i)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      days: e.target.checked
                        ? [...draft.days, i]
                        : draft.days.filter((d) => d !== i),
                    })
                  }
                />
                {t(name)}
              </label>
            ))}
          </fieldset>
          <label className="check-label">
            <input
              type="checkbox"
              checked={regenerateConfirmed}
              onChange={(e) => setRegenerateConfirmed(e.target.checked)}
            />
            {t("Confirm reset of generated month")}
          </label>
          <button
            type="submit"
            className="primary-button"
            disabled={!regenerateConfirmed}
          >
            {t("Apply & regenerate demo")}
          </button>
        </form>
      </details>
      <p role="status">{t(message)}</p>
    </section>
  );
}
