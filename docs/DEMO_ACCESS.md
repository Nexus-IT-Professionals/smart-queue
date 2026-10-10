# Public POC access

This document supersedes the account/session requirements in the original technical proposal for the hackathon POC. Production authentication is deferred, not disabled in a live system.

## Entry points and identities

| URL fragment | Experience | Fictional identity |
|---|---|---|
| `#/demo` or `#/login` | Always-accessible demo entry; no form or verification | None required |
| `#/patient/maria` | María's sample appointment and the cancel action | María Rodríguez, the patient who cancels |
| `#/patient/jose` (`#/patient` alias) | Waiting patient's appointment and simulated offer inbox | José Pérez; shows whichever waiting patient the AI assistant offered the slot to |
| `#/provider` (`#/staff` alias) | Office view: schedule, waitlist, capacity, AI activity feed, notification and activity log | Ana Martínez, Medical Office Assistant, observing Dr. Carlos Rivera's schedule |

Root and unknown fragments display the entry page. The header role switch exposes Demo access, María (patient), José (patient) and Ana (office) at all times. Browser back/forward switches roles. No separate Admin page exists; staff scheduling tools are in Ana's office view. There is no authenticated state, role token, login cookie, registration, or password field. Selecting a role is navigation only.

## Judge walkthrough

1. Choose **Start the guided demo** (or **Continue as María**). Choose **Cancel my appointment**, then **Yes, cancel my appointment** for October 8, 2:00 PM (SQ-006). **Keep my appointment** backs out without changes.
2. The **AI assistant (simulated)** detects the cancellation, scans the four-patient waitlist and selects José Pérez with the deterministic ranking: afternoon availability covers 2:00 PM, and his October 4 request is the oldest among the P3 patients (Elena Morales, October 5, is next; Nicolás Díaz, mornings only, is excluded). It sends José a simulated in-app offer.
3. Switch to **José** in the header. Choose **Accept earlier visit**, then **Yes, move my appointment** (**Go back** leaves it unchanged). His fictional appointment moves from October 22 to October 8.
4. The AI updates the schedule: the 2:00 PM slot shows José, his October 22 booking is released, and the waitlist drops from four entries to three. Switch to **Ana (office)**: the **Notification for Ana Martínez** summarises the cancellation, why José was selected, his acceptance and the update. The **AI activity** feed and the Activity log list all seven steps. Ana is notified only; there is nothing to approve.
5. **Reset demo scenario** to replay.

All steps operate in **one browser tab**. Entry-page visits and role switches retain the scenario. Reload/reset clears it; different tabs and judges have independent state. This is a single-slot offer simulation driven by a rule-based, simulated AI assistant (no AI model, no network) that follows staff-confirmed priorities. It is not automatic waitlist progression, expiry, a persistent audit log, or multi-user scheduling. Patient-facing status messages say "a waiting patient" rather than naming who received the offer; only the demo's role-switch guidance names the roles.

## Data boundary

- Data is bundled synthetic content; no input collects accounts or patient details.
- The shared reducer changes browser memory only. No booking, message, database mutation, or real account is created.
- The standard development/build mode requests only `GET /api/health`, without cookies. The public-demo build removes that request and uses a Content Security Policy with `connect-src 'none'` to block API connections. Static asset requests still load normally.
- Backend auth/business routers remain stubs. No permission checks were removed and no universal-login or impersonation endpoint was added.
- Backend user/session tables remain reserved for future work; the POC does not read them.
- Do not connect the public role selector to real resources. Production access must be enforced by the server, never by this selector.

## Hosting

Credential-free application access is implemented; a public deployment URL is not yet configured/verified. The repository's GitHub Pages lookup returned HTTP 404 (no accessible site found). A hosting destination is still needed.

For static hosting, build `frontend/` with `npm ci && npm run build:demo` and publish **only `frontend/dist/`** at the site root. Hash links work without server rewrite rules. No backend, model, credentials, or environment secrets are needed for the simulated workflow. The indicator reads “Standalone demo · No API connection.” The verifier currently requires hosting at the site root; subdirectory hosting requires updating and testing its asset-path checks.

Do not publish the project directory, `.env`, `.venv`, databases, model endpoint, or a tunnel to local backend resources. Existing Docker ports remain loopback-only. Production deployment is a separate scope.

## Validation commands

