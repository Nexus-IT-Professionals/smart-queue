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
| `cd frontend && npm test` | **26 passed** (6 workflow/API, 13 release guard, and 7 deployment packaging tests): public route resolution; cancellation/offer/acceptance; invalid/duplicate actions; decline/help; reset and independent judge state; health request omits credentials and propagates cancellation. Uses Node's built-in runner/type stripping, tested on Node 25. |
| `cd backend && ../.venv/bin/python -m pytest -q` | **1 passed** on Python 3.12; existing Starlette/HTTPX deprecation warning remains. |
| Firefox, no credentials | Entry → Provider cancellation → offer → Patient confirmation → October 8 appointment → Provider schedule with Elena, two waitlist entries, and three activity events. Entry remains accessible after completion; direct `#/login` works. Confirmation/result focus verified. |
| Existing UI regression checks | Prior pass covered record-ID search, status filter, empty state, and reset. This pass retains those components; QA-2 now adds automated Chromium regression coverage; broader device/browser coverage remains pending. |
| Lint/formatting | `npm run lint`: Biome 2.5.15 recommended rules, zero warnings/errors. Narrow documented exceptions retain intentional hash navigation, focus behavior, and existing CSS cascade. |
| Boundaries | No backend permission/mutation endpoint added; database, dependencies, container exposure, and lockfile unchanged. Auth-router edit is explanatory comments only. |
| Anonymous serving | FastAPI TestClient served HTML/assets/health without login, redirects, or a session cookie; no universal login endpoint exists. |
| Static-only browser | Direct `#/patient` rendered without a backend, with Health API unavailable and the correct no-offer state. Full static-host rehearsal remains recommended. |
| Outstanding validation | Mobile/tablet, full screen-reader/contrast audit, cross-browser coverage beyond Chromium, Docker, and public signed-out access. |

## Remaining POC tasks

**P0:** blocks public judge delivery. **P1:** improves demo reliability/readiness. **P2:** optional follow-up. **Verified** means source/runtime evidence; **Recommendation** means proposed work. Production priorities below apply only when pursuing a real deployment.

### UI/UX

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| UX-1 | P1 | Implemented · Locally verified; awaiting manual review | Fixed 320px Provider page overflow with a shrinkable mobile grid and two-column navigation at ≤375px. Workflow and all provider sections pass at 320/375/768/1024/1440px; keyboard table scrolling verified. Native Firefox 200% zoom workflow passed. See validation update below. |
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
| QA-2 | P1 | Implemented · Locally verified; awaiting manual review | Biome lint passes with zero warnings; 26 unit/artifact tests and 9 Chromium browser tests pass. Covers anonymous direct links, role/entry navigation, back/forward, all provider sections, filters, confirmation/focus, decline/help, reset/reload with no backend or API traffic. CI runs lint and browser tests before packaging; hosted Actions execution remains unverified. |
| QA-3 | P1 | Open · Recommendation | Rehearse the complete one-tab scenario, decline/help, reset, and reload on the demo device. Confirm no credential prompt and no real network mutation. |
| QA-4 | P2 | Open · Verified warning | Resolve the upstream Starlette/HTTPX test-client deprecation using a tested compatible dependency set. Do not merely suppress the warning. |

### Demo security

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| SEC-POC-1 | P0 | Implemented · Awaiting manual acceptance | `npm run build:demo` emits only checked HTML/JS/CSS, removes the health request, and adds CSP blocking API connections. Guard rejects unexpected files, symlinks, maps, API paths, and selected secret signatures. 13 guard tests pass; Firefox entry smoke check passes. Complete the manual checklist in `docs/DEMO_ACCESS.md`; publication remains DEP-POC-1. |

### Deployment and submission

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| DEP-POC-1 | P0 | Prepared · Deployment paused | Configure GitHub Actions deployment to Vercel using the task below. Tests and artifact verification gate deployment; credentials remain in GitHub environment secrets. Judges can open root, `#/login`, Patient, and Provider over HTTPS without access gates and complete the synthetic workflow. |
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
- Standard build and public-demo build passed; release verification accepted exactly three generated files. At that stage, 19 frontend tests passed; QA-2 subsequently added lint and browser checks (see latest results below).
- Firefox loaded the static release at port 8001 and displayed the standalone connection status. Full browser workflow and Network-panel inspection are awaiting user manual acceptance.
- The guard is a narrow packaging check, not a comprehensive secret/PHI scanner. Existing demo fixtures are synthetic; review future data changes before publication.

### DEP-POC-1 readiness review — October 9, 2026

- Next POC P0 remains public static deployment. No host configuration exists in this checkout; the owner has now selected Vercel with GitHub Actions.
- Re-ran `npm test`: 19 passed. `npm run build:demo` passed TypeScript, bundling, and verification of three UI assets.
- No deployment or public HTTPS/signed-out check has occurred. The current verifier requires root-relative assets; a subpath host needs a tested asset-path adjustment.
- Prepare deployment configuration and manual testing instructions in the implementation task below. This documentation commit does not implement or publish a deployment.

### DEP-POC-1 — Configure GitHub Actions deployment to Vercel

**Priority:** P0 · **Status:** Configuration prepared / deployment paused · **Scope:** synthetic static POC only. Host selected October 9, 2026. The workflow is prepared; Vercel project setup and secrets remain pending.

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


### DEP-POC-1 implementation update — deployment deferred by owner

