# Provider calendar and scheduling priorities

Implemented for the **synthetic, credential-free, single-browser POC**. Priority supports scheduling coordination, not diagnosis, medical urgency inference, or emergency assessment. No AI runs. Only the Provider workspace exposes priority/configuration controls; this is a demo role convention, not production authorization or a credential check. Qualified-staff review is an explicit demo confirmation, not verification of a real qualification.

## Calendar

Provider → Overview or Schedule → **Day / Week / Month**. Day retains the existing filtered appointment table. Week shows seven days starting Monday; Month shows a six-week grid including adjacent-month days. Previous/Next moves one day, week, or month, respectively. Selecting a day updates the shared date control, metrics, and appointment table. Month navigation clamps dates safely at month ends, including leap years and year rollover.

The sample has nine slots on October 8, 2026 and the four waiting patients’ original appointments on October 22. Other dates correctly have no demo capacity. Counts show scheduled, completed and open slots; original cancellations remain separate historical records, so they do not create duplicate bookable capacity. The history remains visible after the released slot is filled. Month/Week cells show distinct eligible P1/P2 patients **only for real open sample slots that day**. Color is accompanied by text; P1/P2 refers to the stable level IDs even if staff customize labels/order. Mobile calendars scroll horizontally inside a keyboard-focusable region, with no page overflow.

## Configuration and priority assignment

Provider → Waitlist → **Priority configuration**:

| ID | Default label / indicator | Default order | Description |
|---|---|---:|---|
| P1 | Urgent / red | 1 | Patient requires prompt attention |
| P2 | High / orange | 2 | Patient needs an earlier appointment |
| P3 | Normal / blue | 3 | Standard waiting-list request |
| P4 | Low / gray | 4 | Flexible scheduling request |

Staff may edit labels (1–32 characters), descriptions (1–160), one of four contrast-tested indicator palettes, unique order numbers 1–4, enabled levels, and the default. Lower order numbers rank first. P1 cannot be the default: urgent scheduling status requires an individual staff confirmation. At least one non-urgent level must remain enabled and the default must be enabled. Invalid settings leave current configuration unchanged. Custom text stays as entered; shipped labels/descriptions and controls have EN/ES translations.

Disabling a level atomically moves existing records at that level to the enabled default and records a configuration event. Re-enabling does not resurrect the old assignment. Explicit patient assignments override the default. There is no patient-enrollment feature; the default currently governs fallback and disabled-level migration.

Each waiting entry shows synthetic patient-reported context, availability, request date, and priority. Choose a level, check **Qualified staff review confirmed (demo)**, then **Save priority**. Merely selecting a value does not change the queue. Every priority update requires confirmation; no condition text is interpreted algorithmically. A saved change updates the sorted list and badges immediately and appends an activity entry.

## Deterministic selection and consent

1. Staff confirms the existing sample October 8, 2:00 PM cancellation (SQ-006). The released slot becomes available; the old cancellation is history.
2. Filter waiting patients by matching office, provider, consultation type and sufficient duration; the full slot must fit their time window and allowed dates, on or after their request date and strictly before their current booking date.
3. Exclude overlaps with an existing scheduled/completed appointment for **either that patient or that provider**. Touching endpoints do not overlap; canceled/open records do not block. Insurance and free-text conditions are never ranking inputs.
4. Sort eligible patients by configured priority order, then oldest ISO request date, then stable record ID. Sorting does not mutate fixtures. The assistant sees the eligible list and an initial suggestion; an explicit choice of another eligible candidate is allowed.
5. Staff confirms the selected offer. This does **not** book the slot. Only one offer is active. Priority/configuration changes never silently replace its recipient.
6. Patient view follows the selected synthetic recipient. The patient previews and explicitly accepts. Compatibility/conflicts are rechecked, then one reducer transition fills SQ-006, releases that patient's old October 22 slot, removes their waiting entry, and records acceptance. Repeated or out-of-order actions are ignored.
7. Decline keeps the old appointment and the opening. Help keeps the pending offer. Automatic next-candidate offers and expiry remain unimplemented; reset to replay.

Source path: `StaffWorkspace.tsx` → `demoReducer` in `demo/data.ts` → `eligibleCandidates` / `eligible` in `demo/scheduling.ts` → `PatientWorkspace.tsx` confirmation → reducer acceptance → calendar/waitlist derived views. No network or backend write is part of this path.

## Storage and scope

The existing app stores appointments/queue state in its root React reducer. Priorities, configuration and the selected patient now use that same in-memory session: role navigation and language changes retain them; **reload or Reset demo scenario restores defaults**. No health/context data is written to localStorage, a database, or an API. The language preference remains the only existing persisted browser preference. Separate tabs do not share state. No backend or authentication change is necessary for this static POC.

This protects against duplicate transitions in one browser, not concurrent production bookings. Real persistence, server-side permissions, durable audit records, transactions and multi-user conflict handling remain Post-POC requirements. General cancellation/reassignment of arbitrary slots is also future work; this implementation exercises the existing single cancellation scenario with multiple candidate choices.

## Manual demo scenarios

1. **Normal:** reset → Provider → confirm cancellation. Nicolás is morning-only, so he is excluded even if staff raises his priority. José, Elena and Camila are P3; José's October 4 request precedes Elena's October 5 and Camila's October 7 requests. Send José’s offer and accept in Patient view.
2. **Urgent scheduling:** reset → Waitlist → change Camila to P1 → check the staff-review box → save. Cancel the sample slot. Camila is first among eligible candidates; confirm her offer. Patient view must show Camila. Preview/confirm, return to Schedule, and find her P1 badge at October 8, 2 PM. October 22 now has an open 3 PM slot and no Camila booking.
3. **Disable safely:** set Camila to P1, open configuration, disable P1, retain enabled P3 as default, save. Camila becomes P3; José wins the older-request tie. Try duplicate order numbers or disabling the default: saving must fail without changing active settings.
4. **Calendar:** navigate Month October → November → October. Pick October 8 and October 22, switch Week and Day. Completed and historical canceled records remain distinguishable; empty days do not imply availability.
5. **Consent/reset:** send an offer, preview then Go back; the original booking must remain. Try decline/help, role navigation, English/Español, and reload. Reload intentionally restores initial priorities, bookings and configuration.

## Automated validation

`tests/scheduling.test.mjs` covers ordering/ties, configuration validation/migration, staff-confirmation guard, compatibility, date/time bounds, patient/provider overlaps, stale acceptance rejection, single booking movement, cancellation history, reset and leap/year-boundary navigation. `e2e/scheduling.spec.ts` covers urgent versus normal behavior, staff and patient confirmation, custom configuration, safe migration, session semantics, all calendar modes, EN/ES labels, mobile/tablet/desktop layout and axe checks. Existing workflow, accessibility, language, release guard and runtime suites remain part of validation.

Validation on October 9, 2026: `npm run lint` passes without warnings; `npm run build` and `npm run build:demo` pass (static-only artifact verification included); `npm test` passes **63/63**; the full Chromium suite passes **86/86**. Backend smoke test: **1 passed**, with the existing Starlette/HTTPX deprecation warning. Desktop and narrow-calendar captures were visually reviewed. Native screen-reader speech, actual device touch interaction, and user manual acceptance remain unverified. No dependencies, backend code, deployment settings, or authentication barriers changed.

Integration validation also covers expanded priority configuration with WCAG text spacing at 320px and 1280px in both languages. Descriptions use multiline fields; custom configuration values remain staff-authored when switching languages.
