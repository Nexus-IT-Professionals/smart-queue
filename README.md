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
- Demo tests: `cd frontend && npm test` — **6 passed** covering public navigation resolution, workflow transitions, and the credential-free health request.
- Desktop Firefox: checked credential-free entry, Provider cancellation/offer, Patient acceptance, appointment update, and return to the entry page without losing access.
- Static-only Firefox: direct Patient access works with the health API unavailable.
- Mobile/tablet, full accessibility, Docker, and automated browser tests remain unverified. No lint script is configured.

These checks validate the UI preview and health endpoint, not a complete booking workflow. Detailed results and limitations are in [PENDING_TASKS.md](PENDING_TASKS.md).

## Planning documents

- [Technical proposal](docs/TECHNICAL_PROPOSAL.md): proposed scope, architecture, interfaces, and implementation plan. The React/FastAPI skeleton exists; most workflow and integration decisions remain unimplemented.
- [Hackathon rules and checklist](docs/HACKATHON_RULES.md): recorded rules and open submission tasks; recheck the official rules before submitting.
- Background research: [waitlist backfill](docs/wiki/waitlist-backfill.md), [Puerto Rico no-show data](docs/wiki/pr-no-show-data.md), and [competitors](docs/wiki/idea-3-competitors.md). These notes distinguish measured results from estimates and vendor claims.

This README was adapted from the team's pre-event planning documents (research and planning only; no application code was written before the official build period).
