import type { ReactNode, Ref } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import type { DemoPhase } from "../demo/data";
import { Icon } from "./ui";

// The same four steps on the entry page, Provider and Patient, so judges
// always see where they are in the cancellation → offer → acceptance story.
export const demoSteps = ["Cancel", "Offer", "Patient accepts", "Result"];
export function demoStepIndex(phase: DemoPhase) {
  if (phase === "scheduled") return 0;
  if (phase === "open") return 1;
  if (phase === "accepted") return 3;
  return 2;
}
export function DemoSteps({ phase }: { phase?: DemoPhase }) {
  const { t } = useLanguage();
  const current = phase ? demoStepIndex(phase) : -1;
  const finished = phase === "accepted";
  return (
    <ol className="stepper">
      {demoSteps.map((label, index) => {
        const done = index < current || (finished && index === current);
        return (
          <li
            key={label}
            className={done ? "done" : index === current ? "current" : ""}
            aria-current={index === current && !finished ? "step" : undefined}
          >
            <span className="step-dot" aria-hidden="true">
              {done ? <Icon name="check" /> : index + 1}
            </span>
            <span className="step-label">{t(label)}</span>
          </li>
        );
      })}
    </ol>
  );
}
export default function DemoGuide({
  phase,
  status,
  statusRef,
  children,
}: {
  phase: DemoPhase;
  status: ReactNode;
  statusRef?: Ref<HTMLParagraphElement>;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <section
      className={`panel demo-scenario${phase === "accepted" ? " demo-result" : ""}`}
      aria-label={t("Demo appointment workflow")}
    >
      <div className="demo-scenario-head">
        <h2>{t("Demo guide")}</h2>
        <DemoSteps phase={phase} />
      </div>
      <div className="demo-scenario-body">
        <p role="status" ref={statusRef} tabIndex={-1}>
          {status}
        </p>
        {children && <div className="demo-scenario-actions">{children}</div>}
      </div>
    </section>
  );
}
