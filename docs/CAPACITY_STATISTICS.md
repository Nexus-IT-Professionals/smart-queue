# Capacity and utilization demo

Open **Provider → Capacity** in the sidebar (page title **Capacity & statistics**). The generated workspace and its Day/Week/Month toggle share one selected date, resource filter, slot list and calculation module. The initial month is the current month in Puerto Rico. Use the calendar, date picker, arrows or trend bars to navigate; monthly trend bars drill into weeks, weekly bars into days.

The **guided cancellation demo** on the Overview remains independently replayable with its fixed October 8/22 fixtures and explicit Patient acceptance. Monthly operations use their own synthetic appointments/waitlist within the same root reducer and priority configuration; their statistics do **not** mix in the guided scenario's nine records. Monthly assignments are explicitly confirmed by demo staff, not sent to the separate guided Patient inbox. Neither workspace writes backend resources.

## Configuration and data

Expand **Capacity configuration & regenerate** to set weekdays, opening/closing times, duration, daily seats **per resource**, and 1–4 independent provider resources. Defaults: Monday–Friday, 08:00–18:00, 30 minutes, 20 seats, one resource. The cap cannot exceed `floor((end − start) / duration)`. A lower cap creates only the first X consecutive slots, leaving the rest of the operating window unbookable. Zero seats or no operating days is supported. No overnight hours, variable resource schedules or overlapping seats are modeled.

Applying changes requires reset confirmation and atomically regenerates the selected month. It never silently squeezes existing appointments into a smaller schedule. A month has `round(0.9 × daily seats)` occupied seats per operating day/resource; small capacities necessarily round. Availability times vary deterministically by date. Seeded cancellations, completed visits, fictional identities and P1–P4 staff-confirmed sample priorities are illustrative, not evidence of real past/future care. Four flexible synthetic waiting patients are generated per resource.

Generation with identical month/config yields identical data. Reload/global reset clears session edits; root state survives view/role changes. Switching generated months saves the prior month as a frozen comparison snapshot. Regenerating a month replaces its editable dataset; archived snapshots support comparison, not editable historic schedules. There is no cross-tab persistence or backend storage.

## Calculation definitions

All periods use `demo/capacity.ts`:

| Metric | Rule |
|---|---|
| Capacity | Sum configured seats × resources across operating dates in the loaded month. Resource filter uses only that resource. |
| Occupied | Scheduled + completed reservations; completed visits still consumed a slot. |
| Available | Capacity − occupied. Cancellation opens the existing seat, never adds another seat. |
| Occupancy / availability | Corresponding aggregate count ÷ aggregate capacity × 100; never average daily percentages. |
| Cancellations | Cancellation events attached to dates of the released slots. Repeated cancellation of the same already-open seat is ignored. A subsequent new reservation can have its own cancellation. |
| Scheduled denominator | Initial reservation episodes (including seeded cancellations) + new bookings/assignments. A rescheduled reservation moves its denominator contribution to the destination date, so it counts once across the combined period. Status completion does not increment it. |
| Cancellation rate | Cancellation events ÷ scheduled denominator × 100. A canceled booking and a new patient's replacement are distinct reservations, not duplicate slot records. |
| Eligible released slots | Release events with at least one compatible waiting candidate **at release time**. Eligibility remains a historical snapshot even after the queue changes. |
| Waiting-list fill rate | Eligible release events subsequently filled from the waiting list ÷ eligible release events × 100. An ordinary booking or reschedule does not count as a waitlist fill. |
| Successfully reassigned | All confirmed waiting-list assignments, including previously unused slots. Therefore this may exceed the numerator of release fill rate. |
| Rescheduled | Successful movements, attributed to the destination date. They free the source and reserve the destination atomically. |
| Completed | Currently completed reservations in the selected period. |
| Waiting list / priorities | Current active monthly waiting-list snapshot, filtered by resource. It is not a historical count of patients who waited during that period. |
| Trends | Daily aggregate counts for weeks; month trends group only that month's dates into Monday-based weeks. Busiest/least busy use occupancy ratios; ties select earliest date. |
| Previous month | Compare occupancy with the previous calendar month's frozen session snapshot, using its own configuration and selected resource. Not a claim of like-for-like clinical performance. |

Every zero denominator displays 0%, accompanied by the counts. Unknown months contribute no inferred capacity and show a partial-coverage notice; a boundary week includes only loaded dates. Closed weekdays contribute zero. Current-month numbers are live session state, not immutable historical reports. Changing an appointment recomputes all affected periods immediately.

## Scheduling boundaries

Only pre-generated seats can be reserved, so capacity cannot increase through booking. Resource overlap guards and patient compatibility checks reject conflicts; stale/repeated actions are ignored. Moving a booking requires an open destination on the same provider/resource and compatible duration/type. Completed visits cannot be canceled or moved in this POC.

Eligible waiting patients must match office, provider, visit type, duration, date/time constraints and have no conflicting booking. Sort by configured priority, request date, then stable ID. Assignment removes the waiting entry once. Disabled priority levels migrate safely to the enabled default, including generated data. Priority edits require staff confirmation; no AI infers urgency. **Scheduling support is not emergency medical assessment.**

## Three-minute rehearsal

1. Open Provider → Capacity. Show the refill count, Month KPIs and resource filter (20 seconds).
2. Select an operating day and switch to Day. Select a scheduled visit, check staff confirmation, cancel it. Occupied decreases; cancellations and availability increase (30 seconds).
3. Review the ranked waiting candidates. Confirm the assignment. Occupancy recovers, waiting count decreases, release fill rate updates (30 seconds).
4. Switch Week/Month and click a trend bar to demonstrate synchronized aggregation (20 seconds).
5. Optionally book an unused seat, mark a visit complete, or choose an open reschedule destination. Expand configuration to demonstrate a second resource; confirm regeneration (30 seconds).

To replay a predictable month, regenerate **2026-10** with defaults: 22 operating days, 440 capacity, 396 occupied, 44 available. Baseline release fill rate is honestly 0%, not an invented conversion claim.

## Validation and remaining scope

Automated coverage includes deterministic generation, capacity bounds, weekends, empty schedules, leap months, partial weeks, multiple resources, conflict/duplicate guards, cancellation denominator, priority selection, assignments, atomic rescheduling, snapshot retention, configuration validation, browser navigation, live KPI updates, English/Spanish accessibility scans and mobile overflow. See the latest results in `PENDING_TASKS.md`.

Manual owner acceptance, real device touch/VoiceOver, Firefox/WebKit, production concurrency and durable historical audit snapshots remain outside verified POC scope. No dependencies, credentials, authentication barriers or backend endpoints were added.
