# Smart Appointment Queue

Help Puerto Rico medical offices fill cancelled appointments by offering available slots to waiting patients and recording each change.

## Project status

Built for the Caribbean AI 2026 Hackathon. The POC is open to judges without accounts, passwords, or verification. Choose **Continue as Demo Provider** or **Continue as Demo Patient** on the entry page. The Provider workspace reuses the staff scheduling tools; there is no separate Admin interface.

The synthetic, single-browser workflow now supports cancellation → offer → explicit acceptance → updated appointment, waitlist, and activity. State lives in memory and resets on refresh. No real appointment, message, or backend write occurs. `/api/health` remains the only implemented API. Production authentication, authorization, registration, and account management are **Post-POC enhancements**, not demo prerequisites.

See [Demo access](docs/DEMO_ACCESS.md) for direct entry links and boundaries, and [PENDING_TASKS.md](PENDING_TASKS.md) for validation and the roadmap. The demo is public; see [How the demo is hosted](#how-the-demo-is-hosted) below.

## How the demo is hosted

The public demo at **https://smart-queue-demo.vercel.app** is the React app in this repository, built as static files and served by Vercel. Anyone can open it, with no account or password.

- **Nothing leaves your browser.** No server, database or API sits behind the demo. The data is fictional, lives in memory and resets on reload. The page's security policy blocks every network request.
- **Every release is tested before it goes live.** Each push to `main` runs in GitHub Actions: a secret scan of the full history, lint, unit tests, browser tests, and a check that the package holds only the expected files (no source maps, no configuration). It is published only if all of them pass.

  ```
  push to main → secret scan → lint → unit tests → browser tests → package check → Vercel
  ```

- **What is not deployed.** The FastAPI backend in `backend/` and the local AI model in `docker-compose.yml` are groundwork for future features (see [Proposed AI role](#proposed-ai-role) and [Next steps](#next-steps)). The public demo does not use them.

## Judge presentation

Open [presentation/index.html](presentation/index.html) offline for the 12-slide character story (2:40 estimated narration), or choose its five-slide submission mode (1:50). Includes original artwork, real synthetic POC screenshots, speaker notes, keyboard controls, fullscreen, and an optional timer. [Presentation instructions](presentation/README.md) cover rehearsal and the event’s five-slide / two-minute submission limits. AI is clearly labeled as future work.

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

## Provider calendar and scheduling priorities

Provider → **Schedule** now supports **Day, Week and Month**, period navigation, day selection, slot/status counts, cancellation history and eligible P1/P2 indicators. October 8 and October 22 contain synthetic appointments; empty dates do not imply availability.

Provider → **Waitlist** lets demo staff confirm P1–P4 scheduling priorities. **Priority configuration** controls labels, descriptions, indicators, ordering, enabled levels and an enabled non-urgent default. Candidates must meet office/provider, visit, duration, date/time and conflict constraints before priority ranking. Ties use request date, then record ID. Staff confirms an offer; the selected patient must still explicitly accept. The new booking and released old slot appear consistently across calendar views.

Try assigning **Camila → P1**, check the qualified-staff review confirmation, save, then cancel the sample slot and review candidates. Camila ranks ahead of normal-priority Elena; morning-only Nicolás remains ineligible. No AI or condition-text analysis decides urgency. **Scheduling support is not emergency medical assessment.** Changes live in the existing shared browser memory and reset on reload; there is no backend persistence. See [rules, limits and manual scenarios](docs/PRIORITY_CALENDAR.md).

## Next steps

1. Complete the manual screen-reader review (VoiceOver, NVDA) and test on real touch devices.
2. Rehearse the synthetic workflow and prepare the judge video and feature-status list.
3. If needed for the POC, add simulated expiry/next-candidate handling and optional bounded AI assistance.

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

Node 24.14.1 tested locally; CI runs Node 25.9.0. `frontend/.nvmrc` pins 25.9.0 and `package.json` `engines` allows `>=24.14.0 <26`. Install with `npm ci` — `package-lock.json` is authoritative. `backend/requirements.txt` is pinned exactly; it installs cleanly and passes the backend tests on Python 3.14.2 and 3.11.9. The Docker image targets Python 3.12.15 (not yet tested). On Windows, use `py -3 -m venv .venv` and `.venv\Scripts\python`.

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

Every push to `main` runs lint, unit tests and Chromium browser tests before anything is published (see [How the demo is hosted](#how-the-demo-is-hosted)). The browser tests cover the full demo workflow, direct links to each view, English and Spanish, screen widths from phone to desktop (320 to 1440px), keyboard-only use, and automated accessibility scans (axe, WCAG A/AA). To run them from `frontend/`:

```bash
npm ci
npx playwright install chromium
npm run lint
npm test
npm run test:e2e
```

Not yet verified: screen-reader speech (VoiceOver, NVDA), real touch devices, automated Firefox and WebKit runs, and the Docker setup. These checks cover the synthetic browser workflow, not persistent production booking. Detailed results are in [PENDING_TASKS.md](PENDING_TASKS.md).

## Planning documents

- [Technical proposal](docs/TECHNICAL_PROPOSAL.md): proposed scope, architecture, interfaces, and implementation plan. The React/FastAPI skeleton exists; most workflow and integration decisions remain unimplemented.
- [Hackathon rules and checklist](docs/HACKATHON_RULES.md): recorded rules and open submission tasks; recheck the official rules before submitting.
- [Why this idea](docs/WHY_THIS_IDEA.md): why a cancellation-refill queue for Puerto Rico although backfill exists in the United States; the differentiators with their evidence, the one-paragraph answer for judges, and the Q&A table.
- Background research ([index](docs/wiki/index.md)): [waitlist backfill](docs/wiki/waitlist-backfill.md), [Puerto Rico no-show data](docs/wiki/pr-no-show-data.md), [competitors](docs/wiki/idea-3-competitors.md), and the Puerto Rico landscape pages added 2026-10-09: [front desk today](docs/wiki/pr-front-desk-today.md), [office systems](docs/wiki/pr-office-systems.md), [US vendors and the barriers](docs/wiki/us-vendors-and-pr-barriers.md), [plans and access standards](docs/wiki/pr-plans-and-access-standards.md). These notes distinguish measured results from estimates and vendor claims.

This README was adapted from the team's pre-event planning documents (research and planning only; no application code was written before the official build period).

## Public hackathon build

Run `cd frontend && npm run build:demo` and publish only `frontend/dist/` at the host's site root. This release makes no API requests, displays “Standalone demo · No API connection,” and includes a restrictive browser connection policy. The build verifies the output contains only expected UI assets; it rejects unexpected files, symlinks, source maps, API paths, and selected secret signatures. This guard does not replace review of synthetic data or detect every possible secret.

`npm run verify:demo` rechecks the artifact. Standard `npm run build` retains the development health check and overwrites the output, so use `build:demo` for publication. See [manual release acceptance](docs/DEMO_ACCESS.md#public-artifact-guard-and-manual-acceptance-sec-poc-1).
