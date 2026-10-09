import { useEffect, useState } from "react";
import { getHealth } from "./api/client";
import StaffWorkspace from "./pages/staff/StaffWorkspace";
import PatientWorkspace from "./pages/patient/PatientWorkspace";

type Workspace = "staff" | "patient";

export default function App() {
  // This toggle only switches which UI is shown for the demo. Real
  // authorization is the server-side session checked by the API on every
  // request — never this client-side role value.
  const [workspace, setWorkspace] = useState<Workspace>("staff");
  const [apiStatus, setApiStatus] = useState("checking...");

  useEffect(() => {
    getHealth()
      .then((h) => setApiStatus(h.status))
      .catch(() => setApiStatus("unreachable"));
  }, []);

  return (
    <>
      <header className="app-header">
        <h1>Smart Appointment Queue</h1>
        <span className="demo-label">SYNTHETIC DEMO DATA</span>
        <nav>
          <button
            aria-pressed={workspace === "staff"}
            onClick={() => setWorkspace("staff")}
          >
            Staff
          </button>
          <button
            aria-pressed={workspace === "patient"}
            onClick={() => setWorkspace("patient")}
          >
            Patient
          </button>
        </nav>
        <small>API: {apiStatus}</small>
      </header>
      <main>
        {workspace === "staff" ? <StaffWorkspace /> : <PatientWorkspace />}
      </main>
    </>
  );
}
