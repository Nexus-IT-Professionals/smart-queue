import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  calendarAppointments,
  cancellationHistory,
  demoWaitlist,
  eligibleCandidates,
  type DemoAction,
  type DemoState,
} from "../../demo/data";
import {
  calendarDays,
  eligible,
  priorityDisclaimer,
  priorityLevel,
  shiftDate,
  shiftMonth,
  validConfig,
  type PriorityConfig,
  type PriorityId,
  type PriorityTone,
  type WaitingPatient,
} from "../../demo/scheduling";
export function PriorityBadge({
  demo,
  priority,
  hideDefault = false,
}: {
  demo: DemoState;
  priority?: PriorityId;
  // Busy lists show only levels that differ from the default.
  hideDefault?: boolean;
}) {
  const { t } = useLanguage();
  const level = priorityLevel(demo.config, priority);
  if (hideDefault && level.id === demo.config.defaultId) return null;
  return (
    <span
      className={`priority-badge priority-${level.tone}`}
      title={t(level.description)}
    >
      {level.id} · {t(level.label)}
    </span>
  );
}
export function PriorityEditor({
  person,
  demo,
  onAction,
}: {
  person: WaitingPatient;
  demo: DemoState;
  onAction: (action: DemoAction) => void;
}) {
  const { t } = useLanguage();
  const [priority, setPriority] = useState(person.priority);
  const [confirmed, setConfirmed] = useState(false);
  const selectedPriority = demo.config.levels.some(
    (l) => l.id === priority && l.enabled,
  )
    ? priority
    : person.priority;
  return (
    <form
      className="priority-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onAction({
          type: "priority",
          patientId: person.id,
          priority: selectedPriority,
          staffConfirmed: confirmed,
        });
        setConfirmed(false);
      }}
    >
      <label>
        {t("Scheduling priority")}
        <select
          aria-label={`${t("Scheduling priority")} · ${person.name}`}
          value={selectedPriority}
          onChange={(e) => {
            setPriority(e.target.value as PriorityId);
            setConfirmed(false);
          }}
        >
          {demo.config.levels
            .filter((l) => l.enabled)
            .sort((a, b) => a.rank - b.rank)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} · {t(l.label)}
              </option>
            ))}
        </select>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        {t("Qualified staff review confirmed (demo)")}
      </label>
      <button
        className="secondary-button"
        type="submit"
        disabled={!confirmed || selectedPriority === person.priority}
      >
        {t("Save priority")}
      </button>
    </form>
  );
}
export function CandidateReview({
  demo,
  candidateId,
  onSelect,
}: {
  demo: DemoState;
  candidateId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useLanguage();
  const candidates = eligibleCandidates(demo);
  return (
    <div className="candidate-review">
      <h3>{t("Eligible candidates · staff review")}</h3>
      <p>
        {t(
          "Ranked by configured priority, then oldest request. Confirm an offer; the patient must accept before the schedule changes.",
        )}
      </p>
      {candidates.length ? (
        <>
          <label>
            {t("Offer recipient")}
            <select
              value={candidateId}
              onChange={(e) => onSelect(e.target.value)}
            >
              {candidates.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name} · {p.priority} · {p.since}
                </option>
              ))}
            </select>
          </label>
          <ol>
            {candidates.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>{" "}
                <PriorityBadge demo={demo} priority={p.priority} />{" "}
                <span>{t(p.availability)}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p role="status">
          {t("No eligible candidates. No appointment will be reassigned.")}
        </p>
      )}
      <p className="small-text">
        {t(
          "Only matching office, provider, visit type, duration, date and full time window qualify. Existing patient or provider conflicts exclude a candidate.",
        )}
      </p>
    </div>
  );
}
export function PriorityConfiguration({
  demo,
  onAction,
}: {
  demo: DemoState;
  onAction: (action: DemoAction) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<PriorityConfig>(() =>
    structuredClone(demo.config),
  );
  const [message, setMessage] = useState("");
  useEffect(() => {
    setDraft(structuredClone(demo.config));
  }, [demo.config]);
  return (
    <section className="panel priority-settings">
      <details>
        <summary>{t("Priority configuration")}</summary>
        <p>{t(priorityDisclaimer)}</p>
        <p>
          {t(
            "Lower order numbers rank first. Request date breaks ties; record ID breaks exact ties. Disabled levels move existing records to the enabled default. P1 cannot be the default.",
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validConfig(draft)) {
              setMessage(
                "Use unique order values 1–4 and an enabled non-urgent default. Labels and descriptions are required.",
              );
              return;
            }
            onAction({ type: "configure", config: draft });
            setMessage("Priority configuration saved for this demo session.");
          }}
        >
          <div className="priority-settings-grid">
            {draft.levels.map((level, index) => {
              const update = (patch: Partial<typeof level>) =>
                setDraft({
                  ...draft,
                  levels: draft.levels.map((l, i) =>
                    i === index ? { ...l, ...patch } : l,
                  ),
                });
              return (
                <fieldset key={level.id}>
                  <legend>{level.id}</legend>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={level.enabled}
                      onChange={(e) => update({ enabled: e.target.checked })}
                    />
                    {t("Enabled")}
                  </label>
                  <label>
                    {t("Label")}
                    <input
                      maxLength={32}
                      required
                      value={level.label}
                      onChange={(e) => update({ label: e.target.value })}
                    />
                  </label>
                  <label>
                    {t("Description")}
                    <textarea
                      aria-label={t("Description")}
                      rows={3}
                      maxLength={160}
                      required
                      value={level.description}
                      onChange={(e) => update({ description: e.target.value })}
                    />
                  </label>
                  <label>
                    {t("Indicator")}
                    <select
                      value={level.tone}
                      onChange={(e) =>
                        update({ tone: e.target.value as PriorityTone })
                      }
                    >
                      {(
                        ["danger", "warning", "info", "secondary"] as const
                      ).map((tone, i) => (
                        <option key={tone} value={tone}>
                          {t(["Red", "Orange", "Blue", "Gray"][i])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("Order")}
                    <input
                      type="number"
                      min={1}
                      max={4}
                      required
                      value={level.rank}
                      onChange={(e) => update({ rank: Number(e.target.value) })}
                    />
                  </label>
                </fieldset>
              );
            })}
          </div>
          <label>
            {t("Default priority")}
            <select
              value={draft.defaultId}
              onChange={(e) =>
                setDraft({ ...draft, defaultId: e.target.value as PriorityId })
              }
            >
              {draft.levels
                .filter((l) => l.id !== "P1")
                .map((l) => (
                  <option key={l.id} value={l.id} disabled={!l.enabled}>
                    {l.id} · {t(l.label)}
                  </option>
                ))}
            </select>
          </label>
          <button type="submit" className="primary-button">
            {t("Save configuration")}
          </button>
          <p role="status">{t(message)}</p>
        </form>
      </details>
    </section>
  );
}
export function ProviderCalendar({
  demo,
  date,
  onDate,
}: {
  demo: DemoState;
  date: string;
  onDate: (date: string) => void;
}) {
  const { t, dateText } = useLanguage();
  const [mode, setMode] = useState<"day" | "week" | "month">("day");
  const calendarScroll = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mode === "day") return;
    const region = calendarScroll.current;
    const selected = region?.querySelector<HTMLButtonElement>(
      `[data-date="${date}"]`,
    );
    if (!region || !selected) return;
    const bounds = region.getBoundingClientRect(),
      cell = selected.getBoundingClientRect();
    if (cell.left < bounds.left || cell.right > bounds.right)
      region.scrollLeft +=
        cell.left - bounds.left - (region.clientWidth - cell.width) / 2;
  }, [date, mode]);
  const bookings = calendarAppointments(demo),
    cancellations = cancellationHistory(demo),
    waiting = demoWaitlist(demo);
  const navigate = (offset: number) =>
    onDate(
      mode === "month"
        ? shiftMonth(date, offset)
        : shiftDate(date, offset * (mode === "week" ? 7 : 1)),
    );
  return (
    <section
      className="panel provider-calendar"
      aria-label={t("Provider calendar")}
    >
      <div className="calendar-toolbar">
        <fieldset aria-label={t("Calendar view")} className="calendar-switch">
          {(["day", "week", "month"] as const).map((value, index) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {t(["Day", "Week", "Month"][index])}
            </button>
          ))}
        </fieldset>
        <div className="calendar-navigation">
          <button
            type="button"
            className="secondary-button"
            aria-label={t("Previous period")}
            onClick={() => navigate(-1)}
          >
            ←
          </button>
          <h2 aria-live="polite">
            {dateText(
              date,
              mode === "month" ? { month: "long", year: "numeric" } : undefined,
            )}
          </h2>
          <button
            type="button"
            className="secondary-button"
            aria-label={t("Next period")}
            onClick={() => navigate(1)}
          >
            →
          </button>
        </div>
      </div>
      {mode !== "day" && (
        <>
          <p>
            {t(
              "Select a day to review appointments below. Blank days have no demo capacity; no availability is inferred.",
            )}
          </p>
          <section
            className="calendar-scroll"
            ref={calendarScroll}
            aria-label={t("Calendar days")}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Enables keyboard scrolling.
            tabIndex={0}
          >
            <div className={`calendar-days calendar-${mode}`}>
              {calendarDays(date, mode).map((day) => {
                const rows = bookings.filter((a) => a.date === day),
                  canceled = cancellations.filter((a) => a.date === day).length;
                const open = rows.filter((a) => a.status === "Open slot");
                const count = (status: string) =>
                  rows.filter((a) => a.status === status).length;
                const high = waiting.filter(
                  (p) =>
                    ["P1", "P2"].includes(p.priority) &&
                    open.some((a) => eligible(p, a, bookings)),
                ).length;
                return (
                  <button
                    type="button"
                    key={day}
                    data-date={day}
                    aria-pressed={day === date}
                    className={
                      day.slice(0, 7) !== date.slice(0, 7)
                        ? "outside-month"
                        : ""
                    }
                    onClick={() => onDate(day)}
                    aria-label={`${dateText(day, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · ${rows.length} ${t("slots")} · ${high} ${t("high-priority eligible")}`}
                  >
                    <strong>
                      {dateText(day, { weekday: "short", day: "numeric" })}
                    </strong>
                    <span>
                      {rows.length} {t("slots")}
                    </span>
                    {rows.length > 0 && (
                      <>
                        <span className="calendar-scheduled">
                          {count("Scheduled")} {t("Scheduled")}
                        </span>
                        <span className="calendar-completed">
                          {count("Completed")} {t("Completed")}
                        </span>
                        <span className="calendar-open">
                          {open.length} {t("Open slots")}
                        </span>
                      </>
                    )}
                    {canceled > 0 && (
                      <span className="calendar-canceled">
                        {canceled} {t("Canceled")}
                      </span>
                    )}
                    {high > 0 && (
                      <span className="priority-badge priority-danger">
                        {high} {t("high-priority eligible")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
      {cancellations.some((a) => a.date === date) && (
        <p className="cancellation-history">
          <Badge tone="amber">{t("Canceled")}</Badge> {cancellations[0]?.name} ·{" "}
          {t("October 8 · 2:00 PM")} ·{" "}
          {t(
            "Historical cancellation; the released slot is counted separately.",
          )}
        </p>
      )}
    </section>
  );
}
