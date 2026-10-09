# Smart Queue — completion roadmap

Reviewed October 8, 2026. Baseline: `7ed0b1f`; working tree was clean before this UI work.

The application now has a styled, interactive UI preview. It is **not a production scheduling system**: `/api/health` is the only implemented API operation. Synthetic fixtures and preview responses do not write to the database or book appointments.

## Design and completed work

The [Pinterest reference](https://ru.pinterest.com/pin/1100285752847570247/) failed through web retrieval but was inspected visually in Firefox. Observed characteristics: navy top bar, pale blue-gray canvas, white rounded cards, compact filters, prominent metrics, and blue/coral charts. This implementation adapts that hierarchy; no reference artwork or template code was copied. System fonts and original inline SVG icons avoid new runtime dependencies. Astra was not exposed as a tool or installed executable in this session.

| Status | Files / components | Completed improvement |
|---|---|---|
| Done | `frontend/src/App.tsx` | Branded shell, staff/patient switch, four staff views, active navigation, skip link, page focus management, visible synthetic-data notice. |
| Done | `frontend/src/styles.css` | Shared palette and card styles; desktop/sidebar, tablet/top navigation, and mobile stacking; scrollable schedule table; focus indicators and reduced-motion support. |
| Done | `frontend/src/components/ui.tsx` | Reusable icons, avatars, status badges, and empty state. Decorative icons are hidden from assistive technology. |
| Done | `frontend/src/demo/data.ts` | Explicitly fictional fixtures, one demo date, typed responses, shared messages. No local storage or backend mutations. |
| Done | `frontend/src/pages/staff/StaffWorkspace.tsx` | Derived metrics and chart, name/ID search, status/date filters, empty-state reset, waitlist cards, and session-only activity. |
| Done | `frontend/src/pages/patient/PatientWorkspace.tsx` | Current appointment and preferences, two-step acceptance preview, decline/help/reset states, live feedback, and focus restoration. |
| Done | `frontend/src/api/client.ts` and `App.tsx` | Existing health check retained; abort signal, five-second timeout, request cleanup, and retry added. Healthy API does not imply booking readiness. |
| Done | `README.md` | Accurate implementation status and preview walkthrough. |

Backend business logic, schema, container configuration, dependency manifests, and lockfile were not changed.

## Validation

| Check | Result / limit |
|---|---|
| Locked frontend dependencies | `npm ci --ignore-scripts --no-audit --no-fund` succeeded after network access was available. No dependency changes. |
| Production build | `cd frontend && npm run build` passed: strict TypeScript and Vite. Final JS approximately 244 KB / 75 KB gzip; CSS 20 KB / 5 KB gzip. |
| Backend tests | `cd backend && ../.venv/bin/python -m pytest -q`: **1 passed** under Python 3.12. One upstream Starlette/HTTPX deprecation warning. The default system Python lacked FastAPI; an isolated `.venv` resolved that environment issue. |
| Integrated serving | FastAPI TestClient returned 200 for production HTML, both generated assets, and `/api/health`; OpenAPI contains only `/api/health`. |
| Desktop browser | Firefox rendered staff and patient pages and connected to the health API. Verified schedule navigation, `SQ-004` search, zero-result state, reset, open-slot status filtering, and explicit acceptance confirmation/result. |
| Responsive validation | Responsive CSS implemented. Firefox responsive-mode controls did not expose a usable test viewport through the available automation; mobile/tablet rendering is **not verified**. |
| Accessibility | Semantic headings/table, labels, non-color status text, focus styles, skip link, live feedback, and focus transitions implemented. A focus loss found during the first acceptance test was corrected; the correction still needs browser revalidation. Calculated contrast for eight key text/background pairs; darkened table headings after one failed 4.5:1. Full screen-reader, all-state contrast, zoom, and automated audits remain open. |
| Lint | No lint script/configuration exists. `npm run lint --if-present` performed no linting; this is not a lint pass. Changed source was formatted with a one-off Prettier run. |
| Git review | `git diff --check` passed. Reviewed the UI diff and verified no backend or dependency-file changes. |
| Not exercised | Docker build, other browsers, backend workflows (stubs), live AI, automated frontend behavior tests, and persistence. |

## Priorities and status

**P0:** needed for a credible end-to-end MVP or before exposing patient data. **P1:** needed for a reliable judge demo/pilot. **P2:** later enhancement. **Verified** means directly observed in source/runtime; **Recommendation** is proposed follow-up, not a confirmed defect. “Open” means unimplemented or unverified; “Deferred” means outside the current MVP.

### UI/UX

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| UX-1 | P1 | Open · Verified gap | Validate 320/375/768/1024/1440px layouts and 200% zoom. All navigation/actions remain reachable; only the appointment table may scroll horizontally; no clipped text or overlapping controls. |
| UX-2 | P1 | Open · Verified gap | Add Spanish/English interface copy. Language switch covers navigation, dates, forms, error states, and offer confirmation; Spanish-speaking reviewers can complete the journey without English-only instructions. |
| UX-3 | P1 | Open · Recommendation | Test readability, contrast, focus order, and screen-reader announcements with reception staff and patients. Meet WCAG AA contrast; keyboard users complete confirmation, back, reset, and empty-state recovery without losing their place. |
| UX-4 | P2 | Open · Recommendation | Add URL-backed navigation and filter restoration when integration stabilizes. Back/forward, reload, and shared schedule links preserve intended view/date without exposing patient details in URLs. |

### Frontend

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| FE-1 | P0 | Open · Verified (`demo/data.ts`, API client) | Connect schedule, waitlist, offers, profile, metrics, and activity to authenticated APIs. Real mode never silently falls back to fixtures; loading, empty, failed, and retry states work independently per section. |
| FE-2 | P0 | Open · Verified (workspace components) | Implement registration, preference editing, cancellation review, candidate selection, and offer sending. Forms have field validation; mutations show pending/error/success states and prevent accidental duplicate submission. |
| FE-3 | P0 | Open · Verified (patient preview) | Replace preview response handlers with server-confirmed operations. Show offer expiry/unavailability and explicit confirmation; display a new booking only after server success; preserve the original on failure. |
| FE-4 | P1 | Open · Verified (no polling) | Refresh offers/schedule using bounded polling. Stop on unmount/logout, recover after network loss, and reconcile another session's accepted or expired offer without stale actions. |

### Backend

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| BE-1 | P0 | Open · Verified (`main.py`, `seed/seed.py`) | Initialize/version SQLite and implement a repeatable synthetic seed. Clean startup works; seed/reset is explicit and safe; data persists across restart; include staff/patient demo accounts. |
| BE-2 | P0 | Open · Verified (`routers/`, `schemas.py`) | Implement validated appointment, patient, waitlist, cancellation, offer, and statistics contracts. Routes enforce ownership, return documented success/error responses, and reject invalid states. |
| BE-3 | P0 | Open · Verified (`services/offers.py`) | Implement atomic, idempotent acceptance and sequential offers. Concurrent/repeated acceptance produces one active booking; expiry is enforced on actions and restart; old booking is released only in the successful transaction. Existing unique indexes are a foundation, not a replacement for this service. |
| BE-4 | P0 | Open · Verified (`services/scheduling.py`) | Resolve ordering, travel/availability compatibility, timeout, and exact-24h policy. Staff-confirmed patient cancellation opens capacity; provider cancellation blocks it. Do not release visits for early non-arrival or use insurer labels to filter access. Record the agreed rules and tests. |
| BE-5 | P1 | Open · Verified (`services/audit.py`, `metrics.py`) | Persist actor/time/action/entity events and derive metrics from actual states. Distinguish acceptance from completed visits; define denominators and N/A for zero; avoid raw contact/reply data in logs. |

### Integrations

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| IN-1 | P1 | Open · Verified (`services/ai_reply.py`) | Connect bounded Ollama EN/ES reply classification. Validate accept/decline/help/unclear schema, enforce timeout/input limits, test negation/ambiguity/injected instructions; outages preserve manual buttons. AI never books or ranks patients. |
| IN-2 | P1 | Open · Verified (notification schema, no service) | Implement persisted simulated in-app inbox. Authorized patient sees only their offers, restart preserves state, and delivery labels never imply real SMS/email. |
| IN-3 | P2 | Deferred · Recommendation | Real messaging, EHR/insurance interfaces, voice, and multi-office routing. Scope and consent/data agreements must be explicit; build sandbox tests and failure handling before claiming integration. These are not required to finish the single-office demo. |

### Testing

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| QA-1 | P0 | Open · Verified (`tests/test_health.py` only) | Add backend booking/security tests with BE-2/3. Cover concurrency, duplicate acceptance, expiry boundaries, original-booking rollback, provider cancellation, restart, and cross-user/office denial. |
| QA-2 | P1 | Open · Verified (no frontend test/lint setup) | Add frontend lint and behavioral tests. CI covers search/status/date combinations, navigation, all response/reset paths, focus transitions, API timeout/retry, and empty/error states; no reliance on fixture counts alone. |
| QA-3 | P1 | Open · Recommendation | Add responsive, accessibility, and two-session end-to-end checks. Run staff cancellation → patient offer → confirmed replacement → persisted log; verify browser refresh and keyboard-only use. |
| QA-4 | P2 | Open · Verified test warning | Resolve the Starlette/HTTPX test-client deprecation through a compatible, tested dependency set. Tests run warning-free; do not change dependencies solely to hide warnings. |

### Security

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| SEC-1 | P0 | Open · Verified (`routers/auth.py`) | Implement login/logout/me, hashed passwords, expiring opaque sessions, cookie protection, CSRF, and login rate limits. UI role toggle grants no privileges; server checks patient ownership/staff office on every read and write. |
| SEC-2 | P0 | Open · Verified (demo-only shell) | Keep preview fixtures isolated from production mode. Authenticated routes require a session, responses cannot leak other patients, secrets never reach browser bundles/logs, and real patient data stays out of the public demo. |
| SEC-3 | P1 | Open · Recommendation | Before a real-data pilot, define retention, consent, backup access, and audit controls; test restore/deletion/access procedures. A local demo and an activity log do not establish healthcare compliance. |

### Deployment and submission

| ID | Priority | Status / basis | Task and acceptance criteria |
|---|---|---|---|
| DEP-1 | P1 | Open · Verified validation gap | Test `docker compose up --build` from a clean checkout. Built UI/API load, model remains private, SQLite survives restart, health failures are observable, and setup works on the demo laptop. |
| DEP-2 | P1 | Open · Verified (`requirements.txt`, image tags) | Pin a tested backend dependency set and container versions. Preserve the existing frontend lockfile; clean installs/builds are repeatable on supported Node/Python versions. |
| DEP-3 | P1 | Open · Verified submission gap | Complete the judge package: team attribution, final feature-status list, accessible repository/run steps, and a ≤2-minute demo video. Confirm current event requirements in `docs/HACKATHON_RULES.md`; demonstrate only working or clearly simulated capabilities. |
| DEP-4 | P2 | Deferred · Recommendation | Public production hosting: configure HTTPS, production session settings, monitored health, backups, and rollback; pass SEC-1/2 and deployment checks before exposure. Localhost preview is not a public deployment. |

## Recommended implementation order

1. Agree scheduling rules (BE-4), establish seeded persistence (BE-1), and implement sessions/authorization (SEC-1).
2. Build API contracts and transactional offers (BE-2/3), with concurrency and isolation tests (QA-1).
3. Connect the existing UI (FE-1/2/3), persisted inbox/log/metrics, then polling and optional AI assistance.
4. Complete responsive/accessibility validation, repeatable Docker setup, and the judge submission package.
