# Public POC access

This document supersedes the account/session requirements in the original technical proposal for the hackathon POC. Production authentication is deferred, not disabled in a live system.

## Entry points and identities

| URL fragment | Experience | Fictional identity |
|---|---|---|
| `#/demo` or `#/login` | Always-accessible demo entry; no form or verification | None required |
| `#/provider` (`#/staff` alias) | Existing staff schedule, waitlist, and activity tools | Dr. Alex Rivera |
| `#/patient` | Sample appointment and simulated offer inbox | Elena Morales |

Root and unknown fragments display the entry page. The header exposes Demo access, Provider view, and Patient view at all times. Browser back/forward switches workspaces. No separate Admin page exists; staff scheduling tools are in Provider view. There is no authenticated state, role token, login cookie, registration, or password field. Selecting a role is navigation only.

## Judge walkthrough

1. Continue as Demo Provider. Confirm the fictional patient's October 8, 2:00 PM cancellation.
2. Send the demo offer to Elena Morales. Open Demo Patient.
3. Preview acceptance and explicitly confirm. Her fictional appointment moves from October 22 to October 8.
4. Return to Provider. The 2:00 PM slot now shows Elena; the waitlist drops from three entries to two; Activity log lists cancellation, offer, and acceptance.
5. Reset demo scenario to replay. Alternatively decline to preserve the October 22 appointment, or request help and then accept/decline.

All steps operate in **one browser tab**. Entry-page visits and role switches retain the scenario. Reload/reset clears it; different tabs and judges have independent state. This is a fixed single-offer simulation, not automatic waitlist progression, expiry, a persistent audit log, or multi-user scheduling.

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

Automated tests cover public entry/role resolution, valid workflow transitions, invalid/repeated actions, decline/help, reset, and independent state. Browser checks should also cover all role links, entry after acceptance, direct `#/login`, keyboard confirmation, and health-API failure. No frontend lint configuration exists yet.

## Public artifact guard and manual acceptance (SEC-POC-1)

`build:demo` type-checks, builds the public-demo mode, and verifies `dist/`. The verifier accepts only index HTML and fingerprinted JS/CSS, requires the restrictive CSP and local asset links, and rejects symlinks, unexpected files (including environment files/databases/maps), API paths, and selected secret signatures. It is a packaging safeguard, not proof that arbitrary data or secrets are absent. Review fixture changes before publishing. A normal `npm run build` overwrites `dist/`; always rebuild with `build:demo` before publication.

All 19 automated tests pass (6 existing workflow/API tests, 13 release guard cases). Both standard and public builds pass. Firefox entry smoke check passed; complete the following manual acceptance before marking the task accepted:

1. Open http://127.0.0.1:8001/#/demo while the local static server is running. Confirm “Standalone demo · No API connection,” working styles, and no login requirement.
2. In browser developer tools, open Network, clear requests, and reload. Only local static resources should load; no `/api/health`, external API, booking, or account requests.
3. Choose Provider → confirm demo cancellation → send offer → switch to Patient → accept and confirm. Return to Provider: Elena occupies 2:00 PM, waitlist count is 2, and activity records the transition. Check Network again for no API mutations.
4. Reset; try decline and help. Open `#/login` directly and verify the entry page remains available. Reload to restore initial sample data.
5. Run `cd frontend && npm test && npm run verify:demo` to reproduce automated checks.

To restart the local preview from the project root after building: `python3 -m http.server 8001 --bind 127.0.0.1 --directory frontend/dist`. This is a local review server, not public deployment.
