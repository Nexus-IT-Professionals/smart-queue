import { endTime, priorityDisclaimer } from "../../demo/scheduling";
import { PriorityBadge } from "../staff/SchedulingTools";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, Icon } from "../../components/ui";
import {
  responseMessages,
  selectedPatient,
  type DemoState,
  type DemoAction,
} from "../../demo/data";

export default function PatientWorkspace({
  demo,
  onAction,
  onProvider,
}: {
  demo: DemoState;
  onAction: (action: DemoAction) => void;
  onProvider: () => void;
}) {
  const { t, dateText, timeText } = useLanguage();
  const patient = selectedPatient(demo);
  const currentTime =
    demo.phase === "accepted" ? "2:00 PM" : patient.bookingTime;
  const response = ["accepted", "declined", "help"].includes(demo.phase)
    ? (demo.phase as "accepted" | "declined" | "help")
    : null;
  const hasOffer = demo.phase === "offered" || demo.phase === "help";
  const [confirming, setConfirming] = useState(false);
  const acceptButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const noOffer = useRef<HTMLElement>(null);
  const previousStep = useRef({ response, confirming });
  useEffect(() => {
    if (demo.phase === "scheduled") setConfirming(false);
  }, [demo.phase]);
  useEffect(() => {
    const previous = previousStep.current;
    if (previous.response !== response || previous.confirming !== confirming) {
      if (confirming) confirmation.current?.focus();
      else if (response) result.current?.focus();
      else (acceptButton.current ?? noOffer.current)?.focus();
    }
    previousStep.current = { response, confirming };
  }, [response, confirming]);
  return (
    <div className="workspace-content patient-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t("ISLA CARE / PATIENT WORKSPACE")}</p>
          <h1>{t("Your care, a little closer.")}</h1>
          <p>
            {patient.id === "WL-001"
              ? t("Welcome, Elena. An earlier appointment could fit your day.")
              : `${t("Selected patient")}: ${patient.name}`}
          </p>
        </div>
        <Badge tone="blue">{t("Fictional patient")}</Badge>
      </div>
      <p className="priority-disclaimer">{t(priorityDisclaimer)}</p>
      <div className="patient-grid">
        <div>
          <section className="panel patient-appointment">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t("YOUR CURRENT APPOINTMENT")}</p>
                <h2>{t("A spot on your calendar")}</h2>
              </div>
              <span className="metric-icon blue">
                <Icon name="calendar" />
              </span>
            </div>
            <div className="appointment-date">
              <div className="calendar-tile">
                <span>
                  {dateText("2026-10-08", {
                    month: "short",
                  }).toLocaleUpperCase()}
                </span>
                <strong>{demo.phase === "accepted" ? "08" : "22"}</strong>
              </div>
              <div>
                <h3>
                  {dateText(
                    demo.phase === "accepted" ? "2026-10-08" : "2026-10-22",
                  )}
                </h3>
                <p>
                  {timeText(currentTime)}–
                  {timeText(endTime(currentTime, patient.duration))} ·{" "}
                  {t("Atlantic Standard Time")}
                </p>
                <p>{t("Isla Care · San Juan · Consultation")}</p>
              </div>
            </div>
            <div className="appointment-footer">
              <Badge tone="green">{t("Scheduled · sample")}</Badge>
              <span>
                {demo.phase === "accepted"
                  ? t("Moved 14 days earlier in the demo only.")
                  : t("Your current appointment stays in place.")}
              </span>
            </div>
          </section>
          {demo.phase === "scheduled" || demo.phase === "open" ? (
            <section
              className="panel demo-access-card"
              ref={noOffer}
              tabIndex={-1}
            >
              <h2>{t("No earlier offer yet")}</h2>
              <p>
                {" "}
                {t(
                  "Your October 22 sample appointment is unchanged. Switch to Provider, confirm the fictional cancellation, and send the demo offer.",
                )}{" "}
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={onProvider}
              >
                {" "}
                {t("Open Demo Provider")} <Icon name="arrow" />
              </button>
            </section>
          ) : (
            <section className="panel offer-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">
                    {t("AN OPPORTUNITY TO BE SEEN SOONER")}
                  </p>
                  <h2>{t("Does an earlier visit work for you?")}</h2>
                </div>
                <Badge tone="green">{t("14 days earlier")}</Badge>
              </div>
              <div className="offer-date">
                <Icon name="clock" />
                <div>
                  <strong>
                    {dateText("2026-10-08")} · {timeText("2:00 PM")}
                  </strong>
                  <p>{t("30-minute consultation · Isla Care, San Juan")}</p>
                </div>
              </div>
              <p className="offer-explanation">
                {" "}
                {t(
                  "This is a simulated offer. Confirming updates only the fictional schedule in this browser. No real appointment or message is created.",
                )}{" "}
              </p>
              {hasOffer && !confirming && (
                <div className="offer-actions">
                  <button
                    type="button"
                    ref={acceptButton}
                    className="primary-button"
                    onClick={() => setConfirming(true)}
                  >
                    {" "}
                    {t("Preview acceptance")} <Icon name="arrow" />
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      onAction({ type: "respond", response: "declined" })
                    }
                  >
                    {" "}
                    {t("Keep my current visit")}{" "}
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      onAction({ type: "respond", response: "help" })
                    }
                  >
                    {" "}
                    {t("I need help")}{" "}
                  </button>
                </div>
              )}
              {hasOffer && confirming && (
                // biome-ignore lint/a11y/useSemanticElements: Focusable confirmation group contains actions, not form inputs.
                <div
                  className="confirmation"
                  ref={confirmation}
                  tabIndex={-1}
                  role="group"
                  aria-label={t("Confirm preview acceptance")}
                >
                  <h3>{t("Preview accepting October 8 at 2:00 PM?")}</h3>
                  <p>
                    {" "}
                    {t(
                      "This moves your fictional appointment to October 8 and updates the Provider view. No real appointment is reserved.",
                    )}{" "}
                  </p>
                  <div className="offer-actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        onAction({ type: "respond", response: "accepted" });
                        setConfirming(false);
                      }}
                    >
                      {" "}
                      {t("Confirm preview")}{" "}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirming(false)}
                    >
                      {" "}
                      {t("Go back")}{" "}
                    </button>
                  </div>
                </div>
              )}
              <div role="status" aria-live="polite">
                {response && (
                  <div className="response-notice" ref={result} tabIndex={-1}>
                    <Icon name="check" />
                    <p>{t(responseMessages[response])}</p>
                  </div>
                )}
              </div>
              {response && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    onAction({ type: "reset" });
                    setConfirming(false);
                  }}
                >
                  <Icon name="reset" /> {t("Restart demo scenario")}{" "}
                </button>
              )}
              <div className="panel-note">
                <Icon name="shield" />
                <p>
                  {" "}
                  {t(
                    "You’re in control. The demo changes the appointment only after your explicit confirmation.",
                  )}{" "}
                </p>
              </div>
            </section>
          )}
        </div>
        <div className="right-column">
          <section className="panel profile-panel">
            <div className="profile-heading">
              <Avatar name={patient.name} />
              <div>
                <h2>{patient.name}</h2>
                <PriorityBadge demo={demo} priority={patient.priority} />
                <p>
                  {t("Synthetic patient")} · {patient.id}
                </p>
              </div>
            </div>
            <dl className="profile-list">
              <div>
                <dt>{t("Preferred language")}</dt>
                <dd>{t(patient.language)}</dd>
              </div>
              <div>
                <dt>{t("Availability")}</dt>
                <dd>{t(patient.availability)}</dd>
              </div>
              <div>
                <dt>{t("Contact preference")}</dt>
                <dd>{t("In-app inbox · simulated")}</dd>
              </div>
              <div>
                <dt>{t("Waitlist preference")}</dt>
                <dd>{t("Earlier appointment")}</dd>
              </div>
            </dl>
            <p className="profile-note">
              {" "}
              {t(
                "Sample preferences are read-only. Profile editing is not connected yet.",
              )}{" "}
            </p>
          </section>
          <section className="care-note">
            <span className="metric-icon purple">
              <Icon name="heart" />
            </span>
            <h3>{t("Less waiting. Your choice.")}</h3>
            <p>
              {" "}
              {t(
                "Declining an earlier offer does not mean losing your current appointment.",
              )}{" "}
            </p>
            <p className="small-text">
              {" "}
              {t(
                "AI reply assistance is not connected. This preview uses explicit response buttons.",
              )}{" "}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