From `frontend/`: `npm run build:demo`, `npm run verify:demo`, and `npm test` (Node 22.6+ supports the test runner's type-stripping flag; tested on Node 25).

From `backend/`: `../.venv/bin/python -m pytest -q`.

Automated tests cover public entry/role resolution, every AI assistant phase, the reasoning's source, invalid/repeated actions (accept before the offer, double cancel, double accept), backing out, reset, and independent state. Browser checks should also cover all role links, entry after acceptance, direct `#/login`, keyboard confirmation, and health-API failure. QA-2 adds `npm run lint` and `npm run test:e2e`; the latter builds and verifies the static public demo before testing in Chromium.

## Public artifact guard and manual acceptance (SEC-POC-1)

`build:demo` type-checks, builds the public-demo mode, and verifies `dist/`. The verifier accepts only index HTML and fingerprinted JS/CSS, requires the restrictive CSP and local asset links, and rejects symlinks, unexpected files (including environment files/databases/maps), API paths, and selected secret signatures. It is a packaging safeguard, not proof that arbitrary data or secrets are absent. Review fixture changes before publishing. A normal `npm run build` overwrites `dist/`; always rebuild with `build:demo` before publication.

All 26 unit/artifact tests pass (6 workflow/API tests, 13 release guard cases, 7 deployment packaging cases), plus 9 Chromium browser tests. Lint passes with zero warnings. Both standard and public builds pass. Firefox entry smoke check passed; complete the following manual acceptance before marking the task accepted:

1. Open http://127.0.0.1:8001/#/demo while the local static server is running. Confirm “Standalone demo · No API connection,” working styles, and no login requirement.
2. In browser developer tools, open Network, clear requests, and reload. Only local static resources should load; no `/api/health`, external API, booking, or account requests.
3. Continue as María → cancel and confirm → switch to José → accept and confirm → switch to Ana. José occupies 2:00 PM, waitlist count is 3, Ana's notification is shown, and activity records all steps. Check Network again for no API mutations.
4. Reset; as María, start a cancellation and choose **Keep my appointment**. Open `#/login` directly and verify the entry page remains available. Reload to restore initial sample data.
5. Run `cd frontend && npm test && npm run verify:demo` to reproduce automated checks.

To restart the local preview from the project root after building: `python3 -m http.server 8001 --bind 127.0.0.1 --directory frontend/dist`. This is a local review server, not public deployment.


## QA-2 browser regression suite

> Historical sections below record test counts and coverage at the time. Since 2026-10-09 the demo is the AI-assisted María → José → Ana story; the decline/help path and the staff cancellation/offer buttons were removed.

After `npm ci`, install the test browser once with `npx playwright install chromium` (Linux CI uses `--with-deps`). Run `npm run lint`, `npm test`, and `npm run test:e2e` from `frontend/`. The browser command rebuilds the public demo, verifies the artifact, and starts its own server on port 4175; it refuses to reuse an existing server. No backend or account setup is needed.

The nine Chromium tests cover anonymous root/login/role links, entry from both roles, back/forward, all provider sections, search/filter/empty states, confirmation focus and cancellation, accepted booking/waitlist/activity updates, help/decline, reset, and reload. Each test fails on API/external/non-GET traffic or uncaught browser exceptions. Failure screenshots/traces stay in ignored test output directories. Coverage is desktop Chromium only; responsive, screen-reader, and additional browser review remain pending. CI runs these checks before packaging; deployment remains disabled until explicitly enabled.


## Responsive review (UX-1)

`npm run test:e2e` now runs 14 Chromium cases, including five responsive workflows at 320/375/768/1024/1440px. At ≤375px Provider navigation uses two columns. The page must fit horizontally while the schedule table remains independently keyboard-scrollable. Native Firefox 200% zoom was manually checked through acceptance and reset; this is separate from viewport automation. Repeat these checks on your presentation device before final acceptance.


## Language selection (UX-2)

English/Español controls are available on entry, Patient, and Provider pages. Changing language updates instructions, labels, response/activity copy, and displayed dates/times without clearing the current scenario, filter, or confirmation. The document language/title also update. Native date-picker controls use the browser/OS locale.

Only the `smart-queue-language` preference (`en` or `es`) is saved in localStorage. Blocked storage does not prevent access or language switching. Reset retains the language; refreshing clears the demo scenario but restores the saved language. This does not persist bookings or patient information.

Latest checks: 29 unit/artifact tests and 19 Chromium browser tests pass, along with lint and both builds. Rehearse the full scenario in Spanish, switch languages during confirmation, check María backing out and an empty schedule, then reload. Human Spanish copy review and full assistive-technology testing remain pending.


## Accessibility review (UX-3)

The full suite now passes 25 Chromium tests and 29 unit/artifact tests. Six browser tests cover bilingual keyboard navigation/focus, live-region semantics, focus contrast, and axe scans. Role/language buttons no longer fade through low-contrast intermediate colors.

For manual acceptance, use keyboard-only navigation and VoiceOver/NVDA in both languages. Verify the skip link, headings/landmarks, button states and field labels; listen to cancellation/acceptance/reset announcements; check that confirmation instructions are read and focus remains reachable after back/forward or reset. Automated tests do not verify actual speech or establish complete accessibility compliance. See the detailed UX-3 checklist in `PENDING_TASKS.md`.

Step-by-step Windows Narrator/NVDA script (pending human acceptance): [SCREEN_READER_CHECK.md](SCREEN_READER_CHECK.md).

## Calendar and priorities

Day/Week/Month views and staff-confirmed configurable priorities now share the existing in-memory session. The AI assistant may offer the slot to José, Elena or Camila depending on staff-confirmed priorities; José's role view shows whichever waiting patient was offered the slot. See [PRIORITY_CALENDAR.md](PRIORITY_CALENDAR.md) for eligibility rules, non-triage boundaries, disabled-level migration and manual scenarios. Reload/reset clears these settings alongside the scenario.
