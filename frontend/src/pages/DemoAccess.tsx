import { Icon } from "../components/ui";
import type { DemoWorkspace } from "../demo/data";

export default function DemoAccess({
  onNavigate,
}: {
  onNavigate: (role: DemoWorkspace) => void;
}) {
  return (
    <div className="workspace-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WELCOME, HACKATHON JUDGES</p>
          <h1>Explore care without the wait.</h1>
          <p>
            No account, password, or personal information needed. Choose a
            fictional identity to begin.
          </p>
        </div>
      </div>
      <div className="demo-access-grid">
        <section className="panel demo-access-card">
          <span className="metric-icon blue">
            <Icon name="users" />
          </span>
          <h2>Provider workspace</h2>
          <p>
            Continue as Dr. Alex Rivera to explore the schedule, confirm a
            sample cancellation, and offer the opening to a waiting patient.
          </p>
          <button
            className="primary-button"
            onClick={() => onNavigate("staff")}
          >
            Continue as Demo Provider <Icon name="arrow" />
          </button>
        </section>
        <section className="panel demo-access-card">
          <span className="metric-icon green">
            <Icon name="heart" />
          </span>
          <h2>Patient workspace</h2>
          <p>
            Continue as Elena Morales to view a sample appointment and accept,
            decline, or ask for help with an earlier visit.
          </p>
          <button
            className="primary-button"
            onClick={() => onNavigate("patient")}
          >
            Continue as Demo Patient <Icon name="arrow" />
          </button>
        </section>
      </div>
      <section className="care-note demo-guide">
        <h2>A complete demo in one browser</h2>
        <ol>
          <li>Choose Provider and confirm the sample 2:00 PM cancellation.</li>
          <li>Send the demo offer, then switch to Patient.</li>
          <li>
            Accept and confirm the offer. Return to Provider to see the updated
            schedule, waitlist, and activity log.
          </li>
        </ol>
        <p>
          Switch roles at any time using the header. Reset restarts the
          scenario; refreshing clears it. This is a local simulation, not a live
          appointment or message. The Provider workspace includes staff
          scheduling tools; no separate Admin interface exists.
        </p>
      </section>
    </div>
  );
}
