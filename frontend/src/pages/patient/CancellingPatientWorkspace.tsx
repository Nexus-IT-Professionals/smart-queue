import { useLanguage } from "../../i18n/LanguageProvider";
import { useEffect, useRef, useState } from "react";
import DemoGuide from "../../components/DemoGuide";
import { Avatar, Badge, Icon } from "../../components/ui";
import type { DemoAction, DemoState, DemoWorkspace } from "../../demo/data";
import { demoIdentities } from "../../demo/data";

// María's view: the patient whose cancellation starts the story.
export default function CancellingPatientWorkspace({
  demo,
  onAction,
  onNavigate,
}: {
  demo: DemoState;
  onAction: (action: DemoAction) => void;
  onNavigate: (role: DemoWorkspace) => void;
}) {
  const { t, dateText, timeText } = useLanguage();
  const cancelled = demo.phase !== "scheduled";
  const [confirming, setConfirming] = useState(false);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const previousStep = useRef({ cancelled, confirming });
  useEffect(() => {
    const previous = previousStep.current;
    if (previous.cancelled !== cancelled || previous.confirming !== confirming) {
      if (confirming) confirmation.current?.focus();
      else if (cancelled) result.current?.focus();
      else cancelButton.current?.focus();
    }
    previousStep.current = { cancelled, confirming };
  }, [cancelled, confirming]);
  // Patients see what the assistant did with their time, never who got it.
  const status = !cancelled
    ? "Your turn: cancel your October 8, 2:00 PM appointment below."
    : demo.phase === "unmatched"
      ? "Cancelled. No waiting patient fits the 2:00 PM time, so it stays open."
      : demo.phase === "notified"
        ? "Done. A waiting patient now has your former 2:00 PM time, and the office was notified."
        : "Cancelled. The AI assistant (simulated) offered your 2:00 PM time to a waiting patient.";
  return (
    <div className="workspace-content patient-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t("ISLA CARE / PATIENT WORKSPACE")}</p>
          <h1>{t("My appointment")}</h1>
          <p>{t("Welcome, María. Plans changed? You can cancel below.")}</p>
        </div>
        <Badge tone="blue">{t("Fictional patient")}</Badge>
      </div>
      <DemoGuide phase={demo.phase} status={t(status)}>
        {cancelled && demo.phase !== "notified" && (
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("jose")}
          >
            {" "}
            {t("Open José's view")} <Icon name="arrow" />
          </button>
        )}
        {demo.phase === "notified" && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate("staff")}
          >
            {" "}
            {t("See what the office sees")} <Icon name="arrow" />
          </button>
        )}
      </DemoGuide>
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
                <strong>8</strong>
              </div>
              <div>
                <h3>{dateText("2026-10-08")}</h3>
                <p>
                  {timeText("2:00 PM")}–{timeText("2:30 PM")} ·{" "}
                  {t("Atlantic Standard Time")}
                </p>
                <p>{t("Isla Care · San Juan · Consultation")}</p>
              </div>
            </div>
            <div className="appointment-footer">
              {cancelled ? (
                <Badge tone="amber">{t("Canceled")}</Badge>
              ) : (
                <Badge tone="green">{t("Scheduled · sample")}</Badge>
              )}
              <span>
                {cancelled
                  ? t("Cancelled in this demo only.")
                  : t("With Dr. Carlos Rivera.")}
              </span>
            </div>
            {!cancelled && !confirming && (
              <div className="offer-actions">
                <button
                  type="button"
                  ref={cancelButton}
                  className="secondary-button"
                  onClick={() => setConfirming(true)}
                >
                  {" "}
                  {t("Cancel my appointment")}{" "}
                </button>
              </div>
            )}
            {!cancelled && confirming && (
              // biome-ignore lint/a11y/useSemanticElements: Focusable confirmation group contains actions, not form inputs.
              <div
                className="confirmation"
                ref={confirmation}
                tabIndex={-1}
                role="group"
                aria-label={t("Confirm cancellation")}
              >
                <h3>{t("Cancel your October 8, 2:00 PM appointment?")}</h3>
                <p>
                  {" "}
                  {t(
                    "The time goes back to the office, and the AI assistant (simulated) offers it to a waiting patient. Fictional appointment; nothing real is cancelled.",
                  )}{" "}
                </p>
                <div className="offer-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      onAction({ type: "cancel" });
                      setConfirming(false);
                    }}
                  >
                    {" "}
                    {t("Yes, cancel my appointment")}{" "}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setConfirming(false)}
                  >
                    {" "}
                    {t("Keep my appointment")}{" "}
                  </button>
                </div>
              </div>
            )}
            <div role="status" aria-live="polite">
              {cancelled && (
                <div className="response-notice" ref={result} tabIndex={-1}>
                  <Icon name="check" />
                  <p>
                    {t(
                      "Appointment cancelled in this browser only. The AI assistant (simulated) is offering the time to a waiting patient.",
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="right-column">
          <section className="panel profile-panel">
            <div className="profile-heading">
              <Avatar name={demoIdentities.maria.name} />
              <div>
                <h2>{demoIdentities.maria.name}</h2>
                <p>{t("Synthetic patient")}</p>
              </div>
            </div>
            <dl className="profile-list">
              <div>
                <dt>{t("Preferred language")}</dt>
                <dd>{t("Spanish")}</dd>
              </div>
              <div>
                <dt>{t("Contact preference")}</dt>
                <dd>{t("In-app inbox · simulated")}</dd>
              </div>
            </dl>
          </section>
          <section className="care-note">
            <span className="metric-icon purple">
              <Icon name="heart" />
            </span>
            <h3>{t("Your time helps someone else.")}</h3>
            <p>
              {" "}
              {t(
                "When you cancel, a simulated, rule-based AI assistant offers the time to the best-matched waiting patient. No AI model and no real messages.",
              )}{" "}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
