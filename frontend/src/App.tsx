import { useLanguage } from "./i18n/LanguageProvider";
import { useEffect, useReducer, useRef, useState } from "react";
import { getHealth } from "./api/client";
import { Icon, type IconName } from "./components/ui";
import {
  OFFICE,
  demoAssistant,
  selectedPatient,
  demoIdentities,
  demoReducer,
  demoWaitlist,
  demoWorkspaceFromHash,
  initialDemoState,
  type DemoWorkspace,
} from "./demo/data";
import DemoAccess from "./pages/DemoAccess";
import StaffWorkspace from "./pages/staff/StaffWorkspace";
import PatientWorkspace from "./pages/patient/PatientWorkspace";

export type StaffView = "overview" | "schedule" | "waitlist" | "activity";
const navigation: { id: StaffView; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "schedule", label: "Schedule", icon: "calendar" },
  { id: "waitlist", label: "Waitlist", icon: "users" },
  { id: "activity", label: "Activity log", icon: "activity" },
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
    window.location.hash = next === "staff" ? "/provider" : `/${next}`;
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
          <Icon name="heart" />
          <span>
            {OFFICE}
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
          <button
            type="button"
            aria-pressed={workspace === "staff"}
            onClick={() => navigate("staff")}
          >
            {" "}
            {t("Provider view")}{" "}
          </button>
          <button
            type="button"
            aria-pressed={workspace === "patient"}
            onClick={() => navigate("patient")}
          >
            {" "}
            {t("Patient view")}{" "}
          </button>
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
                {workspace === "patient"
                  ? t("My care")
                  : t("Welcome to the demo")}
              </div>
            )}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <Icon name="shield" />
            <strong>{t("A safe space to explore")}</strong>
            <p>
              {" "}
              {t(
                "Fictional people. Simulated offers. No real patient information.",
              )}{" "}
            </p>
            <span className="demo-tag">{t("DEMO / POC MODE")}</span>
          </div>
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
              <span>
                <strong>
                  {workspace === "patient"
                    ? selectedPatient(demo).name
                    : demoIdentities[workspace].name}
                </strong>{" "}
                · {t(demoIdentities[workspace].label)}
              </span>
              {workspace === "staff" && (
                <span className="demo-identity-assistant">
                  <strong>{demoAssistant.name}</strong> ·{" "}
                  {t(demoAssistant.label)}
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
            onPatient={() => navigate("patient")}
          />
        ) : (
          <PatientWorkspace
            demo={demo}
            onAction={dispatch}
            onProvider={() => navigate("staff")}
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
