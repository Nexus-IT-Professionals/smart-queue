# No-Shows, Cancellations and What a PR Office Gains by Reducing Them (draft)

**Summary**: Puerto Rico has no general no-show rate; the only measured PR dataset (CFSE, workers' compensation) shows about 15.6% of resolved appointments cancelled and 3.9–4.7% not attended, so cancellations, not no-shows, are the bigger refillable pool. Provider-initiated cancellations ("bumps") are a separate, under-measured loss: 4.9% of appointments on average across 53 US academic organizations (3.9% in primary care), and VA patients bumped on the day waited a mean 23.2 days for their next visit. The best evidence on fixes is for reminders (no-shows cut about 25%, RR 0.75, 21 trials) and, more modestly, for waitlist backfill (25–39% of offered slots filled in large systems, patients seen about two weeks sooner). A conservative model for a 1-physician PR office (20 visits a day, 240 days) gives a base case of about **178 recovered visits a year, $17.0K at Medicare 99213 or $11.9K at Plan Vital rates**, plus about 87 staff phone-hours avoided and about 150 patients seen about two weeks sooner (all derived). A capitated primary-care office gains time and access, not revenue.
**Sources**: repo wiki (`pr-no-show-data`, `waitlist-backfill`, `idea-3-competitors`, `us-vendors-and-pr-barriers`, `WHY_THIS_IDEA`) and Hackathon wiki (`idea-3-unit-economics`, `appointment-no-shows`, `no-show-impact-by-stakeholder`); web research 2026-10-10 (URLs inline). Model script: `.tmp/research/model.py` (run with `py -3`).
**Last updated**: 2026-10-10

Labels: **read** = opened and read on the page or PDF; **snippet — verify** = seen only in a search result or abstract summary; **repo** = already verified in the repo wiki; **derived** = our arithmetic.

---

## Rates

| Measure | Value | Population / year | Label | Source |
|---|---|---|---|---|
| PR cancellations (CFSE) | 15.6% of resolved appts | PR workers' comp, FY2025-26 prelim | repo, derived | CFSE AMA stats via `docs/wiki/pr-no-show-data.md` |
| PR no-shows (CFSE) | 4.7% of attended+not attended; 3.9% of resolved incl. cancellations; up to 22.8% if "Attendance Overdue" = missed | same | repo, derived | same |
| PR physicians' claim | 15–30% no-shows | stakeholder claim to Senate, unmeasured | repo | PS 1263 Informe Negativo |
| Global no-show mean | ~23% (Africa 43%, Oceania 13.2%), 105 studies | systematic review, 2018 | snippet — verify (repo: peer-reviewed) | Dantas et al., Health Policy 122(4):412–421, https://ideas.repec.org/a/eee/hepoli/v122y2018i4p412-421.html |
| US single-specialty no-shows | 5–5.55% (2020–22), 6.81% (2023) | MGMA DataDive | repo / snippet | https://mgma.com/mgma-stat/patient-no-shows-in-2025 |
| US single-specialty cancellations | 19.95%; only 27.4% rescheduled within 30 days | MGMA, 2024 data | repo (read) | https://www.mgma.com/mgma-stat/about-1-in-3-medical-groups-see-higher-no-shows-in-2026-as-patients-face-higher-costs |
| MGMA trend | 32% of groups report higher no-shows YTD 2026 vs 2025 | poll, n=190 | snippet — verify | same MGMA URL |
| Latino low-income CHC | 16.5% no-show; no-showers more likely Hispanic | Boston-area CHC, 2013 | snippet — verify | Kaplan-Lewis & Percac-Lima, J Prim Care Community Health 2013, https://doaj.org/article/3a0d0fb7955c402eb1f5f323097ed4ee |
| Medicaid / safety net | 36.5–36.7% (Penn); 41.6% (NYC FQHC) | 2016–18 | repo (partly snippet) | `appointment-no-shows.md` |
| VA primary care, same day | 3.92% patient cancel, 3.87% no-show, 3.08% clinic cancel (in-person) | 90.1M appts, 2018–2024 | **read** | Rose et al., AJMC 2025;31(1):e15–e19, https://www.ajmc.com/view/cancellations-in-primary-care-in-the-veterans-affairs-health-care-system |
| Late (<24h) cancellations | 7.9% of encounters (+4.2% no-show), urology 2018 | single center | snippet — verify | https://www.urotoday.com/conference-highlights/sufu-2020-winter-meeting/119728-sufu-2020-factors-associated-with-no-show-and-cancellation-less-than-24-hours-prior-to-appointment-in-a-moderate-volume-n-3-428-outpatient-urology-practice.html |
| Late cancellations, share | 46% of cancellation calls were late; 14.5% of slots left unfilled by them vs 5% no-show | academic neurology, QI abstract | snippet — verify | https://aan.com/msa/Public/Events/AbstractDetails/42212 |
| Family practice | no-shows + cancellations 31.1% of scheduled; revenue shortfall 3–14% | Moore et al., Fam Med 2001 | snippet — verify (secondary, cited in Kheirkhah 2016) | https://pmc.ncbi.nlm.nih.gov/articles/PMC4714455/ |

- **Lead time drives both**: long lead time and prior no-shows are the most common predictors (Dantas 2018). A cancellation with notice is refillable; a no-show and a same-day cancellation mostly are not (Sutter: 3.7% of same-day offers accepted vs 12–13% beyond a week; repo).
- **Share of cancellations that are refillable**: no peer-reviewed figure found. The neurology abstract's 46% "late" implies roughly half arrive with useful notice (snippet — verify). The vendor figure "70% of <24h slots go unfilled" (DrDoctor) is marketing.

## Provider cancellations

- **Rate**: mean 4.9% of appointments (range 0.7–12.4%) across 53 US academic organizations, Jul 2020–Mar 2021; primary care lowest at 3.9% (0.8–8.4%), surgery highest at 7.1% (1.1–15.1%). Definition includes "bumps" cancelled within 30 days and not completed by the original date (AAMC/Vizient CPSC snapshot, Oct 2021, **read**, https://www.aamc.org/media/56586/download). Pandemic-era window; likely above normal.
- **Same-day**: VA in-person primary care 3.08% clinic-cancelled, nearly as many as patient cancellations (3.92%) or no-shows (3.87%); clinic cancellations spiked in 2020. The authors call this a lower bound (earlier cancellations not captured) and note clinic cancellations "had not been previously documented" (Rose 2025, **read**).
- **Patient impact**: 23.2 days to next VA visit (article does not label it a mean) after a same-day clinic cancellation (vs 25.3 patient cancel, 40.8 no-show) (Rose 2025, read). AAMC: bumps "seriously dissatisfy patients", delay care and push patients elsewhere (read; qualitative). Northern Ireland 2011/12: hospitals cancelled 182,813 outpatient appointments vs 184,718 by patients; one trust judged 67% of hospital-cancelled patients possibly harmed (snippet — verify, https://www.niassembly.gov.uk/globalassets/documents/raise/publications/2013/health/5813.pdf).
- **Causes**: emergencies, illness, schedule changes, staffing/equipment; in academic settings also teaching and research (AAMC; front-desk guides, qualitative). PR: emergencies and specialist overload force provider cancellations (Metro PR 2024, repo); PS 1263's motive text cites "cancelaciones sin aviso oportuno, reprogramaciones tardías" (snippet — verify, https://senado.pr.gov/document_vault/medidas_legislativas/ps1263-26.pdf).
- **What reduces them**: AAMC lists policy fixes (standard definition, approval process and notice for schedule changes, monthly review by provider, offer another provider). **No measured effect size found** — the model's reduction rates are assumptions.
- **PR gap**: CFSE does not split patient vs provider cancellations; the 15.6% may include both.

## Cost of empty slots

| Estimate | Value | Method | Label | Source |
|---|---|---|---|---|
| Per no-show, VA | $196 (2008 $) | overall cost per encounter as marginal cost, FY1997–2008 | repo (peer-reviewed) | Kheirkhah 2016, https://pmc.ncbi.nlm.nih.gov/articles/PMC4714455/ |
| Endoscopy suite | $725.42/day at 18% no-show = 16.4% of net gain | simulation | repo | Berg MDM 2013 |
| Family practice revenue | 3–14% shortfall | clinic billing study | snippet — verify | Moore 2001 via Kheirkhah |
| NHS GP | £30 per slot, ~£216M/yr | government estimate | repo | MDDUS NHS 2019 |
| PR per visit (fee for service) | $95.68 (99213 PR Medicare 2026); Plan Vital ~70% = $66.98 | fee schedule | repo; derived | `idea-3-unit-economics.md` |
| US "$150B/yr", "$200/visit" | — | vendor, no method | **do not use** | repo correction |

## What works

| Intervention | Effect | Evidence type | Source |
|---|---|---|---|
| Text notifications vs none | No-shows RR 0.75 (0.68–0.82), 15% vs 21%; attendance RR 1.23; no-show result pools 16 studies (21 in the review) | meta-analysis (**read**; study count corrected 2026-10-10 by main session) | Robotham et al., **BMJ Open** 2016;6:e012116, https://pmc.ncbi.nlm.nih.gov/articles/PMC5093388/ |
| Multiple vs single notifications | attendance RR 1.49 vs 1.09 | same | same |
| Voice vs text | voice better for attendance (RR 0.90 favouring voice; 3 studies) | same | same |
| SMS reminders (Cochrane) | attendance RR 1.14 (1.03–1.26), 7 studies; SMS ≈ phone call | Cochrane review | snippet — verify, https://pubmed.ncbi.nlm.nih.gov/24310741/ |
| Model-targeted phone reminders | RR 0.61 | review | repo (JAMIA 2022) |
| Day-before phone call + refill | no-shows 26%→19%, cancellations 9.9%→17%, arrivals unchanged (≈64% both arms, derived: 1 − no-show − cancel); **43% of freed slots refilled in <24h by staff** (full text only — the abstract does not report it; not re-verified); net positive revenue | RCT, n=823, urban family practice | **read**, Hashim et al., JABFP 2001;14:193–6, https://www.jabfm.org/content/jabfp/14/3/193.full.pdf |
| Automated waitlist (Epic Fast Pass, UCSF) | 11% of offers accepted; ~25% of open slots filled (derived); median 14 days sooner; ~$3M fees moved earlier in 9 months | peer-reviewed cohort | repo; JMIR 2024 e52071 |
| Waitlist (Mayo, Sutter, multisite) | 25–39% of offered slots refilled, 3–14% of offers accepted, 2–5 weeks sooner; same-day worst | peer-reviewed | repo (`waitlist-backfill.md`) |
| Refilling late cancellations, Mayo Clinic Health System | inconsistent refill; lower where prep is needed; no defined process | peer-reviewed (abstract only) | snippet — verify, Bhandari et al. 2022, https://hstalks.com/article/7336/download/ |
| Predictive overbooking | ≥6% less waiting, 27% less overtime vs flat overbooking | single pediatric clinic | snippet — verify, https://pmc.ncbi.nlm.nih.gov/articles/PMC5856203 |
| **Overbooking risk** | Black patients waited ~30% longer under ML overbooking | peer-reviewed (MSOM) | snippet — verify, https://papers.ssrn.com/abstract=3467047 |
| Vendor claims (Phreesia 40%, Luma 48%, MedLaunch 70–80%) | — | **marketing** | repo |

- **Key mechanism (Hashim 2001)**: a reminder mainly turns a no-show into a cancellation with notice. It only pays if someone refills the freed slot. Reminders and backfill are one workflow, not two products.
- Equity: UCSF acceptance lower for 65+, non-English speakers (repo). Offer by voice and SMS in Spanish, one at a time.

## PR benefit model (all outputs derived)

### Assumptions

| Input | Low | Base | High | Basis |
|---|---|---|---|---|
| Booked slots/yr S | 4,800 | 4,800 | 4,800 | 1 physician × 20/day × 240 days (assumption; 20/day is the low end of Julio's 20–30 brief) |
| Patient cancellation rate c | 15.6% | 15.6% | 15.6% | CFSE (sensitivity below) |
| No-show rate n | 3.9% | 3.9% | 3.9% | CFSE, share of resolved incl. cancellations (sensitivity below) |
| Provider cancellation rate p | 3.08% | 3.9% | 4.9% | VA same-day; AAMC primary care; AAMC all specialties |
| Incremental refill share f (of all cancelled slots, beyond what staff already refill) | 10% | 20% | 30% | Large systems fill 25–39% of offered slots; Hashim shows staff alone can refill 43% of next-day slots, so the *added* share is set lower (assumption) |
| Reminder risk ratio RR | 0.90 | 0.75 | 0.61 | Low = partial effect / office already reminds; Robotham; JAMIA targeted |
| Share of prevented no-shows that attend k (rest become cancellations, refilled at f) | 0 | 0.5 | 1 | Hashim (arrivals unchanged); midpoint; Robotham (attendance up) |
| Provider cancellations avoided r | 10% | 20% | 30% | **Assumption — no effect size found** |
| Price per visit | $95.68 / $66.98 | same | same | PR Medicare 99213; Plan Vital 70% |
| Offers (calls) per refill | 11.2 | 11.2 | 11.2 | UCSF 60,660 offers / 5,399 completed (derived) |
| Minutes per manual call | 3 | 3 | 3 | **Assumption** (Hashim used 1 min per reminder call; refill calls are longer) |
| Days sooner per refilled patient | 14 | 14 | 14 | UCSF median |

### Formulas

- (a) Refilled cancellations: **A = S·c·f**
- (b) No-shows prevented: **S·n·(1−RR)**; kept visits **Bk = S·n·(1−RR)·k**; converted then refilled **Bc = S·n·(1−RR)·(1−k)·f**
- Recovered visits **V = A + Bk + Bc**; revenue **V × price**
- (c) Provider cancellations avoided: **Cp = S·p·r** — revenue only if the office has a backlog (else the visit is just moved); patient-days avoided **Cp × 23.2** (VA days to next visit)
- Staff hours avoided: **(A + Bc) × 11.2 × 3 / 60**; patient-days sooner: **(A + Bc) × 14**

### Scenarios (per office per year, derived)

| Output | Low | Base | High |
|---|---|---|---|
| (a) cancelled slots refilled | 75 | 150 | 225 |
| (b) visits from fewer no-shows | 2 | 28 | 73 |
| **Recovered visits V (a+b)** | **77** | **178** | **298** |
| Revenue at 99213 $95.68 | $7.3K | **$17.0K** | $28.5K |
| Revenue at Plan Vital $66.98 | $5.1K | **$11.9K** | $19.9K |
| (c) provider cancellations avoided | 15 | 37 | 71 |
| (c) revenue upper bound, 99213 | $1.4K | $3.6K | $6.8K |
| Total incl. (c), 99213 / Plan Vital | $8.8K / $6.1K | $20.6K / $14.4K | $35.2K / $24.7K |
| Staff phone-hours avoided | 43 | 87 | 126 |
| Patients pulled forward / patient-days sooner | 77 / 1,075 | 154 / 2,162 | 225 / 3,145 |
| Patient-days of delay avoided by fewer bumps | 343 | 869 | 1,637 |

- Base case is about **0.74 extra visits per clinic day**. At a PR front-desk wage of $12.57–13.88/h (repo), 87 hours is about $1.1–1.2K of staff time (derived) — real but small; the larger staff value is that refill calls happen at all.
- Capitated primary care (Plan Vital $18 PMPM): revenue rows are $0; the benefit is access (days sooner), staff time, and the access standards the plan must meet.

### Sensitivity (base parameters, varying one rate)

| Patient cancellation rate c | Refilled (a) | Visits V | 99213 | Plan Vital |
|---|---|---|---|---|
| 8% (lower, assumption) | 77 | 105 | $10.0K | $7.0K |
| **15.6% (CFSE)** | 150 | 178 | **$17.0K** | **$11.9K** |
| 19.95% (MGMA 2024) | 192 | 220 | $21.0K | $14.7K |
| 25% (higher, assumption) | 240 | 268 | $25.7K | $18.0K |

| No-show rate n | Visits from (b) | Visits V | 99213 | Plan Vital |
|---|---|---|---|---|
| 3.9% (CFSE) | 28 | 178 | $17.0K | $11.9K |
| 6.81% (MGMA 2023) | 49 | 199 | $19.0K | $13.3K |
| 16.5% (Latino CHC) | 119 | 269 | $25.7K | $18.0K |

- **Reconciliation with `idea-3-unit-economics`** ($39–56K at 15% no-show, 25/day, 250 days): that model treated 15% no-shows as the pool and backfilled 25–50% of them. This one uses CFSE's split (cancellations are the pool, no-shows small), 20/day, and only the *incremental* refill over staff effort, so it is lower by design. Use this as the conservative floor.

## Caveats

1. No PR general-population rate exists; CFSE is workers' comp, preliminary, and does not split patient vs provider cancellations.
2. Incremental refill share and provider-cancellation reduction are assumptions; no small-office or PR measurement exists.
3. Revenue is gross 99213-equivalent; real offices bill mixed codes; specialists (99214 $136.27; Vital 80%) would show ~40% more per visit.
4. Avoided provider cancellations add revenue only where demand exceeds capacity; otherwise they move visits earlier.
5. Assumes the waitlist has a patient ready; offices running turns by arrival have no slots to refill.
6. AAMC's provider-cancellation data is academic medicine during COVID; VA's is same-day only (lower bound).
7. Staff minutes per call and calls per refill (from an automated system) are proxies for manual work.

## How to use in the pitch

- "In the only measured Puerto Rico appointment dataset, cancellations outnumber no-shows about four to one — 15.6% vs 4.7%. The cancellation is the slot we can refill." (Rates: CFSE rows)
- "Reminders cut no-shows by about a quarter across 16 studies — but mostly by turning them into cancellations. That only pays if someone refills the slot." (What works: Robotham, Hashim rows)
- "Doctors cancel too: about 4 to 5 of every 100 appointments in US academic clinics, and bumped patients waited over three weeks for their next visit." (Provider cancellations: AAMC, VA)
- "On conservative assumptions, a one-doctor Puerto Rico office recovers about 180 visits a year — roughly $12K to $17K — and gets about 150 waiting patients seen two weeks sooner." (Scenario table, base; say "model, not measurement")
- "For a capitated primary-care office the gain is time and access, not revenue." (Model note)
