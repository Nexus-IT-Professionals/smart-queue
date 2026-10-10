# Smart Queue — presentation plan

Prepared October 9, 2026 against application commit `8fcc33e`. The deck is a standalone artifact; no application business logic changed. Astra was not available as a callable tool in this session. The implementation uses local HTML/CSS/JavaScript, existing Playwright, and original AI-generated artwork.

## Narrative and timing

**Problem:** a cancelled appointment and a waiting patient remain disconnected. **Why:** manual coordination consumes attention and can leave capacity unused. **Solution:** staff confirms, a patient explicitly chooses, and a shared local workflow updates. **Impact:** clearer choices, coordination, and schedules; benefits require pilot measurement.

The five questions are answered by slides 2 (problem/why), 6 (why Smart Queue), 7–9 (how), and 10/12 (impact). “Why now” is on slide 2. “Why AI” is on slide 11: no AI runs in this POC. Potential EN/ES reply interpretation would handle language ambiguity rather than replace deterministic scheduling or authorize bookings.

| Slide | Focus | Visual | Seconds |
|---|---|---|---:|
| 1 | Value proposition / cast | Original four-character sheet | 9 |
| 2 | Why cancellations matter / why now | Availability versus access | 12 |
| 3 | María’s unexpected cancellation | Consistent María portrait + dialogue | 12 |
| 4 | Ana’s coordination burden | Consistent Ana portrait + dialogue | 13 |
| 5 | José’s missed opportunity | Consistent José portrait + dialogue | 12 |
| 6 | Why Smart Queue | Three coordinated handoffs | 14 |
| 7 | Staff confirms cancellation | Real cancellation / open-slot panels | 17 |
| 8 | Offer, preview, explicit acceptance | Real patient confirmation panel | 18 |
| 9 | Dr. Rivera’s clearer schedule | Portrait + actual updated row | 17 |
| 10 | Before / after benefits | Three-person benefit comparison | 13 |
| 11 | Why AI / honest boundaries | Working rules versus future language assistance | 11 |
| 12 | Impact / invitation / future | Same cast + closing line | 12 |
| **Total** | **370-word script; no live demo** | **15-second transition allowance → 2:55** | **160** |

Five-slide mode uses story slides **1, 2, 8, 9, 12**, with distinct speaker notes totaling **110 seconds / 212 words**. It includes the four characters, operational pain, actual confirmation and schedule captures, and the non-AI/current versus future boundary. Leave 10 seconds for transitions in a two-minute recording. A human rehearsal is still required; a script budget is not proof of delivery time.

## Competition alignment

