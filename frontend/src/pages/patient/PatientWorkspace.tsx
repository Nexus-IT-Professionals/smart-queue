import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, Icon } from "../../components/ui";
import {
  responseMessages,
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
          <p className="eyebrow">ISLA CARE / PATIENT WORKSPACE</p>
          <h1>Your care, a little closer.</h1>
          <p>Welcome, Elena. An earlier appointment could fit your day.</p>
        </div>
        <Badge tone="blue">Fictional patient</Badge>
      </div>
      <div className="patient-grid">
        <div>
          <section className="panel patient-appointment">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">YOUR CURRENT APPOINTMENT</p>
                <h2>A spot on your calendar</h2>
              </div>
              <span className="metric-icon blue">
                <Icon name="calendar" />
              </span>
            </div>
            <div className="appointment-date">
              <div className="calendar-tile">
                <span>OCT</span>
                <strong>{demo.phase === "accepted" ? "08" : "22"}</strong>
              </div>
              <div>
                <h3>
                  Thursday, October {demo.phase === "accepted" ? "8" : "22"}
                </h3>
                <p>2:00–2:30 PM · Atlantic Standard Time</p>
                <p>Isla Care · San Juan · Consultation</p>
              </div>
            </div>
            <div className="appointment-footer">
              <Badge tone="green">Scheduled · sample</Badge>
              <span>
                {demo.phase === "accepted"
                  ? "Moved 14 days earlier in the demo only."
                  : "Your current appointment stays in place."}
              </span>
            </div>
          </section>
          {demo.phase === "scheduled" || demo.phase === "open" ? (
            <section
              className="panel demo-access-card"
              ref={noOffer}
              tabIndex={-1}
            >
              <h2>No earlier offer yet</h2>
              <p>
                Your October 22 sample appointment is unchanged. Switch to
                Provider, confirm the fictional cancellation, and send the demo
                offer.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={onProvider}
              >
                Open Demo Provider <Icon name="arrow" />
              </button>
            </section>
          ) : (
            <section className="panel offer-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">AN OPPORTUNITY TO BE SEEN SOONER</p>
                  <h2>Does an earlier visit work for you?</h2>
                </div>
                <Badge tone="green">14 days earlier</Badge>
              </div>
              <div className="offer-date">
                <Icon name="clock" />
                <div>
                  <strong>Thursday, October 8 · 2:00 PM</strong>
                  <p>30-minute consultation · Isla Care, San Juan</p>
                </div>
              </div>
              <p className="offer-explanation">
                This is a simulated offer. Confirming updates only the fictional
                schedule in this browser. No real appointment or message is
                created.
              </p>
              {hasOffer && !confirming && (
                <div className="offer-actions">
                  <button
                    type="button"
                    ref={acceptButton}
                    className="primary-button"
                    onClick={() => setConfirming(true)}
                  >
                    Preview acceptance <Icon name="arrow" />
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      onAction({ type: "respond", response: "declined" })
                    }
                  >
                    Keep my current visit
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      onAction({ type: "respond", response: "help" })
                    }
                  >
                    I need help
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
                  aria-label="Confirm preview acceptance"
                >
                  <h3>Preview accepting October 8 at 2:00 PM?</h3>
                  <p>
                    This moves your fictional appointment to October 8 and
                    updates the Provider view. No real appointment is reserved.
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
                      Confirm preview
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirming(false)}
                    >
                      Go back
                    </button>
                  </div>
                </div>
              )}
              <div role="status" aria-live="polite">
                {response && (
                  <div className="response-notice" ref={result} tabIndex={-1}>
                    <Icon name="check" />
                    <p>{responseMessages[response]}</p>
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
                  <Icon name="reset" />
                  Restart demo scenario
                </button>
              )}
              <div className="panel-note">
                <Icon name="shield" />
                <p>
                  You’re in control. The demo changes the appointment only after
                  your explicit confirmation.
                </p>
              </div>
            </section>
          )}
        </div>
        <div className="right-column">
          <section className="panel profile-panel">
            <div className="profile-heading">
              <Avatar name="Elena Morales" />
              <div>
                <h2>Elena Morales</h2>
                <p>Synthetic patient · SQ-P01</p>
              </div>
            </div>
            <dl className="profile-list">
              <div>
                <dt>Preferred language</dt>
                <dd>Spanish</dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd>Afternoons · 1–4 PM</dd>
              </div>
              <div>
                <dt>Contact preference</dt>
                <dd>In-app inbox · simulated</dd>
              </div>
              <div>
                <dt>Waitlist preference</dt>
                <dd>Earlier appointment</dd>
              </div>
            </dl>
            <p className="profile-note">
              Sample preferences are read-only. Profile editing is not connected
              yet.
            </p>
          </section>
          <section className="care-note">
            <span className="metric-icon purple">
              <Icon name="heart" />
            </span>
            <h3>Less waiting. Your choice.</h3>
            <p>
              Declining an earlier offer does not mean losing your current
              appointment.
            </p>
            <p className="small-text">
              AI reply assistance is not connected. This preview uses explicit
              response buttons.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