- Added pinned `.github/workflows/deploy-vercel.yml`, `vercel.json`, strict static packaging/verification, seven package tests, and ignore rules for local environment/link/key files. No credentials were added. Existing `.env.example` remains the only tracked environment example.
- Deployment requires `VERCEL_DEPLOY_ENABLED=true`, trusted `main`, successful validation, and secrets in `vercel-production`. The gate defaults off so this push validates without publishing. Credentials are scoped to the deployment step; dependency installation and PR validation receive none.
- Local results: 26 frontend tests passed; public build and three-file static package verified; actionlint passed with shellcheck disabled; Gitleaks 8.30.1 found no leaks in 10 existing commits or the generated package. No hosted deployment result is claimed.
- Remaining: configure dedicated project/environment and branch protections, securely provision/rotate secrets, verify pinned CLI against Vercel, activate only when ready, inspect hosted CI artifacts/logs, test public signed-out workflow and rollback. README contains setup and local manual testing instructions. DEP-POC-1 remains incomplete until live acceptance passes.
- Owner requested committing/pushing this prepared work while postponing deployment. Previous pre-commit testing instruction is superseded for this configuration commit; public manual acceptance is still pending.


### QA-2 — lint and automated browser regression tests

**Status:** Implemented; local checks passed; awaiting manual review. Deployment remains deferred. Owner authorized documentation update, commit, and push; manual acceptance and hosted Actions results are not claimed.

- Added `frontend/biome.json`, `playwright.config.ts`, and `e2e/demo.spec.ts`; pinned development-only Biome 2.5.15 and Playwright 1.64.0 in the lockfile. Biome avoids the available typescript-eslint parser’s unsupported TypeScript 7 peer range. No production dependency added.
- Added explicit button types, a checked application root, a semantic scrollable table section, and stable event keys. Preserved existing demo behavior. Inline lint exceptions explain hash-navigation, intentional retry dependencies, action groups, and keyboard scrolling. CSS-only exceptions retain existing descending specificity and reduced-motion `!important` rules; other recommended checks remain enabled.
- Browser tests build the public-demo artifact, start their own loopback preview on port 4175, refuse to reuse another server, and require no backend. Every test rejects API/external/non-GET requests and uncaught browser exceptions. Confirmation verifies keyboard focus and requires explicit acceptance before the appointment changes.
- CI now runs lint, unit tests, Chromium installation, and browser tests before packaging. The browser command builds/verifies the demo itself. The deployment gate remains disabled by default. Test output/traces are ignored by Git.
- **Validation:** lint passed (19 source/config/test files); 26 unit/artifact tests passed; 9 Chromium tests passed after code fixes; standard TypeScript/Vite build and public-demo build passed; actionlint passed with shellcheck unavailable; `git diff --check` passed. No hosted Actions result claimed.
- **Limits:** desktop Chromium only, synthetic browser-local workflow only. Full responsive/accessibility audits and Firefox/WebKit automation remain outside QA-2. Trace files contain only this synthetic test scenario and are retained locally only on failure.

Reproduce from `frontend/`: `npm ci`, `npx playwright install chromium`, `npm run lint`, `npm test`, `npm run test:e2e`. The final command builds the public demo automatically. On Linux, install browser OS dependencies with `npx playwright install --with-deps chromium`.

Manual review: open http://127.0.0.1:8001/#/demo using the existing local static server; choose Provider, cancel/send offer, switch to Patient, preview/go back, then explicitly confirm. Verify Provider shows Elena at 2:00 PM and waitlist 2. Reset, test decline/help, and check direct `#/login` and browser back/forward. If the server has stopped, run `python3 -m http.server 8001 --bind 127.0.0.1 --directory frontend/dist` from the project root.

Next non-deployment task after review: **UX-2 (P1)** Spanish/English UI copy and date formatting. Keep P1 tasks incremental; do not reactivate deferred production authentication or deployment.


### UX-1 — responsive layout and zoom validation

- Fixed a reproduced Provider overflow: at 320px the document expanded to 326px. `styles.css` now uses `minmax(0, 1fr)` for the mobile shell and two-column Provider navigation at widths ≤375px. Table scrolling stays within its focusable region; no page-level overflow hiding was added.
- Added `e2e/responsive.spec.ts`: five viewport cases (320/375/768/1024/1440px, 900px height), covering entry, all Provider sections, cancellation/offer, Patient confirmation/acceptance, and reset. Every checkpoint asserts the document/body fit the viewport; narrow cases verify ArrowRight scrolls the table. Screenshots are saved to ignored test output.
- Validation: **14 Chromium tests passed** (9 existing + 5 responsive), **26 unit/artifact tests passed**, lint passed with zero warnings, and public-demo TypeScript/build/artifact verification passed. Existing CI automatically includes the new tests.
- Native Firefox at **200% browser zoom**: entry → Provider cancellation/offer → Patient confirmation/acceptance → reset passed; confirmation layout visually inspected and zoom restored to 100%. This is a manual desktop browser check, not automated zoom emulation.
- Limits: viewport tests do not establish real-device/touch, screen-reader, or every browser/zoom combination coverage. UX-3 remains open. No commit/push or deployment performed for this task.

Manual acceptance: refresh http://127.0.0.1:8001/#/demo; inspect 320px and 375px widths, switch through all Provider sections, and complete the offer flow. Verify only the schedule table scrolls horizontally and all role/reset controls remain reachable. Repeat at browser 200% zoom, then restore 100%. Reproduce automated checks with `cd frontend && npm run lint && npm test && npm run test:e2e`.
