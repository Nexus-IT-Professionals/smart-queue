# Submission: Smart Appointment Queue

Caribbean AI Summit 2026 Hackathon. Rules and the compliance checklist: [HACKATHON_RULES.md](HACKATHON_RULES.md).

## Project name

Smart Appointment Queue

## Team

> **Confirm before submitting.** This list comes from the repository's Git authors, not from an official roster. Check names, add roles, and make sure it matches the Devpost team.

| Name | Role |
|---|---|
| Julio Arroyo | to confirm |
| Luis Sanabria | to confirm |
| Reyis Jones | to confirm |

## Description

Cancelled appointments leave empty slots in Puerto Rico medical offices while waiting patients call again and again for an earlier date. When a patient cancels in Smart Appointment Queue, a simulated AI assistant ranks eligible waiting-list patients by availability and staff-confirmed priority, offers the slot to the best match, moves the booking only after that patient explicitly accepts, and notifies the office assistant. The prototype runs entirely in the browser on fictional data; the assistant follows fixed scheduling rules with no AI model, messages and bookings are simulated, and nothing is stored.

## Links

- Live demo: https://smart-queue-demo.vercel.app (no account or password)
- Code repository: https://github.com/Nexus-IT-Professionals/smart-queue
- Presentation: https://smart-queue-demo.vercel.app/presentation/index.html (12-slide story or 5-slide submission mode). Inside the app, the sidebar link **Press for presentation** opens the same page.
- Source files: [README](../README.md), [demo access](DEMO_ACCESS.md), [priority calendar](PRIORITY_CALENDAR.md), [capacity statistics](CAPACITY_STATISTICS.md)

## How to review

1. Open the live demo and choose **Start the guided demo** (you start as María).
2. As María, choose **Cancel my appointment**, then **Yes, cancel my appointment** for October 8, 2:00 PM. The **AI assistant (simulated)** selects José and sends him an in-app offer.
3. Switch to **José** in the header, choose **Accept earlier visit**, then **Yes, move my appointment**.
4. Switch to **Ana (office)**: read her notification, the **AI activity** feed (who was selected and why) and the Activity log; then try **Capacity**, **Waitlist** priorities and the Day/Week/Month calendar on **Schedule**.
5. Use **Reset demo scenario** (or reload) to start over.

## Run locally

From `frontend/` with Node 24 or 25: `npm ci`, then `npm run dev` to run the app, or `npm run lint`, `npm test` and `npm run test:e2e` (after `npx playwright install chromium`) to run the checks. Full instructions are in the [README](../README.md#run-locally).

## Feature status

**Working** runs in the browser today on deterministic synthetic data. **Simulated** looks real in the demo but is an in-browser simulation: no message is sent, no real appointment changes, and everything resets on reload. **Planned** is not built. Each Working or Simulated row cites a test title in `frontend/e2e/` or `frontend/tests/` that checks it.

| Feature | Status | Evidence (test title) |
|---|---|---|
| Public entry with no account, password or verification | Working | "public entry, login alias, direct role links and unknown routes never require credentials" |
| Office view sections, search, filters and empty states | Working | "all provider sections, search, empty state and filters" |
| Day/Week/Month calendar with P1–P4 priority indicators | Working | "the AI selects the staff-confirmed urgent eligible patient, who explicitly accepts; all calendar views update" |
| Priority ranking with eligibility constraints and stable ties | Working | "priority ties use request date then stable ID, without mutating inputs" |
| Staff-confirmed priorities steer which patient the AI assistant selects | Working | "staff priority configuration steers the AI's selection; later changes never replace an existing offer" |
| AI selection reasoning shown to the office, taken from the ranking's own inputs | Working | "the AI's reasoning is the deterministic ranking's own inputs" |
| Priority configuration (labels, order, enabled levels, default) | Working | "configuration validation, migration, custom labels/order and session reset" |
| Capacity and statistics dashboard (synthetic month near 90% occupancy) | Working | "monthly capacity, daily cancellation and priority reassignment recalculate immediately" |
| Capacity configuration and previous-month snapshots | Working | "configuration validates limits, supports resources, reset and previous-month snapshots" |
| English and Spanish interface | Working | "Spanish mode shows no leftover English across every demo state" |
| Puerto Rico time regardless of the browser's timezone | Working | "demo dates and times stay in Puerto Rico time in EN and ES" |
| Keyboard use and automated accessibility scans (axe, WCAG A/AA) | Working | "accessible semantics and contrast across demo states (en)" |
| "Press for presentation" link | Working | "opens a centered, named popup and keeps the demo state (en)" |
| Works offline after first load; the security policy blocks network requests | Working | "venue Wi-Fi drop: the scenario completes offline after first load" |
| AI assistant: detects María's cancellation, selects and offers the slot to a waiting patient, updates the schedule after acceptance and notifies Ana | Simulated | "the AI assistant walks every phase: detect → select → offer, then update → notify Ana"; "full AI-assisted story across María, José and Ana (en)" |
| Patient cancellation and acceptance, each with explicit confirmation, updating schedule, waitlist and activity log | Simulated | "explicit confirmation updates booking, waitlist and activity; reset restores state"; "María cancels, the AI offers José, José accepts, the AI updates the schedule and notifies Ana" |
| María can back out before cancelling; José's only reply is to accept | Simulated | "María can back out before cancelling; José has only accept; reload clears state" |
| One cancellation and one acceptance per offer | Simulated | "double activation of María's cancel confirmation applies once"; "double activation of confirm applies the acceptance only once" |
| Staff booking, cancellation and reschedule in the capacity month | Simulated | "reschedule conserves occupancy across days and blocks stale or conflicting destination" |
| Saved data (backend database, data survives reload) | Planned | The FastAPI backend in `backend/` is not deployed; only `/api/health` exists. |
| Real SMS, WhatsApp or email messages | Planned | Not built. |
| Model-backed AI assistant (a real language model instead of fixed scheduling rules) | Planned | Not built; the demo assistant is rule-based and makes no network request. |
| AI help interpreting patient replies | Planned | Not built; the local model in `docker-compose.yml` is unused by the demo. |
| Offer expiry and automatic next-candidate offers | Planned | Not built. |
| Several offices and simultaneous users | Planned | Not built; each browser tab has its own state. |
| Production sign-in and access control | Planned | Not built; the demo roles are public by design. |

All patients, providers and appointments are fictional. Do not enter real patient information.
