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
          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => onNavigate("staff")}
            >
              {" "}
              {t("Start the guided demo")} <Icon name="arrow" />
            </button>
            <span>{t("Starts as the Provider · about 2 minutes")}</span>
          </div>
        </div>
      </div>
      {/* Instructions first, then the role cards (Patient left, Provider right). */}
      <section className="care-note demo-guide">
        <h2>{t("A complete demo in one browser")}</h2>
        <ol className="entry-steps">
          <li>
            <strong>{t("Cancel")}</strong>{" "}
            {t("As the Provider, confirm the sample 2:00 PM cancellation.")}
          </li>
          <li>
            <strong>{t("Offer")}</strong>{" "}
            {t("Send the open slot to the best-matched waiting patient.")}
          </li>
          <li>
            <strong>{t("Patient accepts")}</strong>{" "}
            {t("Switch to Patient and accept the earlier visit.")}
          </li>
          <li>
            <strong>{t("Result")}</strong>{" "}
            {t(
              "Return to Provider to see the filled slot, waitlist and activity log.",
            )}
          </li>
        </ol>
        <p>
          {" "}
          {t(
            "Switch roles at any time from the header. Reset or reload starts over. Nothing leaves this browser. Staff tools are in the Provider workspace; there is no separate Admin view.",
          )}{" "}
        </p>
      </section>
      <div className="demo-access-grid">
        <section className="panel demo-access-card patient-access">
          <span className="metric-icon green">
            <Icon name="heart" />
          </span>
          <h2>{t("Patient workspace")}</h2>
          <p>
            {" "}
            {t(
              "Continue as José Pérez to view a sample appointment and accept, decline, or ask for help with an earlier visit.",
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
        <section className="panel demo-access-card provider-access">
          <span className="metric-icon blue">
            <Icon name="users" />
          </span>
          <h2>{t("Provider workspace")}</h2>
          <p>
            {" "}
            {t(
              "Continue as Dr. Carlos Rivera to explore the schedule, confirm a sample cancellation, and offer the opening to a waiting patient.",
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
      </div>
    </div>
  );
}
