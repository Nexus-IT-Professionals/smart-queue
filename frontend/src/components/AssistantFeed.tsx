import type { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  AI_ASSISTANT,
  demoAssistant,
  isAssistantEvent,
  isStoryEvent,
  type DemoState,
  type SelectionReasoning,
  type StoryEvent,
} from "../demo/data";
import { Badge, Icon, type IconName } from "./ui";

// Story steps are structured events; these helpers render them in the current
// language. Every sentence comes from the event's own recorded values.
export function fill(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
const SHORT_DATE = { month: "short", day: "numeric" } as const;
export function useStoryText() {
  const { t, dateText, timeText, language } = useLanguage();
  const list = (names: string[]) =>
    new Intl.ListFormat(language === "es" ? "es" : "en", {
      type: "conjunction",
    }).format(names);
  const when = (date: string, time: string) =>
    `${dateText(date, { month: "long", day: "numeric" })} · ${timeText(time)}`;
  function title(event: StoryEvent): [string, IconName] {
    const titles: Record<StoryEvent["kind"], [string, IconName]> = {
      cancelled: ["Appointment cancelled", "calendar"],
      detected: ["Cancellation detected", "activity"],
      selected: ["Best match selected", "users"],
      unmatched: ["No eligible patient", "users"],
      offered: ["Offer sent", "arrow"],
      accepted: ["Offer accepted", "check"],
      updated: ["Schedule updated", "calendar"],
      notified: ["Office notified", "heart"],
    };
    const [text, icon] = titles[event.kind];
    return [t(text), icon];
  }
  function sentence(event: StoryEvent) {
    switch (event.kind) {
      case "cancelled":
        return fill(
          t(
            "{name} cancelled her October 8 · 2:00 PM appointment with Dr. Carlos Rivera.",
          ),
          { name: event.name },
        );
      case "detected":
        return fill(
          t(
            "Detected {name}'s cancellation. The October 8 · 2:00 PM slot is open.",
          ),
          { name: event.name },
        );
      case "selected":
        return fill(t("Selected {name} from {count} waiting patients."), {
          name: event.name,
          count: event.reasoning.scanned,
        });
      case "unmatched":
        return t(
          "No waiting patient fits the October 8 · 2:00 PM slot. It stays open.",
        );
      case "offered":
        return fill(
          t("Sent {name} a simulated in-app offer for October 8 · 2:00 PM."),
          { name: event.name },
        );
      case "accepted":
        return fill(t("{name} accepted the earlier visit in the patient view."), {
          name: event.name,
        });
      case "updated":
        return fill(
          t(
            "Moved {name} to October 8 · 2:00 PM, released the {released} appointment and updated the waitlist ({before} → {after}).",
          ),
          {
            name: event.name,
            released: when(event.releasedDate, event.releasedTime),
            before: event.waitlistBefore,
            after: event.waitlistAfter,
          },
        );
      case "notified":
        return fill(
          t(
            "Notified {name}, Medical Office Assistant, with a summary of the changes.",
          ),
          { name: event.name },
        );
    }
  }
  function reasons(reasoning: SelectionReasoning) {
    const priority = `${reasoning.priority} · ${t(reasoning.priorityLabel)}`;
    const lines = [
      fill(t("Availability {availability} covers the 2:00 PM slot."), {
        availability: t(reasoning.availability),
      }),
    ];
    if (reasoning.decidedBy === "request")
      lines.push(
        fill(
          t(
            "Same priority ({priority}) as {names}; the oldest request wins ({date}).",
          ),
          {
            priority,
            names: list(reasoning.tiedWith),
            date: dateText(reasoning.since, SHORT_DATE),
          },
        ),
      );
    else if (reasoning.decidedBy === "priority")
      lines.push(
        fill(
          t("Highest scheduling priority among eligible patients ({priority})."),
          { priority },
        ),
      );
    else if (reasoning.decidedBy === "id")
      lines.push(
        fill(
          t(
            "Same priority and request date as {names}; the record ID breaks the tie.",
          ),
          { names: list(reasoning.tiedWith) },
        ),
      );
    else lines.push(t("The only eligible patient on the waitlist."));
    if (reasoning.next)
      lines.push(
        fill(t("Next in line: {name}, newer request ({date})."), {
          name: reasoning.next.name,
          date: dateText(reasoning.next.since, SHORT_DATE),
        }),
      );
    for (const person of reasoning.excluded)
      lines.push(
        person.reason === "time"
          ? fill(t("Excluded {name}: {availability} does not cover 2:00 PM."), {
              name: person.name,
              availability: t(person.availability),
            })
          : fill(
              t(
                "Excluded {name}: provider, visit type or dates do not match this slot.",
              ),
              { name: person.name },
            ),
      );
    return lines;
  }
  return { title, sentence, reasons };
}
export function AssistantLabel() {
  const { t } = useLanguage();
  return <span className="ai-label">{t(AI_ASSISTANT)}</span>;
}
export function ReasoningList({
  reasoning,
}: {
  reasoning: SelectionReasoning;
}) {
  const { reasons } = useStoryText();
  return (
    <ul className="ai-reasoning">
      {reasons(reasoning).map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
function actor(event: StoryEvent): ReactNode {
  if (event.kind === "cancelled" || event.kind === "accepted")
    return <span className="ai-actor">{event.name}</span>;
  return <AssistantLabel />;
}
// Every story step in order: the person's action, then what the AI did.
export function AssistantFeed({ demo }: { demo: DemoState }) {
  const { t } = useLanguage();
  const { title, sentence } = useStoryText();
  const story = demo.events.filter(isStoryEvent);
  return (
    <section className="panel ai-feed-panel" aria-labelledby="ai-feed-title">
      <div className="panel-heading">
        <div>
          <h2 id="ai-feed-title">{t("AI activity")}</h2>
          <p>
            {t(
              "Rule-based and simulated: no AI model, no network. Each step is shown as it happens.",
            )}
          </p>
        </div>
        <Badge tone="blue">{story.filter(isAssistantEvent).length}</Badge>
      </div>
      {story.length ? (
        <ol className="timeline ai-feed">
          {story.map((event) => (
            <li
              key={event.kind}
              className={isAssistantEvent(event) ? "ai-step" : "person-step"}
            >
              <span className="timeline-icon">
                <Icon name={title(event)[1]} />
              </span>
              <div>
                <strong>{title(event)[0]}</strong> {actor(event)}
                <p>{sentence(event)}</p>
                {event.kind === "selected" && (
                  <ReasoningList reasoning={event.reasoning} />
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="ai-feed-empty">
          {t(
            "Watching Dr. Carlos Rivera's schedule. The assistant acts as soon as a patient cancels.",
          )}
        </p>
      )}
    </section>
  );
}
// Ana's notification: the end of the story. She is informed, not asked.
export function AssistantNotification({ demo }: { demo: DemoState }) {
  const { t } = useLanguage();
  const { sentence, reasons } = useStoryText();
  const story = demo.events.filter(isStoryEvent);
  const find = <K extends StoryEvent["kind"]>(kind: K) =>
    story.find((e): e is Extract<StoryEvent, { kind: K }> => e.kind === kind);
  const cancelled = find("cancelled"),
    selected = find("selected"),
    accepted = find("accepted"),
    updated = find("updated");
  if (demo.phase !== "notified" || !cancelled || !selected || !accepted || !updated)
    return null;
  return (
    <section
      className="panel ai-notification"
      aria-labelledby="ai-notification-title"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            <AssistantLabel />
          </p>
          <h2 id="ai-notification-title">
            {fill(t("Notification for {name}"), { name: demoAssistant.name })}
          </h2>
          <p>{t("The opening was filled without manual work. No action needed.")}</p>
        </div>
        <span className="metric-icon green">
          <Icon name="check" />
        </span>
      </div>
      <ol className="ai-summary">
        <li>{sentence(cancelled)}</li>
        <li>
          {sentence(selected)} {reasons(selected.reasoning).slice(0, 2).join(" ")}
        </li>
        <li>{sentence(accepted)}</li>
        <li>{sentence(updated)}</li>
      </ol>
    </section>
  );
}
