# Smart Queue — POC completion roadmap

Updated October 9, 2026. The current decision is a **public, credential-free hackathon POC**, using synthetic data only. Production accounts are not a prerequisite. [Demo access](docs/DEMO_ACCESS.md) supersedes earlier account/session requirements in the technical proposal.

## Verified implementation and access review

- No login page, auth library, redirect, middleware guard, or implemented authentication endpoint existed. The auth router was a stub; database user/session tables are unused by this POC.
- Patient and Staff were the existing interfaces. Staff is now labeled **Provider** and retains schedule, waitlist, and activity navigation. There is no separate Admin interface.
- `#/demo` and `#/login` always show the public entry page. `#/provider` (`#/staff` alias) and `#/patient` are directly accessible. Root/unknown fragments show the entry page; no credentials or personal input are requested.
- Fixed fictional identities are Dr. Alex Rivera and Elena Morales. Role selection is navigation, not a token or backend permission.
- The complete **synthetic single-offer scenario** runs in browser memory: provider cancellation → offer → explicit patient acceptance → changed appointment, waitlist, schedule, and activity. Decline/help/reset are supported. Invalid/repeated actions are ignored.
- Role changes and entry-page visits preserve state; reload/reset clears it. Separate judges/tabs do not share state. No live booking, message, real patient data, or database mutation is involved.
- `/api/health` remains the only implemented API. The standard build queries it without cookies; the public-demo build makes no API request. Neither gates navigation. No production security check was disabled or universal-login endpoint added.
- Public hosting is **not yet configured/verified**. Vercel with GitHub Actions is the selected deployment approach; project setup, CI secrets, and a verified judge URL remain pending.

## Completed improvements

| Status | Files / components | Result |
|---|---|---|
| Done | `App.tsx`, `pages/DemoAccess.tsx` | Always-accessible entry, Patient/Provider choices, direct hash links, back/forward handling, fictional identity, reset, Demo/POC banner. |
| Done | `demo/data.ts` | Shared guarded simulation reducer and derived appointment/waitlist data; no account store or backend writes. |
| Done | `pages/staff/StaffWorkspace.tsx` | Existing filters/dashboard preserved; provider cancellation/offer controls and actual local event history added. |
| Done | `pages/patient/PatientWorkspace.tsx` | No-offer state, confirmation, decline/help, reset, and appointment update tied to the same demo scenario. |
| Done | `components/ui.tsx`, `styles.css` | Previous navy/card design, shared icons, responsive rules, accessible labels and focus indicators retained; public entry/scenario styles added. |
| Done | `api/client.ts` | Public health check explicitly omits credentials; no mutation APIs called. |
| Done | `tests/demo.test.mjs`, `package.json` | Six dependency-free tests through Node's built-in runner/type stripping; no packages added. |
| Done | README, `docs/DEMO_ACCESS.md`, proposal, auth-router comments | POC policy, walkthrough, hosting boundary, and production deferrals documented. |

