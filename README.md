# Smart Appointment Queue

Help Puerto Rico medical offices fill cancelled appointments by offering available slots to waiting patients and recording each change.

## Project status

Built for the Caribbean AI 2026 Hackathon. The POC is open to judges without accounts, passwords, or verification. Choose **Continue as Demo Provider** or **Continue as Demo Patient** on the entry page. The Provider workspace reuses the staff scheduling tools; there is no separate Admin interface.

The synthetic, single-browser workflow now supports cancellation → offer → explicit acceptance → updated appointment, waitlist, and activity. State lives in memory and resets on refresh. No real appointment, message, or backend write occurs. `/api/health` remains the only implemented API. Production authentication, authorization, registration, and account management are **Post-POC enhancements**, not demo prerequisites.

See [Demo access](docs/DEMO_ACCESS.md) for direct entry links and boundaries, and [PENDING_TASKS.md](PENDING_TASKS.md) for validation and the roadmap. Public hosting still needs a destination; localhost is not a public judge URL.

## The problem

Cancellations leave gaps in office schedules while patients call repeatedly to find earlier appointments. Reception staff need a simple way to match available slots with patients on a waitlist.

## Why Puerto Rico

- **Waits run months.** "The next available slot might be in six months" (Fiscal Oversight Board workforce study, February 2025, interview quote). Puerto Rico physicians told the Senate that 15–30% no-shows force offices to overbook and asked for voluntary pilots (Senate Health Committee record on PS 1263, 2026; a stakeholder claim, not a measured rate).
- **The refillable slot is the cancellation, and there are many.** In the only measured Puerto Rico appointment dataset (CFSE, the workers' compensation insurer, FY2025-26), about 15.6% of resolved appointments were cancelled, against 4.7% not attended. A cancellation with notice is the slot a queue can offer to someone else (derived from government counts; see [docs/wiki/pr-no-show-data.md](docs/wiki/pr-no-show-data.md)).
- **Specialist capacity is shrinking.** Active physicians grew only in primary care between 2019 and 2023 while medical specialties fell (2024 medical-practice market study, estadisticas.pr). An empty specialist slot is capacity the island cannot replace.
- **The offices that lose money on an empty slot are known.** The government plan pays primary care a fixed amount per assigned patient each month, so a refilled slot is revenue for the offices paid per visit: specialists, dentists, therapy and imaging (Plan Vital payment terms, medicaid.gov; the consequence is derived).
- **Most offices are small and book by phone.** 3,724 physician offices and 885 dental offices with payroll, most with fewer than five employees (Census 2023), with schedules in a handful of local record systems that publish no integration programme. A queue that starts from a staff-confirmed cancellation fits that reality.

Every figure carries its source and a reliability label in the research pages; "not found" is never treated as proof of absence.

## Initial MVP

Start with one medical office, synthetic patient data, and simulated messages.

- Display a daily appointment schedule and patient waitlist.
- Let staff confirm a cancellation and open a slot.
- Match patients using availability preferences and offer the slot to one patient at a time.
- Confirm a booking once; move to the next candidate when an offer expires or is declined.
- Record cancellations, offers, responses, and bookings in an activity log.
- Track opened slots, offers sent, and confirmed replacements.

## Basic flow

Staff confirms a cancellation → system finds a matching patient → simulated offer is sent → patient responds → booking updates → activity is recorded.

## Proposed AI role

Interpret short Spanish or English replies as acceptance, decline, or a request for help. Ambiguous replies go to staff for review, and a manual response selector remains available if AI fails.

Booking rules control availability, offer expiry, and duplicate acceptance. Patients must confirm before their appointments change.

## Demo workflow

1. Enter Provider view and confirm the sample October 8, 2:00 PM cancellation.
2. Send the demo offer to Elena, then open Patient view.
3. Preview acceptance and confirm. Elena's fictional appointment moves from October 22 to October 8.
4. Return to Provider: the schedule names Elena, the waitlist has two remaining patients, and the Activity log records the steps.
5. Reset the scenario to replay or try decline/help. No credentials are required at any step.

AI reply interpretation, expiry, automatic next-candidate offers, persistence, and simultaneous users remain future work.

## Next steps

1. Choose and publish to a public static hosting destination; verify access in a signed-out browser.
2. Validate mobile layouts, keyboard navigation, and screen-reader behavior.
3. Rehearse the synthetic workflow and prepare the judge video and feature-status list.
4. If needed for the POC, add simulated expiry/next-candidate handling and optional bounded AI assistance.

Production accounts and protected live APIs are deliberately deferred. Priorities and acceptance criteria are in [PENDING_TASKS.md](PENDING_TASKS.md).

Multi-office routing, real messaging, EHR integrations, predictive no-show scoring, clinical prioritization, and payments are outside the initial MVP.

## Project structure

```
backend/            FastAPI app (Python)
  app/main.py       app entry; routers under /api; serves the built frontend
  app/config.py     settings from environment variables (see .env.example)
  app/db.py         SQLite connection; app/schema.sql holds the proposed tables
  app/routers/      auth, patients, appointments, waitlist, cancellations, offers, stats (stubs)
  app/services/     scheduling, offers, ai_reply, audit, metrics (stubs)
  seed/seed.py      synthetic demo data (stub)
  tests/            pytest suite
frontend/           React + TypeScript + Vite; one app with Staff and Patient workspaces
  src/components/  shared icons, badges, avatars, and empty states
  src/demo/        fictional fixtures, public role resolution, and local workflow reducer
  src/pages/       public demo entry, Provider tools, and Patient workspace
  tests/           dependency-free demo navigation/state tests
  src/styles.css   shared design tokens and responsive layouts
PENDING_TASKS.md     completed improvements, validation evidence, and remaining tasks
data/               local SQLite file (ignored by Git)
Dockerfile          builds the frontend, then serves it from the Python image
docker-compose.yml  app + local Ollama; only the app is published, on 127.0.0.1:8000
```

## Run locally

Requires Python 3.12+ and Node 22+.

```bash
# Frontend build
cd frontend
npm ci
npm run build

# Isolated Python environment (from the project root)
cd ..
python3.12 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt

# Backend (serves the built frontend)
cd backend
STATIC_DIR=../frontend/dist DATABASE_PATH=../data/smart_queue.db ../.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. `GET /api/health` should return `{"status":"ok"}`. For frontend work, run `npm run dev` in `frontend/`; it proxies `/api` to port 8000. Run tests with `../.venv/bin/python -m pytest -q` from `backend/`.

With Docker: `docker compose up --build` (Compose 2.24+). It also starts Ollama; pull the model once with `docker compose exec ollama ollama pull qwen2.5:1.5b`. The Docker path has not been tested yet.

All data is synthetic. Do not enter real patient information.

### Explore the UI preview

Open the root URL or `#/demo` to choose a fictional identity. `#/login` is an always-public alias with **Continue as Demo Patient**; it collects no input. `#/provider` and `#/patient` open the workspaces directly. The **Demo access** header button remains available after any action.

The Provider schedule is dated **October 8, 2026**. Existing search, status/date filters, and empty-state recovery remain available. Role switching and visiting the entry page preserve the local scenario. **Reset demo scenario** or reload starts over; separate tabs do not share data. No login, registration, database seed, or Ollama setup is needed to demonstrate the synthetic workflow.

## Pre-existing components

Built with open-source components, credited as the hackathon rules require: [FastAPI](https://fastapi.tiangolo.com/) (MIT), [Uvicorn](https://www.uvicorn.org/) (BSD-3), [Pydantic](https://docs.pydantic.dev/) (MIT), [HTTPX](https://www.python-httpx.org/) (BSD-3), [pytest](https://pytest.org/) (MIT), [SQLite](https://www.sqlite.org/) (public domain), [React](https://react.dev/) (MIT), [Vite](https://vite.dev/) (MIT), [TypeScript](https://www.typescriptlang.org/) (Apache-2.0), [Ollama](https://ollama.com/) (MIT), and the [Qwen2.5 1.5B](https://ollama.com/library/qwen2.5:1.5b) model (Apache-2.0). No templates or reused application code.

The UI takes visual inspiration from this [Pinterest dashboard reference](https://ru.pinterest.com/pin/1100285752847570247/): navy navigation, a pale canvas, white cards, and blue/coral accents. No artwork or template code was copied; icons are original inline SVGs and typography uses system fonts.

## Validation status

- Production build: strict TypeScript and Vite passed.
- Backend tests: **1 passed**; an upstream Starlette/HTTPX deprecation warning remains.
- FastAPI served the production HTML, JavaScript, CSS, and health endpoint successfully.
- Demo tests: `cd frontend && npm test` — **26 passed** covering public navigation resolution, workflow transitions, the credential-free health request, and public artifact rejection cases.
- QA-2: `npm run lint` — zero warnings; `npm run test:e2e` — **9 Chromium tests passed**.
- Desktop Firefox: checked credential-free entry, Provider cancellation/offer, Patient acceptance, appointment update, and return to the entry page without losing access.
- Static-only Firefox: direct Patient access works with the health API unavailable.
- Mobile/tablet, full accessibility, Docker, and automated Firefox/WebKit tests remain unverified. Biome lint and desktop Chromium browser tests are now configured.

These checks validate the synthetic browser workflow and health endpoint, not persistent production booking. Detailed results and limitations are in [PENDING_TASKS.md](PENDING_TASKS.md).

## Planning documents

- [Technical proposal](docs/TECHNICAL_PROPOSAL.md): proposed scope, architecture, interfaces, and implementation plan. The React/FastAPI skeleton exists; most workflow and integration decisions remain unimplemented.
- [Hackathon rules and checklist](docs/HACKATHON_RULES.md): recorded rules and open submission tasks; recheck the official rules before submitting.
- Background research: [waitlist backfill](docs/wiki/waitlist-backfill.md), [Puerto Rico no-show data](docs/wiki/pr-no-show-data.md), and [competitors](docs/wiki/idea-3-competitors.md). These notes distinguish measured results from estimates and vendor claims.

This README was adapted from the team's pre-event planning documents (research and planning only; no application code was written before the official build period).

## Public hackathon build

Run `cd frontend && npm run build:demo` and publish only `frontend/dist/` at the host's site root. This release makes no API requests, displays “Standalone demo · No API connection,” and includes a restrictive browser connection policy. The build verifies the output contains only expected UI assets; it rejects unexpected files, symlinks, source maps, API paths, and selected secret signatures. This guard does not replace review of synthetic data or detect every possible secret.

`npm test` runs 26 tests; `npm run verify:demo` rechecks the artifact. Standard `npm run build` retains the development health check and overwrites the output, so use `build:demo` for publication. See [manual release acceptance](docs/DEMO_ACCESS.md#public-artifact-guard-and-manual-acceptance-sec-poc-1). Vercel with GitHub Actions is selected; configuration is prepared; activation and public deployment remain pending.

### Deployment readiness — October 9, 2026

The next P0 is public static hosting (DEP-POC-1). All 26 unit/artifact tests, 9 Chromium browser tests, lint, and the public-demo build/artifact check passed locally. Vercel with GitHub Actions is selected; no public deployment URL has been verified. Deployment configuration is prepared, with publishing disabled until explicitly enabled. A host serving under a subdirectory also requires adapting and testing the current root-relative asset checks.


The [DEP-POC-1 implementation task](PENDING_TASKS.md#dep-poc-1--configure-github-actions-deployment-to-vercel) covers the workflow, test/build gates, static-only publishing, and manual acceptance. Store `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` in GitHub deployment-environment secrets; never commit their values or expose them through frontend variables, logs, or artifacts. Secret scanning, ignore rules, and credential rotation are part of the planned acceptance criteria. The workflow is now implemented; no secrets or Vercel deployment have been created.


#### Prepared workflow (deployment paused)

`.github/workflows/deploy-vercel.yml` validates PRs and `main`: tests, public build, redacted Gitleaks history/package scans, and verified static packaging. Actions are pinned by commit, Gitleaks by version/checksum, and Node/Vercel CLI by version. Only a trusted `main` run can deploy; PR validation receives no deployment secrets.

To activate later, create a dedicated Vercel static demo project and the GitHub environment `vercel-production`, restrict it to `main`, and populate its three secrets listed above. Configure required reviewers where available. Keep the Vercel project rooted at the repository root and disable duplicate Git auto-deployments (`vercel.json` contains `git.deploymentEnabled: false`). Then set repository Actions variable `VERCEL_DEPLOY_ENABLED=true` and run the workflow on `main`. Until then the deploy job is skipped. Never put tokens in frontend variables or tracked files.

For local packaging: `cd frontend && npm test && npm run build:demo && npm run package:vercel`. The package is ignored at `frontend/.vercel-stage`; packaging intentionally refuses an existing destination. For a repeat run use a fresh destination: `npm run package:vercel -- /tmp/queue-review-UNIQUE`. Verify with `node scripts/package-vercel.mjs --verify /tmp/queue-review-UNIQUE`. Preview `frontend/dist/` using the existing local static server, then follow the [manual checklist](docs/DEMO_ACCESS.md#public-artifact-guard-and-manual-acceptance-sec-poc-1).

Local validation: 26 tests passed, public build/package verified, actionlint passed (shellcheck unavailable), and Gitleaks found no leaks in the 10 existing commits or static package. These checks do not prove every possible secret is absent. Hosted Actions, CLI deployment, environment protections, signed-out HTTPS access, and rollback remain unverified. For failures, keep publishing disabled and fix the failing check; after a live deployment exists, use Vercel's rollback to the last verified release and rehearse the workflow. Rotate a compromised token immediately and replace the environment secret; removing it from Git alone is insufficient.


### QA-2: repeatable lint and browser checks

From `frontend/`, run:

```bash
npm ci
npx playwright install chromium
npm run lint
npm test
npm run test:e2e
```

Validated locally: lint passes with zero warnings, 26 unit/artifact tests pass, and 9 Chromium tests pass. The browser suite rebuilds the public demo and starts an isolated loopback server at port 4175 without a backend. It covers direct public routes, role/entry navigation, back/forward, provider sections and filters, acceptance confirmation/focus, help/decline, and reset/reload; API/external requests and uncaught browser errors fail tests. CI runs these checks before packaging; publishing remains gated off. Browser traces/screenshots on failure are ignored by Git.

Biome uses recommended rules with documented exceptions for intentional navigation/focus and the existing CSS cascade. TypeScript compilation remains a separate check. Desktop Chromium coverage does not replace mobile, screen-reader, or cross-browser review. See [QA-2 results and manual steps](PENDING_TASKS.md#qa-2--lint-and-automated-browser-regression-tests).


### UX-1: responsive layout checks

Fixed horizontal Provider page overflow at 320px: the mobile shell can shrink and navigation uses two columns at ≤375px. The schedule table retains its own keyboard-scrollable region. Five new tests exercise all Provider sections and the appointment workflow at 320/375/768/1024/1440px without page overflow. The full suite now passes **14 Chromium tests**, plus **26 unit/artifact tests** and lint. Public-demo build verification passes. A native Firefox **200% zoom** walkthrough also passed through acceptance and reset; real-device/touch and full accessibility testing remain pending.

For manual review, refresh http://127.0.0.1:8001/#/demo, try 320px/375px widths and 200% browser zoom, and complete cancellation → offer → acceptance → reset. See [UX-1 validation](PENDING_TASKS.md#ux-1--responsive-layout-and-zoom-validation). Changes await manual review before commit/push.
