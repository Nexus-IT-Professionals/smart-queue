import { useLanguage } from "./i18n/LanguageProvider";
import {
  type MouseEvent,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { getHealth, publishLocalDemoEvent } from "./api/client";
import { Icon, type IconName } from "./components/ui";
import {
  OFFICE,
  demoAssistant,
  demoAppointments,
  selectedPatient,
  demoIdentities,
  demoReducer,
  demoWaitlist,
  demoWorkspaceFromHash,
  initialDemoState,
  workspaceHash,
  type DemoWorkspace,
} from "./demo/data";
import DemoAccess from "./pages/DemoAccess";
import StaffWorkspace from "./pages/staff/StaffWorkspace";
import PatientWorkspace from "./pages/patient/PatientWorkspace";
import CancellingPatientWorkspace from "./pages/patient/CancellingPatientWorkspace";

export type StaffView =
  | "overview"
  | "schedule"
  | "waitlist"
  | "activity"
  | "capacity";
const navigation: { id: StaffView; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "schedule", label: "Schedule", icon: "calendar" },
  { id: "waitlist", label: "Waitlist", icon: "users" },
  { id: "activity", label: "Activity log", icon: "activity" },
  { id: "capacity", label: "Capacity", icon: "chart" },
];
// Relative to the app's path (the #/ route is not part of it), so it resolves
// to <site>/presentation/index.html wherever the build is hosted.
const PRESENTATION_URL = "presentation/index.html";
const PRESENTATION_PDF_URL = "presentation/video/smart-queue-demo-2min.pdf";
// Desktop: a named, centered popup on the screen showing the demo, reused on
// repeat clicks. Touch or narrow screens keep the anchor's plain new tab, as
// does a blocked popup. The demo tab itself never navigates.
function openPresentation(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    window.matchMedia("(pointer: coarse), (max-width: 768px)").matches
  )
    return;
  const { availWidth, availHeight } = window.screen;
  const width = Math.round(Math.min(1280, availWidth * 0.9));
  const height = Math.round(Math.min(800, availHeight * 0.9));
  // Centered on the demo window (screenX/Y are multi-monitor desktop
  // coordinates), so it opens on the monitor the demo is on.
  const left = Math.round(
    window.screenX + (window.outerWidth - width) / 2,
  );
  const top = Math.round(
    window.screenY + (window.outerHeight - height) / 2,
  );
  const popup = window.open(
    event.currentTarget.href,
    "smart-queue-presentation",
    `popup,width=${width},height=${height},left=${left},top=${top}`,
  );
  if (!popup) return; // Blocked: the default new-tab navigation still runs.
  event.preventDefault();
  popup.focus();
}
// The header role switch: the three people in the story.
const roles: [DemoWorkspace, string, string][] = [
  ["maria", "María", "(patient)"],
  ["jose", "José", "(patient)"],
  ["staff", "Ana", "(office)"],
];
export default function App() {
  const { t, dateText, language, setLanguage } = useLanguage();
  // A public role selector, not a login/session or a backend permission.
  const [workspace, setWorkspace] = useState<DemoWorkspace>(() =>
    demoWorkspaceFromHash(window.location.hash),
  );
  const [demo, dispatch] = useReducer(demoReducer, undefined, initialDemoState);
  const waitlist = demoWaitlist(demo);
  function navigate(next: DemoWorkspace) {
    window.location.hash = workspaceHash[next];
    setWorkspace(next);
  }
  useEffect(() => {
    const onHashChange = () =>
      setWorkspace(demoWorkspaceFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const [view, setView] = useState<StaffView>("overview");
  // Entering the Provider workspace by any route (entry card, header switch,
  // #/provider link or back/forward, patient "Open Demo Provider") always
  // starts on Overview; switching sections inside it is unaffected.
  const [enteredWorkspace, setEnteredWorkspace] = useState(workspace);
  if (enteredWorkspace !== workspace) {
    setEnteredWorkspace(workspace);
    if (workspace === "staff") setView("overview");
  }
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "offline">(
    "checking",
  );
  const [healthAttempt, setHealthAttempt] = useState(0);
  const main = useRef<HTMLElement>(null);
  const publishedStoryEvents = useRef(new WeakSet<object>());
  const storyCorrelationId = useRef(crypto.randomUUID());
  const previousPage = useRef({ workspace, view });
  useEffect(() => {
    if (
      previousPage.current.workspace !== workspace ||
      previousPage.current.view !== view
    ) {
      // Return to the page top so the top bar stays visible; scrolling <main>
      // into view would push the header off-screen.
      main.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    previousPage.current = { workspace, view };
  }, [workspace, view]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: healthAttempt intentionally triggers a user-requested retry.
  useEffect(() => {
    if (import.meta.env.MODE === "public-demo") return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    let active = true;
    getHealth(controller.signal)
      .then((h) => {
        if (active) setApiStatus(h.status === "ok" ? "ok" : "offline");
      })
      .catch(() => {
        if (active) setApiStatus("offline");
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [healthAttempt]);
  useEffect(() => {
    if (import.meta.env.MODE === "public-demo") return;
    const milestone = [...demo.events].reverse().find(
      (event) => typeof event !== "string" && (event.kind === "cancelled" || event.kind === "updated"),
    );
    if (!milestone || typeof milestone === "string" || publishedStoryEvents.current.has(milestone)) return;
    publishedStoryEvents.current.add(milestone);
    const appointment = demoAppointments(demo).find((slot) => slot.id === "SQ-006");
    if (!appointment) return;
    const eventId = crypto.randomUUID();
    void publishLocalDemoEvent({
      kind: milestone.kind,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      eventId,
      correlationId: storyCorrelationId.current,
    }).catch(() => {
      // Notification delivery is best effort and never interrupts the POC flow.
    });
  }, [demo]);
  return (
    <div className="app-shell">
      {/* biome-ignore lint/a11y/useValidAnchor: Focus-only skip navigation preserves the hash router. */}
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        {" "}
        {t("Skip to main content")}{" "}
      </a>
      <header className="topbar">
        {/* biome-ignore lint/a11y/useValidAnchor: This link navigates to a public hash route and resets the selected view. */}
        <a
          href="#/demo"
          className="brand"
          aria-label={t("Smart Queue home")}
          onClick={() => {
            navigate("demo");
            setView("overview");
          }}
        >
          <span className="brand-mark">+</span>
          <span>
            smart<span className="brand-light">queue</span>
            <small>{t("MORE ACCESS. LESS WAITING.")}</small>
          </span>
        </a>
        <div className="office-label">
          <span className="office-icon">
            <Icon name="heart" />
          </span>
          <span className="office-text">
            <strong>{OFFICE}</strong>
            <small>{t("Fictional medical office")}</small>
          </span>
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: Role selector is a navigation group, not a group of form fields. */}
        <div
          className="workspace-switch"
          role="group"
          aria-label={t("Demo workspace")}
        >
          <button
            type="button"
            aria-pressed={workspace === "demo"}
            onClick={() => navigate("demo")}
          >
            {" "}
            {t("Demo access")}{" "}
          </button>
          {roles.map(([role, name, detail]) => (
            <button
              type="button"
              key={role}
              aria-pressed={workspace === role}
              onClick={() => navigate(role)}
            >
              {name} <span className="role-detail">{t(detail)}</span>
            </button>
          ))}
        </div>
        <fieldset className="language-switch" aria-label="Language / Idioma">
          <button
            type="button"
            lang="en"
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            English
          </button>
          <button
            type="button"
            lang="es"
            aria-pressed={language === "es"}
            onClick={() => setLanguage("es")}
          >
            Español
          </button>
        </fieldset>
        <span className="header-avatar" aria-hidden="true">
          SQ
        </span>
      </header>
      <aside className="sidebar" aria-label={t("Workspace sidebar")}>
        <div>
          <p className="nav-label">{t("WORKSPACE")}</p>
          <nav aria-label={t("Main navigation")}>
            {workspace === "staff" ? (
              navigation.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="nav-item"
                  aria-current={view === item.id ? "page" : undefined}
                  onClick={() => setView(item.id)}
                >
                  <Icon name={item.icon} />
                  {t(item.label)}
                  {item.id === "waitlist" && (
                    <span className="nav-count">{waitlist.length}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="nav-item patient-nav">
                <Icon name="heart" />
                {workspace === "maria" || workspace === "jose"
                  ? t("My care")
                  : t("Welcome to the demo")}
              </div>
            )}
          </nav>
          <a
            className="nav-item presentation-link"
            href={PRESENTATION_URL}
            target="_blank"
            rel="noopener"
            aria-description={t("Opens in a new window")}
            onClick={openPresentation}
          >
            <Icon name="presentation" />
            {t("Press for presentation")}
          </a>
          <a
            className="nav-item presentation-link"
            href={PRESENTATION_PDF_URL}
            target="_blank"
            rel="noopener"
            aria-description={t("Opens in a new window")}
          >
            <Icon name="document" />
            {t("Open demo PDF")}
          </a>
        </div>
        <div className="sidebar-bottom">
          <div className="connection" role="status">
            <span
              className={`status-dot ${import.meta.env.MODE === "public-demo" ? "ok" : apiStatus}`}
            />
            {import.meta.env.MODE === "public-demo"
              ? t("Standalone demo · No API connection")
              : apiStatus === "ok"
                ? t("Health API connected")
                : apiStatus === "checking"
                  ? t("Checking health API…")
                  : t("Health API unavailable")}
          </div>
          {import.meta.env.MODE !== "public-demo" &&
            apiStatus === "offline" && (
              <button
                type="button"
                className="text-button retry"
                onClick={() => {
                  setApiStatus("checking");
                  setHealthAttempt((n) => n + 1);
                }}
              >
                {" "}
                {t("Retry connection")}{" "}
              </button>
            )}
          <p className="sidebar-foot">
            {" "}
            {t("Made in and for Puerto Rico with love!")}{" "}
            <span aria-hidden="true">↗</span>
          </p>
        </div>
      </aside>
      <main id="main-content" ref={main} tabIndex={-1}>
        <div className="preview-banner">
          <span>
            <span className="preview-dot" />{" "}
            {t("Demo / POC Mode · Synthetic data")}{" "}
          </span>
          <span>
            {" "}
            {t(
              "No credentials required. Simulated bookings stay in this browser.",
            )}{" "}
          </span>
        </div>
        {workspace !== "demo" && (
          <div className="demo-identity">
            <span className="demo-identity-people">
              {workspace === "staff" ? (
                <>
                  <span>
                    <strong>{demoAssistant.name}</strong> ·{" "}
                    {t(demoAssistant.label)}
                  </span>
                  <span className="demo-identity-assistant">
                    {t("Observing the schedule of")}{" "}
                    <strong>{demoIdentities.staff.name}</strong>
                  </span>
                </>
              ) : (
                <span>
                  <strong>
                    {workspace === "jose"
                      ? selectedPatient(demo).name
                      : demoIdentities[workspace].name}
                  </strong>{" "}
                  · {t(demoIdentities[workspace].label)}
                </span>
              )}
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => dispatch({ type: "reset" })}
            >
              <Icon name="reset" /> {t("Reset demo scenario")}{" "}
            </button>
          </div>
        )}
        {workspace === "demo" ? (
          <DemoAccess onNavigate={navigate} />
        ) : workspace === "staff" ? (
          <StaffWorkspace
            view={view}
            onNavigate={setView}
            demo={demo}
            onAction={dispatch}
          />
        ) : workspace === "maria" ? (
          <CancellingPatientWorkspace
            demo={demo}
            onAction={dispatch}
            onNavigate={navigate}
          />
        ) : (
          <PatientWorkspace
            demo={demo}
            onAction={dispatch}
            onNavigate={navigate}
          />
        )}
        <footer className="page-footer">
          <span>Smart Queue · Caribbean AI 2026 Hackathon</span>
          <span>
            {t("Demo date:")}{" "}
            {dateText("2026-10-08", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {t("Atlantic Standard Time")}
          </span>
        </footer>
      </main>
    </div>
  );
}