Original UI inspiration: the [Pinterest dashboard](https://ru.pinterest.com/pin/1100285752847570247/), visually inspected in Firefox during the prior UI work. No artwork/template code copied. Astra was not available as an exposed tool or local executable.

## Validation

| Check | Result / limit |
|---|---|
| `cd frontend && npm run build` | Passed: strict TypeScript and Vite production build. |
| `cd frontend && npm test` | **19 passed** (6 workflow/API tests and 13 release guard tests): public route resolution; cancellation/offer/acceptance; invalid/duplicate actions; decline/help; reset and independent judge state; health request omits credentials and propagates cancellation. Uses Node's built-in runner/type stripping, tested on Node 25. |
| `cd backend && ../.venv/bin/python -m pytest -q` | **1 passed** on Python 3.12; existing Starlette/HTTPX deprecation warning remains. |
| Firefox, no credentials | Entry → Provider cancellation → offer → Patient confirmation → October 8 appointment → Provider schedule with Elena, two waitlist entries, and three activity events. Entry remains accessible after completion; direct `#/login` works. Confirmation/result focus verified. |
| Existing UI regression checks | Prior pass covered record-ID search, status filter, empty state, and reset. This pass retains those components; broader automated browser regression coverage is still pending. |
| Lint/formatting | No lint script/configuration exists; do not count `--if-present` as linting. Changed UI/test files formatted with one-off Prettier. |
| Boundaries | No backend permission/mutation endpoint added; database, dependencies, container exposure, and lockfile unchanged. Auth-router edit is explanatory comments only. |
| Anonymous serving | FastAPI TestClient served HTML/assets/health without login, redirects, or a session cookie; no universal login endpoint exists. |
| Static-only browser | Direct `#/patient` rendered without a backend, with Health API unavailable and the correct no-offer state. Full static-host rehearsal remains recommended. |
| Outstanding validation | Mobile/tablet, full screen-reader/contrast audit, automated browser coverage, Docker, and public signed-out access. |

## Remaining POC tasks

**P0:** blocks public judge delivery. **P1:** improves demo reliability/readiness. **P2:** optional follow-up. **Verified** means source/runtime evidence; **Recommendation** means proposed work. Production priorities below apply only when pursuing a real deployment.

### UI/UX

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| UX-1 | P1 | Open · Verified validation gap | Check 320/375/768/1024/1440px and 200% zoom. Roles, scenario actions, and reset remain reachable; only the table may scroll horizontally. |
| UX-2 | P1 | Open · Verified gap | Add Spanish/English UI copy and date formatting. Patient/provider instructions and error/confirmation states are understandable in either language. |
| UX-3 | P1 | Open · Recommendation | Complete keyboard/screen-reader/contrast review. Verify focus after reset, cancellation, offer, role changes, and back/forward; no lost focus or ambiguous state announcements. |

### Frontend

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| FE-POC-1 | P2 | Open · Verified limitation | If needed for judging, extend the fixed scenario with simulated expiry/next-candidate offers. Expired/declined offers never change the old appointment; labels remain explicitly simulated; reset restores all fixtures. |
| FE-POC-2 | P2 | Open · Recommendation | Preserve selected schedule view/filter in navigation URLs. Back/forward restores view/date without putting patient details in URLs. Current role navigation is already done. |

### Backend

No new backend or authentication service is required for the current browser-only judge workflow. Backend stubs remain intentionally unconnected. Persistent/live workflows are listed under Post-POC; do not add an anonymous bypass to them.

### Integrations

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| IN-1 | P2 | Optional · Verified stub | Add bounded EN/ES Ollama assistance only if AI is part of the final demo. Schema/timeout/input limits and manual fallback work; AI never books or ranks. Current explicit buttons complete the scenario without a model. |

### Testing

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| QA-2 | P1 | Open · Verified gap | Add lint and automated browser tests. Cover entry/login alias from either role, direct links, all staff sections, back/forward, reset, and confirmation with the API offline. Existing reducer tests remain green. |
| QA-3 | P1 | Open · Recommendation | Rehearse the complete one-tab scenario, decline/help, reset, and reload on the demo device. Confirm no credential prompt and no real network mutation. |
| QA-4 | P2 | Open · Verified warning | Resolve the upstream Starlette/HTTPX test-client deprecation using a tested compatible dependency set. Do not merely suppress the warning. |

### Demo security

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| SEC-POC-1 | P0 | Implemented · Awaiting manual acceptance | `npm run build:demo` emits only checked HTML/JS/CSS, removes the health request, and adds CSP blocking API connections. Guard rejects unexpected files, symlinks, maps, API paths, and selected secret signatures. 13 guard tests pass; Firefox entry smoke check passes. Complete the manual checklist in `docs/DEMO_ACCESS.md`; publication remains DEP-POC-1. |

### Deployment and submission

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| DEP-POC-1 | P0 | Open · Vercel selected; configuration pending | Configure GitHub Actions deployment to Vercel using the task below. Tests and artifact verification gate deployment; credentials remain in GitHub environment secrets. Judges can open root, `#/login`, Patient, and Provider over HTTPS without access gates and complete the synthetic workflow. |
| DEP-1 | P2 | Optional · Unverified | If using Docker for the local presentation, smoke-test the existing Compose setup. UI/API load; backend/model stay within their intended network boundary. Static demo needs neither Docker nor Ollama. |
| DEP-2 | P1 | Open · Verified gap | Record the tested Node/runtime versions and a repeatable build. Existing frontend lockfile stays authoritative. Pin backend/container versions if that optional path is used. |
| DEP-3 | P1 | Open · Verified submission gap | Complete team attribution, public demo/repository links, feature-status list, and ≤2-minute video. Recheck event requirements; distinguish local simulation from persistent backend capability. |

## Post-POC / Production Enhancements

**Deferred; not hackathon access blockers.** Implement these before introducing real accounts, real patient data, or protected backend resources. The demo selector must never become a server authorization mechanism.

| ID | Priority at production | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| SEC-1 | P0 | Deferred · Verified auth stub | Real login/logout/me, hashed passwords, expiring opaque sessions, appropriate cookie protection, CSRF, and login rate limits. Verify patient ownership/staff office for every read and write. No anonymous bypass on real endpoints. |
| ACCOUNT-1 | P0 | Deferred · Recommendation | Registration, verification, account recovery, onboarding, and role administration. Define authorized role assignment and recovery; patient/provider/admin permissions are explicit and tested. Do not invent an Admin UI until its responsibilities are agreed. |
| SEC-2 | P0 | Deferred · Verified demo boundary | Separate public demo assets from real application resources and secrets. Production responses never fall back to fictional data; client-selected roles grant no authority. |
| SEC-3 | P1 | Deferred · Recommendation | Define consent, retention, data access, audit, backup/restore, and deletion procedures before a real-data pilot. Local execution and activity logs do not establish healthcare compliance. |
| BE-1 | P0 | Deferred · Verified startup/seed stubs | Version/init SQLite and add explicit, repeatable synthetic seeding/reset for backend development. Preserve data on restart; keep account setup outside public demo navigation. |
| BE-2 / FE-1 | P0 | Deferred · Verified route stubs | Implement validated APIs and connect live-mode UI for profile, schedule, waitlist, cancellation, offers, and metrics. Enforce server permissions; render loading/empty/error/retry states without silent mock fallback. |
| BE-3 / FE-3 | P0 | Deferred · Verified service stub | Atomic/idempotent real acceptance, one active offer per slot, expiry on actions/restart, and rollback of failed reschedules. Concurrent/repeated requests produce one booking; original appointment survives failure. |
| BE-4 | P0 | Deferred · Verified unresolved policies | Agree offer order, availability/travel constraints, timeout, provider cancellation, and exact-24h boundary. Never release for early non-arrival or rank/filter access by insurer. Test agreed rules. |
| BE-5 / IN-2 | P1 | Deferred · Verified service gaps | Persist authorized inbox, actor/time/action/entity events, and metrics with clear denominators. Distinguish acceptance from completed visits; no raw contact/reply text in logs. |
| FE-2 / FE-4 | P1 | Deferred · Verified gaps | Live profile/preference editing, cancellation review, candidate selection, and bounded polling. Validate changes and prevent duplicate submissions; recover stale/outage states and stop polling on logout. |
| QA-1 | P0 | Deferred · Verified backend test gap | Add booking concurrency, expiry, rollback, restart, and cross-user/office isolation tests alongside real APIs. Current demo reducer tests do not prove production transaction safety. |
| IN-3 | P2 | Deferred · Recommendation | Real messaging, voice, EHR/insurance connections, and multi-office routing require separate scope, consent/data agreements, sandbox tests, and honest delivery status. |
| DEP-4 | P0 | Deferred · Recommendation | Before production exposure, verify HTTPS, sessions, monitoring, backups, restore, and rollback. Pass SEC-1/2 and backend isolation tests. This is separate from hosting the synthetic static POC. |

## Next actions

1. Implement DEP-POC-1: configure GitHub Actions and Vercel, securely provision CI secrets, then verify signed-out access.
2. Complete responsive/accessibility and API-offline checks; rehearse the judge workflow.
3. Finalize submission materials. Revisit production accounts only after the POC scope changes.

### SEC-POC-1 validation update

- Modified `frontend/src/App.tsx`, `frontend/vite.config.ts`, and package scripts; added `frontend/scripts/verify-demo.mjs` and `frontend/tests/release.test.mjs`. No dependencies or backend permissions changed.
- Standard build and public-demo build passed; release verification accepted exactly three generated files. All 19 frontend tests passed. No lint command is configured.
- Firefox loaded the static release at port 8001 and displayed the standalone connection status. Full browser workflow and Network-panel inspection are awaiting user manual acceptance.
- The guard is a narrow packaging check, not a comprehensive secret/PHI scanner. Existing demo fixtures are synthetic; review future data changes before publication.

### DEP-POC-1 readiness review — October 9, 2026

- Next POC P0 remains public static deployment. No host configuration exists in this checkout; the owner has now selected Vercel with GitHub Actions.
- Re-ran `npm test`: 19 passed. `npm run build:demo` passed TypeScript, bundling, and verification of three UI assets.
- No deployment or public HTTPS/signed-out check has occurred. The current verifier requires root-relative assets; a subpath host needs a tested asset-path adjustment.
- Prepare deployment configuration and manual testing instructions in the implementation task below. This documentation commit does not implement or publish a deployment.

### DEP-POC-1 — Configure GitHub Actions deployment to Vercel

**Priority:** P0 · **Status:** Open / planned · **Scope:** synthetic static POC only. Host selected October 9, 2026. No workflow, Vercel project, or secrets have been configured by this documentation task.

Implementation checklist:

- Create/select a dedicated Vercel demo project and record its owner and public URL without credentials. Serve at the site root. Disable duplicate Vercel Git auto-deployments if Actions owns deployment; verify the public production URL has no platform login gate.
- Add `.github/workflows/deploy-vercel.yml`: pinned action commit SHAs and tested Node/Vercel CLI versions, `npm ci`, `npm test`, and `npm run build:demo`. Deploy only the verified static assets using Vercel prebuilt output; validate the final upload staging directory as well as `frontend/dist/`. Never upload the checkout, backend, databases, source maps, or environment files.
- Use credential-free PR validation, including fork PRs. Deploy only trusted `main` code through a production GitHub environment, with branch restrictions and a manual `workflow_dispatch` option. Never execute untrusted PR code with deployment secrets or use `pull_request_target` to deploy it. Use minimal workflow permissions (`contents: read` unless a documented step needs more), concurrency protection, and a job timeout. Scope deployment credentials to the deployment step/job, not tests or dependency installation.
- Create GitHub **environment secrets** under repository Settings → Environments → the deployment environment: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. The workflow must reference the same environment and use secret references only. Obtain the identifiers from Vercel project settings or local link metadata; they are identifiers, not authentication tokens, but keep their actual values out of tracked configuration. Create a dedicated token with the narrowest available scope and expiration, document its owner/rotation schedule without its value, and provision through the settings UI or secure secret-input tooling. Never paste secret values into issues, chat, shell history, YAML, or documentation.
- Expand ignore rules for `.vercel/`, `.env*` (allow only deliberately sanitized example files), and local credential/key files. Confirm these paths are not already tracked; ignore rules do not remove historical leaks. Do not put credentials in `VITE_*` variables: frontend build variables are public. The synthetic app needs no runtime secrets or real patient information.
- Do not echo secrets, enable shell tracing around them, cache pulled environment files, or upload credential-bearing logs/artifacts. GitHub masking is an extra safeguard, not the sole control. Use a reviewed secret scanner on tracked files/history and inspect the final bundle and CI artifacts, reporting only redacted findings. If exposure is found, revoke/rotate first and coordinate history cleanup; do not claim deletion alone repairs a compromised credential.
- Document setup using secret **names only**, failed-deployment recovery, rollback to a known-good static release, and token rotation. Keep production account/backend resources outside this demo deployment.

Acceptance criteria:

1. A missing required secret fails clearly without printing values; failed tests, artifact verification, or secret scans prevent deployment. Untrusted PR runs cannot access deployment credentials.
2. A trusted manual/main deployment succeeds through Actions and records the commit and HTTPS URL. No duplicate deployment pipeline runs. Only approved static output reaches Vercel.
3. Signed-out root, `#/login`, `#/provider`, and `#/patient` load without credentials. Cancellation → offer → acceptance updates the appointment and waitlist; reset works. Browser Network shows no API calls or real-data requests.
4. Tracked changes, scan results, logs, and uploaded output contain no detected credentials or sensitive patient data; limitations of scanning are documented. Environment secrets and token rotation are verified without disclosing their values.
5. README and this roadmap record actual workflow results and a manual test checklist. Provide the deployment for user testing before the implementation commit/push; do not mark this task complete based only on configuration files.

Reference: [Vercel’s official GitHub Actions guide](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel) describes the CI identifiers/token and prebuilt deployment mechanism. Validate current CLI behavior during implementation.
