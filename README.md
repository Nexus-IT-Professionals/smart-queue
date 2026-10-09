# Smart Appointment Queue

Help Puerto Rico medical offices fill cancelled appointments by offering available slots to waiting patients and recording each change.

## Project status

Built for the Caribbean AI 2026 Hackathon. The project skeleton was created on 2026-10-08, during the official build period: a FastAPI backend and a React frontend that run together and show placeholder Staff and Patient workspaces. Scheduling, waitlist, offers and AI reply handling are not implemented yet. The MVP below is still proposed; the stack follows the [technical proposal](docs/TECHNICAL_PROPOSAL.md) §3.

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

## Demo scenario

A fictional office cancels a 2 p.m. appointment. A waitlisted patient receives an offer and replies, “Sí, puedo llegar.” The system interprets the reply, confirms the replacement, and records the change. Additional scenarios demonstrate expired offers and duplicate acceptance handling.

## Next steps

1. Agree on offer order, expiry, and availability rules.
2. Confirm the proposed stack and AI model on the demo laptop (skeleton in place; model not yet tested).
3. Build the schedule, waitlist, and cancellation-to-booking flow.
4. Add reply interpretation, manual review, and the activity log.
5. Verify expiry, duplicate acceptance, ambiguous replies, and AI failure behavior.

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
data/               local SQLite file (ignored by Git)
Dockerfile          builds the frontend, then serves it from the Python image
docker-compose.yml  app + local Ollama; only the app is published, on 127.0.0.1:8000
```

## Run locally

Requires Python 3.12+ and Node 22+.

```bash
# Frontend build
cd frontend
npm install
npm run build

# Backend (serves the built frontend)
cd ../backend
pip install -r requirements.txt
STATIC_DIR=../frontend/dist DATABASE_PATH=../data/smart_queue.db uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. `GET /api/health` should return `{"status":"ok"}`. For frontend work, run `npm run dev` in `frontend/`; it proxies `/api` to port 8000. Run tests with `pytest` from `backend/`.

With Docker: `docker compose up --build` (Compose 2.24+). It also starts Ollama; pull the model once with `docker compose exec ollama ollama pull qwen2.5:1.5b`. The Docker path has not been tested yet.

All data is synthetic. Do not enter real patient information.

## Pre-existing components

Built with open-source components, credited as the hackathon rules require: [FastAPI](https://fastapi.tiangolo.com/) (MIT), [Uvicorn](https://www.uvicorn.org/) (BSD-3), [Pydantic](https://docs.pydantic.dev/) (MIT), [HTTPX](https://www.python-httpx.org/) (BSD-3), [pytest](https://pytest.org/) (MIT), [SQLite](https://www.sqlite.org/) (public domain), [React](https://react.dev/) (MIT), [Vite](https://vite.dev/) (MIT), [TypeScript](https://www.typescriptlang.org/) (Apache-2.0), [Ollama](https://ollama.com/) (MIT), and the [Qwen2.5 1.5B](https://ollama.com/library/qwen2.5:1.5b) model (Apache-2.0). No templates or reused application code.

## Planning documents

- [Technical proposal](docs/TECHNICAL_PROPOSAL.md): proposed scope, architecture, interfaces, and implementation plan. Its stack and workflow decisions have not been implemented.
- [Hackathon rules and checklist](docs/HACKATHON_RULES.md): recorded rules and open submission tasks; recheck the official rules before submitting.
- Background research: [waitlist backfill](docs/wiki/waitlist-backfill.md), [Puerto Rico no-show data](docs/wiki/pr-no-show-data.md), and [competitors](docs/wiki/idea-3-competitors.md). These notes distinguish measured results from estimates and vendor claims.

This README was adapted from the team's pre-event planning documents (research and planning only; no application code was written before the official build period).
