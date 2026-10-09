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

Cancelled appointments leave empty slots in Puerto Rico medical offices while waiting patients call again and again for an earlier date. Smart Appointment Queue lets reception staff confirm a cancellation, rank eligible waiting-list patients by availability and staff-confirmed priority, and offer the slot to one patient, who must explicitly accept before the booking moves. The prototype runs entirely in the browser on fictional data; messages and bookings are simulated and nothing is stored.

## Links

- Live demo: https://smart-queue-demo.vercel.app (no account or password)
- Code repository: https://github.com/Nexus-IT-Professionals/smart-queue
- Presentation: https://smart-queue-demo.vercel.app/presentation/index.html (12-slide story or 5-slide submission mode). Inside the app, the sidebar link **Press for presentation** opens the same page.
- Source files: [README](../README.md), [demo access](DEMO_ACCESS.md), [priority calendar](PRIORITY_CALENDAR.md), [capacity statistics](CAPACITY_STATISTICS.md)

## How to review

1. Open the live demo and choose **Continue as Demo Provider**.
2. Confirm the sample October 8, 2:00 PM cancellation and send the offer to José.
3. Switch to **Demo Patient**, preview the acceptance, and confirm it.
4. Back in Provider, check the schedule, waitlist and Activity log; then try **Capacity & statistics** and the Day/Week/Month calendar.
5. Use **Reset demo scenario** (or reload) to start over and try decline or help.

## Run locally

From `frontend/` with Node 24 or 25: `npm ci`, then `npm run dev` to run the app, or `npm run lint`, `npm test` and `npm run test:e2e` (after `npx playwright install chromium`) to run the checks. Full instructions are in the [README](../README.md#run-locally).

## Feature status

**Working** runs in the browser today on deterministic synthetic data. **Simulated** looks real in the demo but is an in-browser simulation: no message is sent, no real appointment changes, and everything resets on reload. **Planned** is not built. Each Working or Simulated row cites a test title in `frontend/e2e/` or `frontend/tests/` that checks it.

| Feature | Status | Evidence (test title) |
|---|---|---|
| Public entry with no account, password or verification | Working | "public entry, login alias, direct role links and unknown routes never require credentials" |
| Provider sections, search, filters and empty states | Working | "all provider sections, search, empty state and filters" |
| Day/Week/Month calendar with P1–P4 priority indicators | Working | "urgent eligible patient is reviewed, explicitly accepts, and updates all calendar views" |
| Priority ranking with eligibility constraints and stable ties | Working | "priority ties use request date then stable ID, without mutating inputs" |
| Priority configuration (labels, order, enabled levels, default) | Working | "configuration validation, migration, custom labels/order and session reset" |
| Capacity and statistics dashboard (synthetic month near 90% occupancy) | Working | "monthly capacity, daily cancellation and priority reassignment recalculate immediately" |
| Capacity configuration and previous-month snapshots | Working | "configuration validates limits, supports resources, reset and previous-month snapshots" |
| English and Spanish interface | Working | "Spanish mode shows no leftover English across every demo state" |
| Puerto Rico time regardless of the browser's timezone | Working | "demo dates and times stay in Puerto Rico time in EN and ES" |
| Keyboard use and automated accessibility scans (axe, WCAG A/AA) | Working | "accessible semantics and contrast across demo states (en)" |
| "Press for presentation" link | Working | "opens a centered, named popup and keeps the demo state (en)" |
| Works offline after first load; the security policy blocks network requests | Working | "venue Wi-Fi drop: the scenario completes offline after first load" |
| Cancellation, offer and patient acceptance updating schedule, waitlist and activity log | Simulated | "explicit confirmation updates booking, waitlist and activity; reset restores state" |
| Patient replies (accept, decline, help) chosen with buttons | Simulated | "help permits a later response; decline preserves appointment; reload clears state" |
| One acceptance per offer | Simulated | "double activation of confirm applies the acceptance only once" |
| Staff booking, cancellation and reschedule in the capacity month | Simulated | "reschedule conserves occupancy across days and blocks stale or conflicting destination" |
| Saved data (backend database, data survives reload) | Planned | The FastAPI backend in `backend/` is not deployed; only `/api/health` exists. |
| Real SMS, WhatsApp or email messages | Planned | Not built. |
| AI help interpreting patient replies | Planned | Not built; the local model in `docker-compose.yml` is unused by the demo. |
| Offer expiry and automatic next-candidate offers | Planned | Not built. |
| Several offices and simultaneous users | Planned | Not built; each browser tab has its own state. |
| Production sign-in and access control | Planned | Not built; the demo roles are public by design. |

All patients, providers and appointments are fictional. Do not enter real patient information.
