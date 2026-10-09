# UI/UX Enhancements: Smart Appointment Queue

**Reviewed:** 2026-10-09, live demo at https://smart-queue-demo.vercel.app (build from commit `30b03d8`)
**Goal:** a judge understands what Smart Queue does, and sees it work, within 60 seconds. Keep the interface simple without losing the useful parts.
**Yardstick:** the five Devpost judging criteria (Healthcare Impact & Local Relevance, Quality of the Idea, Prototype Execution, Feasibility & Responsible Design, Usability & Clarity). The audience is both judges exploring the link on their own and a teammate presenting live.
**Scope:** desktop 1440×900, mobile 390×844, English and Spanish, every Provider and Patient state in the guided flow, Capacity & statistics, and the presentation deck.
**Method:** a scripted Playwright walk through 17 states per viewport, each also captured in Spanish, followed by a visual review of every screenshot. Each state was checked with axe-core (WCAG 2.0/2.1/2.2 A and AA) and probed for horizontal overflow, tap targets, font sizes, word count, page length, console errors and failed requests. See [Appendix A](#appendix-a-how-this-review-was-done).

Nothing in the application was changed. This file is the only addition to the repository.

---

## Executive summary

The app is solid: **0 accessibility violations, 0 console errors, 0 failed requests, about 0.6 s to interactive, and no layout breaks in either language.** The polish problem is **storytelling, not quality**. A judge has to read a lot, and the most important moment, *an empty slot gets filled by the right patient*, is hard to see.

The five changes with the most payoff, in order:

1. **One persistent "Demo guide" stepper** (Cancel → Offer → Patient accepts → Result) with the next button always visible, in both roles (G1).
2. **Make the state change visible:** an "Offer sent · waiting for Elena" row, then a highlighted "Just filled" row and a result card (G2, G3).
3. **Fix the dead end at the climax:** after Elena confirms, the Patient page should say "Done" and offer "See it in Provider view →" (G4).
4. **Cut the noise:** fewer disclaimers (21–26 per screen today), no repeated "P3 · Normal" badge on every row, and no marketing cards inside a working tool (H1–H4).
5. **Mobile entry:** neither "Continue" button appears on the first phone screen. Move the two role buttons above the fold (M1).

Items 1–5 are mostly copy, layout and state changes on existing components. Together they are about one day of focused work; items 2, 3, 4 and 5 are each about an hour.

---

## The 60-second judge test

| Second | Today | After the Tier 1 changes |
|---|---|---|
| 0–10 | Entry page: a headline, a 3-step list to memorize, two cards. On a phone, no button is on screen. | Same page with one main button, **"Start the 2-minute demo"**, and the two role buttons beside it. |
| 10–25 | Provider overview: about 460 words, 2.4 screens long, "A clearer day. Better access." headline, a donut, a marketing card, a full table. The Step 1 button is visible, but so are 7 other buttons. | Stepper at the top: **① Cancel → ② Offer → ③ Patient accepts → ④ Result**. One highlighted button. The schedule row that will change is highlighted. |
| 25–40 | After cancel: an unstyled candidates block appears, and the step text loses its number. After offer: the 2:00 PM row still says "Open slot". | The row changes from **Open slot → Offer sent to Elena (waiting)**. The stepper moves to ③ and its button switches role. |
| 40–55 | Patient accepts. The offer card still asks "Does an earlier visit work for you?" and the success message is small. There is no link back. | A clear success state: **"You're booked: Thursday, October 8 · 14 days sooner"**, plus **"See what the office sees →"**. |
| 55–60 | Provider: Elena's row looks like every other row. The old "Selected patient" banner is still there. | A **result card**: "Open slot filled · Elena moved 14 days earlier · Waitlist 4 → 3 · 3 steps logged". The row is highlighted "Just filled". |

---

## What already works (keep it)

- **Accessibility:** axe-core found no WCAG A/AA violations in any of the 34 captured states (17 per viewport, English). Focus moves to the confirmation panel after "Preview acceptance". There is a skip link.
- **Bilingual quality:** the Spanish copy is natural (for example "¿Le conviene una cita más cercana?"), not a literal translation. It runs about 15% longer and still causes no overflow or wrapping problems.
- **Speed and reliability:** about 0.6 s to DOMContentLoaded, no console errors, and it works offline after the first load.
- **Responsible design is clear:** the patient must confirm, there is no AI triage, and urgency is staff-confirmed. Judges score "Feasibility & Responsible Design", so keep this message. It just needs to appear once per screen instead of four times.
- **The patient offer card** is the best screen in the app: one clear question, one green slot, three plain actions.
- **The presentation deck** is polished and character-driven, with a consistent footer and speaker controls.

---

## Enhancements

**Effort:** S = under 1 hour · M = 1–4 hours · L = more than 4 hours.
**Impact on judges:** ★★★ changes the first impression · ★★ makes the story clearer · ★ polish.
Item IDs are grouped by theme: **G** guided story, **H** hierarchy and noise, **V** visual consistency, **D** data credibility, **M** mobile, **P** presentation, **C** copy.

### Tier 1: do before submission (highest impact per hour)

#### G1. One persistent "Demo guide" stepper ★★★ · M
- **Where:** the "Try the appointment queue" card (Provider pages) and the Patient page, in `StaffWorkspace.tsx` and `PatientWorkspace.tsx`.
- **Evidence:**
  - The card changes wording on every step, and the numbering is inconsistent. It says "Step 1: Confirm…", then "Review eligible candidates below…" with no number, then "Step 3: Switch to Patient…", then "Complete: …".
  - The Patient page has no guide card at all.
  - The entry page lists 3 steps that the judge must remember.
- **Proposal:** replace the card with a compact horizontal stepper that looks the same on every page, in both roles:

  ```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │ DEMO GUIDE   ① Cancel ─── ② Offer ─── ③ Patient accepts ─── ④ Result    │
  │              ✓ done        ● now        ○                     ○          │
  │ Elena is next in line for the 2:00 PM slot.   [ Send offer to Elena → ]  │
  └──────────────────────────────────────────────────────────────────────────┘
  ```

  - One sentence and one primary button per step.
  - The step ③ button switches to the Patient view itself, as "Open Demo Patient" already does.
  - At ④ the button becomes "Replay demo" (reset).
  - Use the same 4 labels on the entry page, so judges see the map before they start.

#### G2. Show the offer as a pending state in the schedule ★★★ · S
- **Where:** the daily schedule table, after "Send demo offer to Elena".
- **Evidence:** after the offer is sent, the 2:00 PM row still reads "Available appointment · Open slot". The only clue is a "Selected patient: Elena Morales" banner far from the row.
- **Proposal:** change the row's status chip to **"Offer sent · Elena M. · waiting"**, in amber with a small clock icon. This is the "one patient at a time" rule shown on screen.

#### G3. A result moment on the Provider side ★★★ · M
- **Where:** the Provider overview after the patient confirms.
- **Evidence:**
  - Elena's 2:00 PM row looks the same as every other row.
  - The "Complete:" card offers "Review activity". The blue card's button still says "Explore waitlist" while its text says to review the activity log.
  - The old "Selected patient: Elena Morales" banner and the "Canceled · Adrián López … Historical cancellation" line are still showing.
- **Proposal:**
  - **Result card:** replace the guide with a short result card, built only from demo state:

    ```
    ✓ Open slot filled in 3 steps
    Elena Morales · Oct 22 → Oct 8 (14 days sooner) · Waitlist 4 → 3
    [ See the activity log ]   [ Replay demo ]
    ```

  - **Highlight the row:** give Elena's row a "Just filled" chip and a soft green background, with a 1-second highlight animation that respects reduced motion.
  - **Clear stale UI:** remove the "Selected patient" banner once the flow is complete.

#### G4. Close the dead end on the Patient page ★★★ · S
- **Where:** `PatientWorkspace.tsx`, after "Confirm preview".
- **Evidence:**
  - The appointment card updates to Oct 8, but the offer card below it still asks "Does an earlier visit work for you?" with a "14 days earlier" chip.
  - The success message is small green text inside that card.
  - The only next action is "Restart demo scenario". There is no route back to the Provider view, which is step 4 of the story.
- **Proposal:**
  - Replace the offer card with a success state: a large check, **"You're booked for Thursday, October 8 · 2:00 PM"**, and "14 days sooner. Your October 22 visit was released for someone else."
  - Make the primary button **"See what the office sees →"** (switches to Provider) and the secondary one "Replay demo".

#### H1. Say "this is a demo" once per screen, not four times ★★ · S
- **Evidence:**
  - The demo / disclaimer vocabulary ("demo", "synthetic", "fictional", "simulated", "sample", "this browser", "no real", "not emergency") appears **21 times on the entry page, 26 on Provider and 25 on Patient**.
  - On the Provider overview it shows up in many places: the "Demo / POC Mode" strip, "fictional identity" (twice), the yellow safety banner, the "Sample data" chip, the sidebar card "A safe space to explore", "Standalone demo · No API connection", "Marked complete in the sample", "Current sample waitlist", "Showing 9 of 9 sample slots", and the footer.
  - The Activity log adds "This browser only" to every event, plus "Session only" and "Illustrative events, not a persisted audit log".
- **Proposal:**
  - **Keep:** the thin top strip ("Demo · fictional data · nothing leaves this browser") and the yellow safety banner, in a smaller one-line version and only on screens where priority or urgency is visible.
  - **Remove:** the sidebar "safe space" card, "fictional identity" after each name, "sample" in KPI captions, and the per-event "This browser only" chips.
  - **Responsible-design message:** this does not weaken it. It makes the one remaining banner more noticeable.

#### H2. Remove the repeated "P3 · Normal" badge ★★ · S
- **Evidence:**
  - Every schedule row (9 of 9) and every waitlist row shows the same bold blue "P3 · Normal" chip. It is the most prominent element in each row, stronger than the status.
  - The Patient profile also shows "P3 · Normal" to the patient.
- **Proposal:**
  - Show a priority chip only when it is **not** the default (P1/P2), as the Capacity view already does with color.
  - In the schedule, make **status** the strongest chip.
  - Hide the priority from the patient-facing view. Patients should not see an internal triage label.

#### H3. Plain titles instead of slogans ★★ · S
- **Evidence:** the H1s are "A clearer day. Better access.", "The next opportunity for care", "Every change, in view", "Your care, a little closer." They sound good, but a judge who lands on a page cannot tell what it is.
- **Proposal:** use functional titles, with the slogan as an optional subtitle or removed: "Today's schedule", "Waitlist", "Activity log", "My appointment". This also shortens the Spanish strings.

#### H4. Remove the marketing card and donut from the working view ★★ · S
- **Evidence:** the overview has a donut chart (repeating the 4 KPI tiles) and a large blue card ("A little planning. A better patient day.") whose button ("Explore waitlist") is a third route to the waitlist.
- **Proposal:**
  - Drop both from the overview. That frees the top half of the screen for the stepper, the 4 KPIs and the schedule.
  - Move the "Patient choice comes first" message into the stepper's step ③ sentence.

#### M1. Mobile entry: buttons above the fold ★★★ · S
- **Evidence:**
  - At 390×844 the header (logo, role switcher, language switcher) and the sidebar links take about the top 280 px.
  - The first "Continue as…" button starts around 1,080 px down, so **no call to action is visible on the first screen**.
  - The page is 1.8 screens long.
- **Proposal:**
  - Put the two role buttons (or the single "Start demo" button) directly under the headline, and move the 3-step explanation below them.
  - On mobile, collapse the role and language switchers into one compact row or a menu.

#### C1. Consistent button verbs ★ · S
- **Evidence:**
  - "Reset demo scenario" and "Restart demo scenario" do the same thing.
  - "Preview acceptance" leads to "Confirm preview". Judges may wonder whether a preview is real.
  - "Capacity & statistics" toggles to "Guided cancellation demo" in the same place.
- **Proposal:**
  - Use one verb for reset everywhere: "Replay demo".
  - Patient flow: "Accept earlier visit" → "Yes, move my appointment" / "Go back".
  - See V3 for the capacity toggle.

### Tier 2: if there is time (clarity and credibility)

#### V1. Style the "Eligible candidates" panel like the rest of the app ★★ · M
- **Evidence:**
  - After a cancellation, the candidates block uses large default body text, a native unstyled `<select>`, and a plain numbered list.
  - The "Canceled · Adrián López…" line under the Day/Week/Month tabs has the same problem.
  - These are the only parts of the overview that look unfinished, and they appear at the key moment.
- **Proposal:**
  - Render candidates as 2 small cards ("1 · Elena Morales · Afternoons 1–4 PM · waiting since Oct 5 · ✓ fits the slot"), with a radio choice instead of the dropdown.
  - Add a one-line "why ranked first" reason. This is the product's core logic, so make it visible.

#### V2. One visual language across pages ★★ · M
- **Evidence:**
  - Capacity & statistics uses green progress bars, plain metric cards with no icons, raw labels like "RESOURCE-1", and native selects.
  - The Waitlist uses unstyled `<details>` disclosures ("Priority configuration") and large default text for each patient's reason.
  - The Overview, by contrast, is polished.
- **Proposal:**
  - Reuse the Overview's KPI tile, chip and table components on Capacity and Waitlist.
  - Replace "RESOURCE-1" with "Dr. Rivera".
  - Style the disclosures as the existing cards with a chevron.

#### V3. Make Capacity a real page, not a hidden toggle ★★ · S
- **Evidence:**
  - "Capacity & statistics" is a button inside the Overview that replaces the page body. The button then reads "Guided cancellation demo".
  - It is not in the sidebar, so judges who use the navigation never find it, and those who do find it have no obvious way back.
  - My first scripted pass looked for it in the navigation and failed, as a first-time judge would.
- **Proposal:** add "Capacity" as a fifth sidebar item with its own title, and remove the toggle button from the Overview header.

#### D1. Capacity data that tells a story ★★★ · M
- **Evidence (fresh session):**
  - Every weekday in October shows exactly "18/20 · 90% occupied · 2 available · 2 high-priority eligible · 1 Canceled".
  - Every weekly trend bar is exactly 90.0%.
  - The summary reads "Busiest day: Thursday, October 1 · Least busy day: Thursday, October 1".
  - The two outcome metrics judges care about, **"Waiting-list fill rate 0.0%"** and **"Successfully reassigned appointments 0"**, are both zero.
  - The month uses different patients (Bruno Cruz, Clara Soto…) from the guided October 8 schedule (María Rodríguez, Elena Morales…), so it looks like a second, unrelated app.
- **Proposal:**
  - Seed the month with varied, believable numbers: some days at 75%, some full, a few cancellations already refilled. The fill rate and reassigned count then start at a non-zero "before Smart Queue" vs "with Smart Queue" contrast.
  - Make the guided flow's refill increase "Successfully reassigned" by one. I did not check whether it already does; verify.
  - Lead the page with the one KPI that sells the idea: **"Cancelled slots refilled: X of Y"**.
  - Fix the busiest/least-busy tie text. When all days are equal, hide the line.

#### D2. Overview and Schedule are near duplicates ★★ · S
- **Evidence:** both pages show the same Day/Week/Month control, the same 4 KPIs and the same full daily table. The Overview also shows a waitlist preview, which repeats the Waitlist page.
- **Proposal:**
  - Make the **Overview** the guided story: stepper, 4 KPIs, today's table, short waitlist.
  - Make **Schedule** the full calendar: Week and Month, filters and search.
  - Remove the date input ("10/08/2026") from the Overview header. It repeats the "← Thursday, October 8 →" navigator.

#### D3. Activity log as a readable timeline ★★ · S
- **Evidence:** the events are titled "Demo event 1 / 2 / 3", with no time and no type icon, and each has a "This browser only" chip. The page also shows the "Try the appointment queue" card with a "Review activity" button, which links to the page you are on.
- **Proposal:**
  - Title each event by what happened, with a time and an icon: "2:01 PM · ✕ Slot released: Adrián López cancelled 2:00 PM", "2:02 PM · ✉ Offer sent to Elena Morales", "2:03 PM · ✓ Elena accepted: moved Oct 22 → Oct 8".
  - Remove the guide card from this page.

#### M2. Mobile schedule table ★★ · S
- **Evidence:** at 390 px the schedule table is cut off at the right edge ("Foll…", "Con…"). The Visit Type and Status columns need a horizontal scroll that nothing indicates.
- **Proposal:**
  - Under about 600 px, render each appointment as a stacked card: time, name, status chip.
  - Or keep 3 columns (time, patient, status) and fold the visit type under the name.

#### M3. Mobile page length ★ · S
- **Evidence:**
  - The Provider overview is 4.3 screens long on mobile, and 5 after a cancellation.
  - Capacity is 8.7 screens on mobile and 4.2 on desktop.
- **Proposal:** H4 and D2 shorten the Overview by about 40%. For Capacity on mobile, collapse "Select a day" into a 7-day strip and keep the month grid behind a "Show month" toggle.

#### P1. Align the presentation with the product ★★ · S
- **Evidence:**
  - Slide 9 names "Dr. **Carlos** Rivera"; the app uses "Dr. **Alex** Rivera".
  - The story follows María, Ana and José; the demo uses Elena, Adrián and Ana. The slides footnote this, but a judge who goes from the deck to the demo meets different names.
  - The product screenshots on slides 7–9 are too small to read on a projector.
- **Proposal:**
  - Use one name for the provider.
  - Make the demo's patient match the story (for example, José takes the slot María released). Otherwise, add one line on slide 7: "In the demo you'll play Elena".
  - Crop the screenshots to the one card that matters (the stepper or the result card), at 2–3× their current size.

#### P2. Presentation on a phone ★ · S
- **Evidence:** at 390×844 the slide fills about 25% of the screen height, with large empty dark areas above and below.
- **Proposal:** in portrait, show a "Rotate your phone for the best view" hint. You could also let the slide use more height, with controls overlaid.

### Tier 3: after the hackathon

| ID | Enhancement | Why it matters |
|---|---|---|
| F1 | **Offer countdown and automatic next candidate** (simulated 2-minute timer, then "Offer passed to Camila") | It shows the full queue mechanic, which is the main idea in the product name. |
| F2 | **Patient message preview**: a phone-style SMS/WhatsApp bubble in Spanish with "Responda SÍ para aceptar" | Puerto Rico patients book by phone and text. It makes the channel concrete without building messaging. |
| F3 | **Sound and motion for state changes** (respecting reduced motion) | Live demos benefit from a visible "something happened" cue that the audience can follow. |
| F4 | **Split-screen mode**: Provider and Patient side by side on one screen | Removes role switching from the live demo, so both sides change together on screen. |
| F5 | **Design tokens audit**: one type scale (the probe found text as small as 8 px on desktop and 6 px on mobile, with about 90–125 text nodes under 12 px per Provider screen) | Readability on projectors and phones, and consistency across the four pages. |
| F6 | **Larger touch targets**: most controls are under 44 px tall on mobile (24 of 25 on the Provider overview). They pass WCAG 2.2's 24 px minimum, but 44 px is the comfortable size. | Front-desk staff often use tablets. |

---

## Proposed Provider overview (after Tier 1)

```
┌ smartqueue · Isla Care ─────────── [Provider | Patient]  [EN | ES]  Replay demo ┐
│ ● Demo · fictional data · nothing leaves this browser                            │
├────────────┬─────────────────────────────────────────────────────────────────────┤
│ Overview   │ Today's schedule · Thursday, October 8                              │
│ Schedule   │ ┌ DEMO GUIDE  ✓Cancel ── ●Offer ── ○Patient accepts ── ○Result ───┐ │
│ Waitlist 4 │ │ Elena is next in line for the 2:00 PM slot.  [Send offer →]     │ │
│ Activity   │ └─────────────────────────────────────────────────────────────────┘ │
│ Capacity   │ [ 9 slots ] [ 3 completed ] [ 1 open ] [ 4 waiting ]                │
│            │ ┌ Candidates for 2:00 PM ────────────────────────────────────────┐ │
│ ▶ Slides   │ │ (●) 1 Elena Morales · Afternoons 1–4 · waiting since Oct 5     │ │
│            │ │ ( ) 2 Camila Soto  · Afternoons 2–5 · waiting since Oct 7      │ │
│            │ │ Why: fits the time window; oldest request at the same priority │ │
│            │ └────────────────────────────────────────────────────────────────┘ │
│            │ 2:00 PM  Open slot ── ⏳ offer pending                ◀ highlighted │
│            │ 8:30 AM  María Rodríguez   Follow-up     Scheduled                  │
│            │ …                                                                   │
│            │ ⚠ Scheduling support only. Urgency is set by qualified staff.       │
└────────────┴─────────────────────────────────────────────────────────────────────┘
```

---

## Suggested order of work

| Step | Items | Estimated time | Why this order |
|---|---|---|---|
| 1 | G2, G4, C1, H3 | about 1.5 h | Copy and state-chip changes with the biggest clarity gain and little risk. |
| 2 | G1, G3 | about 3 h | The guided story: stepper plus result moment. |
| 3 | H1, H2, H4, M1 | about 2 h | Cut the noise; fix the first phone screen. |
| 4 | P1 | about 30 min | Make the deck and the product say the same names. |
| 5 | V1, V3, D1, D3 | about 4 h | Credibility of the deeper screens if judges explore further. |
| 6 | D2, M2, M3, P2, V2 | as time allows | Structure and mobile polish. |

The existing tests assert many current strings. For example, "Preview acceptance" appears in 7 test files, "Reset demo scenario" in 5, and the "A clearer day" title in 2. Budget time to update those assertions alongside the copy changes. Also re-run `npm run rehearse` before redeploying.

---

## Typography system

Added 2026-10-09 after the Tier 1 work. Font sizes had grown screen by screen. Phones used *smaller* text than desktop, and a fifth of the interface was below 12 px.

| Measured on rendered screens | Before | After |
|---|---|---|
| Distinct font sizes (desktop / mobile) | 17 / 17 | 8 / 7, plus the logo |
| Text elements under 12 px (desktop / mobile) | 401 / 440 | 0 / 0 (only the logo tagline, 10 px on desktop and hidden on phones) |
| Smallest text (desktop / mobile) | 8 px / 6 px | 12 px / 12 px |
| Font weights | 8 (350–750) | 4 (400, 500, 600, 700), plus the logo |
| axe WCAG A/AA violations | 0 | 0 |

**The scale** is defined as tokens in `frontend/src/styles.css` (`:root`). It is set in rem, so text follows the browser's font-size setting.

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 12 px | Captions, badges, table headers, uppercase eyebrows |
| `--text-sm` | 13 px | Secondary text, form labels, table cells, nav on small screens |
| `--text-base` | 14 px | Body, buttons, names and times in tables |
| `--text-md` | 16 px | Lead text under the page title, card titles, the demo guide sentence, form fields on phones |
| `--text-lg` | 18 px | Panel titles (h2) |
| `--text-xl` | 22 px | Card headlines ("You're booked for…") |
| `--text-2xl` | 28 px | Figures (counters, calendar tile) |
| `--text-3xl` | 36 px | Page title (scales down to 28 px on phones) |

**Rules:**
- Nothing below 12 px. Uppercase labels are 12 px, weight 600, with 0.06–0.08em letter spacing.
- Phones do not shrink body text; only the page title scales down. Form fields are 16 px on phones, so iOS does not zoom the page when one is tapped.
- The page title is always larger than any figure. Before, the counters and the H1 were both 35 px.
- Line heights: 1.2 for headings, 1.35 for UI labels, 1.5 for paragraphs.
- Figures use tabular numbers, so times and counts line up and don't jitter when they change.

**Format fixes made at the same time:**
- Counters read "9", not "09", and the calendar tile reads "8", not "08".
- The offer recipient list says "José Pérez · P3 · waiting since Oct 4" instead of an ISO date.
- On the entry page, each step's name sits on its own line above its sentence.
- On phones, the navigation is a 2×2 grid. The duplicate date field and the second line of the demo notice are hidden, so the demo guide's button stays on the first screen.

---

## Not verified / needs input

- **"Skip to main content" overlay:** resolved, not a bug. Full-page screenshots draw fixed-position elements relative to the scroll position. In the real viewport the link stays hidden above the top of the screen (measured at −59 px) while focus is on the confirmation panel.
- **Refill in capacity metrics:** I did not check whether completing the guided flow increases the Capacity "Successfully reassigned" metric (see D1).
- **Real devices:** I did not test real touch devices, screen readers or projector color rendering. The repo's own `SCREEN_READER_CHECK.md` already tracks screen-reader testing.
- **Header avatar:** I couldn't tell whether the "SQ" avatar in the header does anything. If it's decorative, consider removing it.

---

## Appendix A: how this review was done

The method combines the two earlier reviews (legal-com_v3 and content-engine) and fills the gaps they had:

1. **Scripted walker** (based on legal-com's `audit.py` `record_page()` pattern):
   - Runs with Playwright 1.64 from `frontend/node_modules`: one browser context per viewport, and the guided flow driven by the same role-based selectors as `e2e/demo.spec.ts`.
   - At every state, saves a full-page screenshot, switches to Español, saves the Spanish twin, and switches back.
2. **Probes per state:**
   - axe-core via `@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag22aa`.
   - Horizontal overflow (`scrollWidth > innerWidth`).
   - Interactive elements under 24 px and under 44 px.
   - Smallest computed font size, and the count of text nodes under 12 px.
   - Word count in `<main>` and page length in screens.
   - Buttons above the fold.
   - Headings.
   - Console errors, page errors and failed requests.
3. **Visual review** of every screenshot, plus a contact sheet of all 12 presentation slides. Each finding above cites what was seen or measured.
4. **Format:** IDs grouped by theme, impact against the judging criteria, effort S/M/L, and an implementation order. This follows the earlier reviews' tiered, prioritized format.

Screenshots and raw metrics were kept outside the repository, in a temporary session folder, as requested. To repeat the review after the fixes, ask for the same walker to be run again.

### Key measurements

| State (desktop) | Words in main | Screens tall | Buttons/links/inputs | axe violations |
|---|---|---|---|---|
| Entry | 184 | 1.0 | 10 | 0 |
| Provider overview | 463 | 2.4 | 25 | 0 |
| After cancellation | 555 | 2.8 | 26 | 0 |
| Waitlist | 352 | 2.1 | 48 | 0 |
| Capacity & statistics | 888 | 4.2 | 24 form fields | 0 |
| Patient offer | 256 | 1.2 | 12 | 0 |
| Activity log (after flow) | 193 | 1.2 | 14 | 0 |

| Check | Desktop 1440 | Mobile 390 |
|---|---|---|
| DOMContentLoaded | 621 ms | 499 ms |
| Console errors / failed requests | 0 / 0 | 0 / 0 |
| Horizontal page overflow (EN and ES) | none | none (the table clips inside its container, see M2) |
| Smallest text | 8 px | 6 px |
| "Continue" buttons on the first screen of the entry page | 2 | **0** |
| Spanish vs English length | about +15% words | about +15% words |
