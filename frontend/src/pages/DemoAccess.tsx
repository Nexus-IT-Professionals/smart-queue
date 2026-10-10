import { useLanguage } from "../i18n/LanguageProvider";
import { Icon, type IconName } from "../components/ui";
import type { DemoWorkspace } from "../demo/data";

// One card per person in the story, in story order.
const roleCards: {
  role: DemoWorkspace;
  title: string;
  text: string;
  action: string;
  icon: IconName;
  tone: string;
}[] = [
  {
    role: "maria",
    title: "María · patient who cancels",
    text: "Continue as María Rodríguez and cancel her October 8, 2:00 PM appointment.",
    action: "Continue as María",
    icon: "calendar",
    tone: "coral",
  },
  {
    role: "jose",
    title: "José · waiting patient",
    text: "Continue as José Pérez, on the waitlist for an earlier visit, and accept the AI assistant's offer.",
    action: "Continue as José",
    icon: "heart",
    tone: "green",
  },
  {
    role: "staff",
    title: "Ana · medical office",
    text: "Continue as Ana Martínez to watch Dr. Carlos Rivera's schedule, the AI activity and her notification.",
    action: "Continue as Ana",
    icon: "users",
    tone: "blue",
  },
];
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
              "An AI assistant (simulated) takes over the office's manual work of refilling a cancelled appointment. No account, password, or personal information needed.",
            )}{" "}
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => onNavigate("maria")}
            >
              {" "}
              {t("Start the guided demo")} <Icon name="arrow" />
            </button>
            <span>{t("Starts as María · about 2 minutes")}</span>
          </div>
        </div>
      </div>
      {/* Instructions first, then one card per role in story order. */}
      <section className="care-note demo-guide">
        <h2>{t("A complete demo in one browser")}</h2>
        <ol className="entry-steps">
          <li>
            <strong>{t("María cancels")}</strong>{" "}
            {t("As María, cancel her October 8, 2:00 PM appointment.")}
          </li>
          <li>
            <strong>{t("AI assistant offers")}</strong>{" "}
            {t(
              "The AI assistant (simulated) detects the opening, picks José with the scheduling rules and sends him an offer.",
            )}
          </li>
          <li>
            <strong>{t("Patient accepts")}</strong>{" "}
            {t("Switch to José and accept the earlier visit.")}
          </li>
          <li>
            <strong>{t("Ana is notified")}</strong>{" "}
            {t(
              "The AI assistant updates the schedule and notifies Ana. Switch to Ana to see it.",
            )}
          </li>
        </ol>
        <p>
          {" "}
          {t(
            "Switch roles at any time from the header. Reset or reload starts over. Nothing leaves this browser. The AI assistant is simulated: fixed scheduling rules, no AI model, no network.",
          )}{" "}
        </p>
      </section>
      <div className="demo-access-grid demo-access-roles">
        {roleCards.map((card) => (
          <section
            className={`panel demo-access-card ${card.role}-access`}
            key={card.role}
          >
            <span className={`metric-icon ${card.tone}`}>
              <Icon name={card.icon} />
            </span>
            <h2>{t(card.title)}</h2>
            <p>{t(card.text)}</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => onNavigate(card.role)}
            >
              {" "}
              {t(card.action)} <Icon name="arrow" />
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
