import { useEffect, useReducer, useRef, useState } from "react";
import { getHealth } from "./api/client";
import { Icon, type IconName } from "./components/ui";
import {
  OFFICE,
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
      main.current?.focus();
      main.current?.scrollIntoView({ block: "start" });
    }
    previousPage.current = { workspace, view };
  }, [workspace, view]);
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
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to main content
      </a>
      <header className="topbar">
        <a
          href="#/demo"
          className="brand"
          aria-label="Smart Queue home"
          onClick={() => {
            navigate("demo");
            setView("overview");
          }}
        >
          <span className="brand-mark">+</span>
          <span>
            smart<span className="brand-light">queue</span>
            <small>MORE ACCESS. LESS WAITING.</small>
          </span>
        </a>
        <div className="office-label">
          <Icon name="heart" />
          <span>
            {OFFICE}
            <small>Fictional medical office</small>
          </span>
        </div>
        <div
          className="workspace-switch"
          role="group"
          aria-label="Demo workspace"
        >
          <button
            aria-pressed={workspace === "demo"}
            onClick={() => navigate("demo")}
          >
            Demo access
          </button>
          <button
            aria-pressed={workspace === "staff"}
            onClick={() => navigate("staff")}
          >
            Provider view
          </button>
          <button
            aria-pressed={workspace === "patient"}
            onClick={() => navigate("patient")}
          >
            Patient view
          </button>
        </div>
        <span className="header-avatar" aria-hidden="true">
          SQ
        </span>
      </header>
      <aside className="sidebar" aria-label="Workspace sidebar">
        <div>
          <p className="nav-label">WORKSPACE</p>
          <nav aria-label="Main navigation">
            {workspace === "staff" ? (
              navigation.map((item) => (
                <button
                  key={item.id}
                  className="nav-item"
                  aria-current={view === item.id ? "page" : undefined}
                  onClick={() => setView(item.id)}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  {item.id === "waitlist" && (
                    <span className="nav-count">{waitlist.length}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="nav-item patient-nav">
                <Icon name="heart" />
                {workspace === "patient" ? "My care" : "Welcome to the demo"}
              </div>
            )}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <Icon name="shield" />
            <strong>A safe space to explore</strong>
            <p>
              Fictional people. Simulated offers. No real patient information.
            </p>
            <span className="demo-tag">DEMO / POC MODE</span>
          </div>
          <div className="connection" role="status">
            <span
              className={`status-dot ${import.meta.env.MODE === "public-demo" ? "ok" : apiStatus}`}
            />
            {import.meta.env.MODE === "public-demo"
              ? "Standalone demo · No API connection"
              : apiStatus === "ok"
                ? "Health API connected"
                : apiStatus === "checking"
                  ? "Checking health API…"
                  : "Health API unavailable"}
          </div>
          {import.meta.env.MODE !== "public-demo" &&
            apiStatus === "offline" && (
              <button
                className="text-button retry"
                onClick={() => {
                  setApiStatus("checking");
                  setHealthAttempt((n) => n + 1);
                }}
              >
                Retry connection
              </button>
            )}
          <p className="sidebar-foot">
            Made for Puerto Rico <span aria-hidden="true">↗</span>
          </p>
        </div>
      </aside>
      <main id="main-content" ref={main} tabIndex={-1}>
        <div className="preview-banner">
          <span>
            <span className="preview-dot" />
            Demo / POC Mode · Synthetic data
          </span>
          <span>
            No credentials required. Simulated bookings stay in this browser.
          </span>
        </div>
        {workspace !== "demo" && (
          <div className="demo-identity">
            <span>
              <strong>{demoIdentities[workspace].name}</strong> ·{" "}
              {demoIdentities[workspace].label}
            </span>
            <button
              className="text-button"
              onClick={() => dispatch({ type: "reset" })}
            >
              <Icon name="reset" />
              Reset demo scenario
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
          <span>Demo date: Oct 8, 2026 · Atlantic Standard Time</span>
        </footer>
      </main>
    </div>
  );
}