The [live overview](https://caribbean-ai-summit-hackathon.devpost.com/) and [rules](https://caribbean-ai-summit-hackathon.devpost.com/rules) were readable through web lookup on October 9, 2026. This supersedes the old automated-fetch limitation recorded in `docs/HACKATHON_RULES.md`, without changing its archived verbatim section.

The optional submission deck has a five-slide maximum. The demo-video alternative is at most two minutes. Finalists have a five-minute presentation and three-minute Q&A, plus a two-minute backup video requirement. AI is optional. The requested 12-slide / under-three-minute story is a separate rehearsal/presentation format, not a claim about the event limit. Use the five-slide mode for the optional deck. Confirm accepted upload format and current instructions before submission; HTML itself is not a video or a published demo.

| Verified criterion (no weights published) | Deck evidence |
|---|---|
| Healthcare Impact & Local Relevance | Puerto Rico healthcare coordination problem; intended access/operations benefits (2–5, 10). No unsupported statistics. |
| Quality of the Idea | People-centered handoffs and explicit patient choice (6, 8). No claim to be uniquely first. |
| Prototype Execution | Screens captured by exercising actual cancellation, offer, acceptance, and schedule update (7–9). |
| Feasibility & Responsible Design | Synthetic data, in-memory scope, no live booking or current AI, future pilot and secure persistence (7–12). |
| Usability & Clarity | Simple narrative, bilingual demo, credential-free entry, visible confirmation and help/decline options (6, 8). |

## Verified feature map

| Claim | Source / evidence | Boundary |
|---|---|---|
| Public Patient / Provider navigation, EN/ES | `frontend/src/App.tsx`, `pages/DemoAccess.tsx`, existing language/browser tests | Roles are navigation; no real auth or separate Admin. |
| Staff confirms cancellation, releases slot, sends fixed offer | `frontend/src/pages/staff/StaffWorkspace.tsx`, `frontend/src/demo/data.ts`; capture script | No patient self-cancellation, live messaging, dynamic ranking, or expiry. |
| Patient previews, explicitly accepts, declines, or requests help | `frontend/src/pages/patient/PatientWorkspace.tsx`; existing e2e tests and fresh capture | Only local synthetic state changes. |
| Acceptance updates appointment, waitlist, activity | Shared reducer and derived views; `updated-schedule.webp` and the in-app activity log | One browser session; reload resets, no multi-user synchronization or persistence. |
| No implemented AI | `backend/app/services/ai_reply.py` returns `None`; `PENDING_TASKS.md` IN-1 | Bounded EN/ES assistance is proposed, not a shipped feature. |
| Backend largely scaffolded | `backend/app/main.py`, routers/services; README and technical proposal | Health is implemented; production booking APIs are not connected. |
| Intended operational benefit | Narrative hypothesis derived from the workflow | No measured time savings, clinical efficacy, no-show reduction, or production-readiness claim. |

The fictional story cast is **María Rodríguez / Ana Martínez / José Pérez / Dr. Carlos Rivera**. The original images remain identical throughout. The application's synthetic fixtures use the same names, so the real screenshots show José Pérez, María Rodríguez's cancelled slot and Dr. Carlos Rivera's schedule. Ana uses the existing Provider workspace. Dr. Rivera's dialogue illustrates an intended operational outcome, not a simulated clinical consultation.

## Visual direction and asset provenance

- Requested [Pinterest pin](https://ru.pinterest.com/pin/1060527412260369805/): inaccessible through web fetch (including www alternate); native Firefox interaction could not complete. No specific layout, color, or typography claim is attributed to this pin.
- Complementary Pinterest searches: “cream pastel palette healthcare center characters”, “modern flat doctor and patient character”, and “hospital reception medical staff illustration”. References included [cream/pastel healthcare characters](https://ph.pinterest.com/pin/cream-pastel-palette-healthcare-center-characters--1103804189895676477/) and [doctor/patient illustration](https://in.pinterest.com/pin/modern-flat-doctor-and-patient-character-vector-cartoon-illustration-male-and-female-nurse-and-talking-with-olde--421931058850561243/). Pin pages were not fully retrievable; search previews and a cream/pastel healthcare title-slide image were available. No Pinterest artwork or template is copied or bundled.
- Observed complementary mood: warm cream, soft healthcare colors, friendly character-led composition. Final layout is original, using the app's navy/teal/coral identity, editorial serif headlines, system sans-serif body text, spacious 16:9 compositions, restrained transitions, and large real screenshots.
- `assets/characters/cast.webp`: one original four-character sheet generated with the built-in image-generation tool on October 9, 2026. CSS displays the same sheet or quarter crops; no illustration library, downloaded character asset, external font, or stock template is included. The original source is outside the project; the same-resolution WebP delivery asset is self-contained here.
- `assets/screenshots/*.webp`: web-optimized local POC panel captures at 2× pixel density. See `tests/capture.mjs` for reproducible actions. Synthetic healthcare fixtures only.
- `assets/images/`: reserved for future original or licensed assets; none needed now.

### Final image-generation prompt (generation mode; no reference image)

> Create a single original character lineup illustration for a polished healthcare presentation, landscape 1536x1024. Four equally spaced separate full-body fictional Puerto Rican adult characters in FOUR EQUAL VERTICAL QUARTERS, with generous empty margins between figures; no overlap. Left quarter: Maria, medium brown skin, shoulder-length wavy dark hair, coral cardigan over cream blouse, navy trousers, holding phone, mildly concerned expression. Second quarter: Ana, brown skin, dark hair in neat bun, teal blouse and navy trousers, simple badge, holding clipboard, focused friendly expression. Third quarter: Jose, tan skin, short salt-and-pepper hair, round glasses, mustard sweater and navy trousers, holding phone, hopeful expression. Fourth quarter: Dr Carlos, medium brown skin, short dark hair with silver temples and trimmed beard, white doctor coat over navy shirt and teal trousers, stethoscope, calm expression. Consistent refined editorial illustration style across ALL FOUR: crisp flat color, subtle paper-grain texture, elegant friendly proportions, softly rounded forms, very restrained shadows. Premium magazine illustration, not emoji or 3D. Background uniform solid pale cream #f6f1e8, no scenery, no text, no labels, no watermarks, no logos. Each figure occupies its own quarter centered at x12.5%,37.5%,62.5%,87.5%. Feet all at same baseline around90% height, heads around18%. Entire figures visible. Palette navy #142747, teal #267c79, coral #da775f, mustard #d7aa58. This will be one character-sheet asset reused consistently with CSS viewport crops.

## Validation and remaining work

See README for repeatable commands. Passed on October 9, 2026: JavaScript syntax check; targeted Biome lint; automated Chromium offline verification of all 12 slides and five-slide mode, local asset decoding, keyboard navigation, notes, timer start/pause/reset, fullscreen, no external requests or uncaught errors, canvas bounds, and 1280×720 / 1024×768 / 390×844 fitting. All 12 rendered slides were visually reviewed; provider spacing was adjusted and real captures regenerated at 2× pixel density. No app build was needed because application code and dependencies are unchanged. No app runtime dependency or business-logic change is required for this artifact. Update (October 9, 2026): the toolbar was trimmed to previous / next, slide counter, Deck select, and Fullscreen; the on-screen notes panel and timer (and their N / T / R / Escape shortcuts) were removed. SPEAKER_NOTES.md remains the notes source, and the validation test now asserts the exact toolbar contents.

Remaining human acceptance: timed spoken rehearsal, projector readability, and native-browser fullscreen on the presentation device. Remaining submission work: team attribution, verified public links, accepted upload format, recorded ≤2-minute video, and final organizer-rule check. Do not mark deployment or the submission task complete just because these slides exist.

## Update — October 9, 2026: AI-assistant story (Phase B)

The application (commit `4f7fe3f`) replaced Ana's manual decisions with a simulated, rule-based AI assistant. The deck was rewritten to that single story; the sections above are kept as the record of the earlier manual-flow version and are superseded where they conflict (for example "staff confirms cancellation", "no patient self-cancellation", "decline and help paths", "No AI runs").

**Arc:** Ana's manual work today (problem) → María cancels in her own patient view → the AI assistant (simulated) detects the cancellation, scans four waiting patients and selects José with the app's real deterministic reasoning (compatible afternoon availability; P3 tie with Elena Morales and Camila Soto broken by the oldest request, Oct 4; Nicolás Díaz excluded, mornings only; Elena next, Oct 5) → offer to José → José explicitly accepts → the assistant updates the schedule and waitlist (4 → 3) → Ana is notified with a summary. End.

| Slide | Focus | Visual | Seconds |
|---|---|---|---:|
| 1 | Value proposition / cast | Cast sheet; labels María · Cancels, Ana · Office assistant | 9 |
| 2 | Problem: Ana connects slot and patient by hand / why now | Availability versus access | 12 |
| 3 | Ana's manual work today | Ana portrait + Update → Search → Call → Coordinate | 13 |
| 4 | María cancels in her own view | María portrait + dialogue | 12 |
| 5 | José could take the slot if he knew | José portrait + dialogue | 12 |
| 6 | The assistant coordinates; patients keep the decisions | Detect & select → Offer → Update & notify | 14 |
| 7 | María cancels; the assistant picks José | Real `maria-cancel` + `ai-reasoning` captures | 17 |
| 8 | Offer → José accepts | "Why José?" list + real `jose-offer` capture | 18 |
| 9 | Schedule updates; Ana is notified (end) | Real `ana-notification` + `updated-schedule` row | 17 |
| 10 | Designed benefits | Before / with Smart Queue table | 13 |
| 11 | Why AI: rule-based today, model-backed later | Working (simulated) versus future | 11 |
| 12 | Invitation / next steps | Cast + closing line | 12 |

Five-slide mode is unchanged structurally (slides 1, 2, 8, 9, 12): cast, Ana's manual problem, the assistant's offer and José's consent (with the selection reasoning), the automatic update and Ana's notification, and the honest "simulated today, model-backed later" close. Scripts: about 386 words (story) and 221 words (submission); see SPEAKER_NOTES.md.

| Claim | Source / evidence | Boundary |
|---|---|---|
| María cancels in her own view; José accepts in his | `frontend/src/pages/patient/`, `e2e/ai-assistant.spec.ts`, `maria-cancel.webp`, `jose-offer.webp` | Explicit confirmation in each view; fictional appointments only. |
| The assistant detects, selects, offers, updates and notifies | Demo reducer AI phases and AssistantFeed; `ai-reasoning.webp`, `ana-notification.webp` | Simulated and rule-based: no AI model, no network, no real messages. Reasoning is the existing deterministic ranking, not generated text. |
| Ana is notified only | Office view; e2e asserts no approve/undo controls | Notification is in-app and local to this browser session. |
| Schedule and waitlist update | `updated-schedule.webp` (SQ-006 → José Pérez, "Just filled"); waitlist 4 → 3 | One browser session; reload resets; no persistence or multi-user sync. |
| Model-backed assistant | Slides 11–12 | Future work, not implemented. |

Visual system, cast image, control bar and the 12 / 5 slide structure are unchanged. New CSS rules (`.capture-pair`, `.tall-capture`, `.notified`) size the new captures. `tests/capture.mjs` walks the new flow and writes five WebP captures; the four manual-flow screenshots (`cancellation`, `open-slot`, `patient-confirmation`, the previous `updated-schedule`) were replaced or removed. Validation: `node presentation/tests/validate.mjs` and visual review of every slide in both modes.

## Update — October 10, 2026: Puerto Rico evidence and per-office estimates

Julio asked to rest the case on why managing cancellations and no-shows matters in Puerto Rico (time, resources, money, health) and to show monthly and yearly savings and what Medicaid efficiency means for patients and providers. Only two slides changed; the 12-slide story, the 5-slide submission order (1, 2, 8, 9, 12), slides 1, 3, 6 and 12, the visual system, cast image and control bar are unchanged.

- **Slide 2 → "Why it matters in Puerto Rico."** Four blocks with source tags: Time (six-month specialist wait, Oversight Board workforce study Feb 2025, interview quote; 23 days to the next visit after a clinic cancellation, VA / AJMC 2025, US data), Resources (15.6% cancelled and 3.9–4.7% no-shows, CFSE FY2025-26; 73.7% of physician offices under 5 employees vs 54.4% US, Census 2023), Money ($3,293 vs $10,426 Medicaid spending per enrollee, MACPAC FY2024; 55% statutory match, temporary 76% ends Sept 30, 2027, CRS / KFF), Health (28.9% vs 48.2% of primary-care shortage-area need met, HRSA via KFF; 40.7% of PR physicians 65+, AAMC 2025). Takeaway: "Every refilled cancellation turns capacity already paid for into a visit." The old availability-versus-access line was dropped; slide 3 still carries Ana's manual work.
- **Slide 10 → "What it means — per office, per month and per year."** Base case of the benefit model (1 physician, 20 visits/day, 240 days), labelled estimate / derived. Monthly = unrounded yearly ÷ 12, rounded: 177.84 → ~15 visits/month (178/yr); $17,016 → ~$1,418/month ($17.0K/yr, 99213 $95.68); $11,912 → ~$993/month ($11.9K/yr, Plan Vital 70%); 86.5 h → ~7 h/month (87 h, ~$1.1K/yr at $12.57/h); 37.4 → ~3 provider cancellations avoided/month (37/yr, backlog only); 154.4 → ~13 patients/month seen ~14 days sooner (154/yr; 2,162 → ~2,160 patient-days/yr). Medicaid column: $18 PMPM capitation paid whether or not a visit happens; illustrative 100 per-visit offices ≈ $1.19M/yr (100 × $11.9K); range $7.3K–$28.5K per office per year at 99213.
- **Sources:** `docs/wiki/pr-vs-us-medicaid.md`, `docs/wiki/no-shows-cancellations-benefit.md`, README "Why Puerto Rico" (Census figures from `docs/wiki/us-vendors-and-pr-barriers.md`).
- **Speaker notes:** story 169 s (2:49; slides 2 and 10 at 17 s each, later "End by" cues shifted); submission unchanged at 110 s (1:50), slide 2 at 20 s.
- **CSS:** unused `.problem-line`, `.disconnect`, `.why-now` and `.impact table` rules replaced by `.why-grid`, `.why-takeaway`, `.base-case`, `.impact-cols`, `.sources`.
