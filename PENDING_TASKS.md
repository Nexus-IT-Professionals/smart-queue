# Smart Queue — POC completion roadmap

Updated October 8, 2026. The current decision is a **public, credential-free hackathon POC**, using synthetic data only. Production accounts are not a prerequisite. [Demo access](docs/DEMO_ACCESS.md) supersedes earlier account/session requirements in the technical proposal.

## Verified implementation and access review

- No login page, auth library, redirect, middleware guard, or implemented authentication endpoint existed. The auth router was a stub; database user/session tables are unused by this POC.
- Patient and Staff were the existing interfaces. Staff is now labeled **Provider** and retains schedule, waitlist, and activity navigation. There is no separate Admin interface.
- `#/demo` and `#/login` always show the public entry page. `#/provider` (`#/staff` alias) and `#/patient` are directly accessible. Root/unknown fragments show the entry page; no credentials or personal input are requested.
- Fixed fictional identities are Dr. Alex Rivera and Elena Morales. Role selection is navigation, not a token or backend permission.
- The complete **synthetic single-offer scenario** runs in browser memory: provider cancellation → offer → explicit patient acceptance → changed appointment, waitlist, schedule, and activity. Decline/help/reset are supported. Invalid/repeated actions are ignored.
- Role changes and entry-page visits preserve state; reload/reset clears it. Separate judges/tabs do not share state. No live booking, message, real patient data, or database mutation is involved.
- `/api/health` remains the only implemented API. It is queried without cookies and does not gate navigation. No production security check was disabled or universal-login endpoint added.
- Public hosting is **not yet verified/configured**. GitHub Pages lookup returned HTTP 404; this could mean no site or insufficient access. A hosting destination is needed before sharing a public judge URL.

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
| `cd frontend && npm test` | **6 passed**: public route resolution; cancellation/offer/acceptance; invalid/duplicate actions; decline/help; reset and independent judge state; health request omits credentials and propagates cancellation. Uses Node's built-in runner/type stripping, tested on Node 25. |
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
| SEC-POC-1 | P0 | Release check · Recommendation | Verify the public artifact contains only synthetic UI assets. Publish only the built frontend; no `.env`, databases, accounts, or backend/model tunnel. Network inspection shows no booking/account mutations. |

### Deployment and submission

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| DEP-POC-1 | P0 | Blocked · Hosting destination missing | Choose a public static host and deploy `frontend/dist/`. Judges can open root, `#/login`, Patient, and Provider in a signed-out browser without platform access gates; HTTPS assets load and the simulated workflow works. |
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

1. Confirm a hosting destination and publish the static POC; verify signed-out access.
2. Complete responsive/accessibility and API-offline checks; rehearse the judge workflow.
3. Finalize submission materials. Revisit production accounts only after the POC scope changes.
