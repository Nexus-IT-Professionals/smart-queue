import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, Icon } from "../../components/ui";
import { responseMessages, type PreviewResponse } from "../../demo/data";

export default function PatientWorkspace({
  response,
  onRespond,
}: {
  response: PreviewResponse;
  onRespond: (response: PreviewResponse) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const acceptButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const previousStep = useRef({ response, confirming });
  useEffect(() => {
    const previous = previousStep.current;
    if (previous.response !== response || previous.confirming !== confirming) {
      if (response) result.current?.focus();
      else if (confirming) confirmation.current?.focus();
      else acceptButton.current?.focus();
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
                <strong>22</strong>
              </div>
              <div>
                <h3>Thursday, October 22</h3>
                <p>2:00–2:30 PM · Atlantic Standard Time</p>
                <p>Isla Care · San Juan · Consultation</p>
              </div>
            </div>
            <div className="appointment-footer">
              <Badge tone="green">Scheduled · sample</Badge>
              <span>Your current appointment stays in place.</span>
            </div>
          </section>
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
              This is a simulated offer. Try a response to preview the
              experience. It will not change your appointment or contact the
              office.
            </p>
            {!response && !confirming && (
              <div className="offer-actions">
                <button
                  ref={acceptButton}
                  className="primary-button"
                  onClick={() => setConfirming(true)}
                >
                  Preview acceptance <Icon name="arrow" />
                </button>
                <button
                  className="secondary-button"
                  onClick={() => onRespond("declined")}
                >
                  Keep my current visit
                </button>
                <button
                  className="text-button"
                  onClick={() => onRespond("help")}
                >
                  I need help
                </button>
              </div>
            )}
            {!response && confirming && (
              <div
                className="confirmation"
                ref={confirmation}
                tabIndex={-1}
                role="group"
                aria-label="Confirm preview acceptance"
              >
                <h3>Preview accepting October 8 at 2:00 PM?</h3>
                <p>
                  This records a local response only. No real appointment is
                  reserved.
                </p>
                <div className="offer-actions">
                  <button
                    className="primary-button"
                    onClick={() => {
                      onRespond("accepted");
                      setConfirming(false);
                    }}
                  >
                    Confirm preview
                  </button>
                  <button
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
                className="text-button"
                onClick={() => {
                  onRespond(null);
                  setConfirming(false);
                }}
              >
                <Icon name="reset" />
                Reset offer preview
              </button>
            )}
            <div className="panel-note">
              <Icon name="shield" />
              <p>
                You’re in control. In the planned booking flow, an earlier visit
                will require your explicit confirmation.
              </p>
            </div>
          </section>
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
