import { useLanguage } from "../i18n/LanguageProvider";
import { Icon } from "../components/ui";
import type { DemoWorkspace } from "../demo/data";

export default function DemoAccess({
  onNavigate,
}: {
  onNavigate: (role: DemoWorkspace) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="workspace-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t("WELCOME, HACKATHON JUDGES")}</p>
          <h1>{t("Explore care without the wait.")}</h1>
          <p>
            {" "}
            {t(
              "No account, password, or personal information needed. Choose a fictional identity to begin.",
            )}{" "}
          </p>
        </div>
      </div>
      <div className="demo-access-grid">
        <section className="panel demo-access-card">
          <span className="metric-icon blue">
            <Icon name="users" />
          </span>
          <h2>{t("Provider workspace")}</h2>
          <p>
            {" "}
            {t(
              "Continue as Dr. Alex Rivera to explore the schedule, confirm a sample cancellation, and offer the opening to a waiting patient.",
            )}{" "}
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("staff")}
          >
            {" "}
            {t("Continue as Demo Provider")} <Icon name="arrow" />
          </button>
        </section>
        <section className="panel demo-access-card">
          <span className="metric-icon green">
            <Icon name="heart" />
          </span>
          <h2>{t("Patient workspace")}</h2>
          <p>
            {" "}
            {t(
              "Continue as Elena Morales to view a sample appointment and accept, decline, or ask for help with an earlier visit.",
            )}{" "}
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate("patient")}
          >
            {" "}
            {t("Continue as Demo Patient")} <Icon name="arrow" />
          </button>
        </section>
      </div>
      <section className="care-note demo-guide">
        <h2>{t("A complete demo in one browser")}</h2>
        <ol>
          <li>
            {t("Choose Provider and confirm the sample 2:00 PM cancellation.")}
          </li>
          <li>{t("Send the demo offer, then switch to Patient.")}</li>
          <li>
            {" "}
            {t(
              "Accept and confirm the offer. Return to Provider to see the updated schedule, waitlist, and activity log.",
            )}{" "}
          </li>
        </ol>
        <p>
          {" "}
          {t(
            "Switch roles at any time using the header. Reset restarts the scenario; refreshing clears it. This is a local simulation, not a live appointment or message. The Provider workspace includes staff scheduling tools; no separate Admin interface exists.",
          )}{" "}
        </p>
      </section>
    </div>
  );
}
