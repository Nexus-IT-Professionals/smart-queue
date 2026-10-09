import { defineConfig, devices } from "@playwright/test";

// Judge-device rehearsal (QA-3). Targets REHEARSAL_URL (e.g. the public demo)
// or, when unset, a local `build:demo` preview on its own port.
// REHEARSAL_BROWSERS=chromium,msedge,chrome selects browsers (default chromium).
const remote = process.env.REHEARSAL_URL?.replace(/\/+$/, "");
const local = "http://127.0.0.1:4176";
const browsers = (process.env.REHEARSAL_BROWSERS || "chromium")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

export default defineConfig({
  testDir: "./e2e",
  testMatch: "rehearsal.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // A remote first load on venue/laptop Wi-Fi can take tens of seconds.
  timeout: remote ? 90_000 : 30_000,
  // One tab at a time against a deployment, like the judge device.
  workers: remote ? 1 : process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL: remote || local,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: browsers.map((name) =>
    name === "chromium"
      ? { name, use: { ...devices["Desktop Chrome"] } }
      : {
          name,
          use: {
            ...devices[name === "msedge" ? "Desktop Edge" : "Desktop Chrome"],
            channel: name,
          },
        },
  ),
  webServer: remote
    ? undefined
    : {
        command:
          "npm run build:demo && npm run preview -- --host 127.0.0.1 --port 4176 --strictPort",
        url: local,
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
