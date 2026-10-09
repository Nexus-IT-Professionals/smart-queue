
# Waitlist Backfill

**Summary**: Filling cancelled or no-show slots from a waitlist instead of leaving them idle or overbooking. The tactics come mostly from one vendor source; the regulatory push comes from PR's PS 1263. Since 2026-10-07, peer-reviewed UCSF and Mayo results show patients seen 14–22 days sooner, with 11–25% of offers accepted and an equity gap in who accepts. **Update (2026-10-07):** PS 1263 is no regulatory push; the Senate Health Committee filed an Informe Negativo on 2026-08-17 and it is not law. Backfill is also a crowded US product category; see [[idea-3-competitors]]. **Update (2026-10-08):** acceptance depends on how far out the offered slot is (3.7% same day, 12–13% beyond a week at Sutter), the like-for-like gain is "about two weeks sooner" (medians 14 and 15), and Mayo's 24.6% needs re-reading against its own offer counts.
**Sources**: PMC7315363 (Sutter), PMC13395261 (multisite survey) and PMC10988365 (UCSF), opened 2026-10-06; `raw/Hackathon URLs.txt` — https://medlaunch.health/blogs/practice-growth/strategies-for-handling-patient-cancellations/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC7280239/ ; https://senado.pr.gov/senado-propone-medida-para-garantizar-tiempos-de-espera-razonables-en-citas-mdicas ; `raw/no-show-research-urls-2026-10-07.txt`; `raw/idea-3-gap-research-urls-2026-10-07.txt` (added 2026-10-07, second ingest)
**Last updated**: 2026-10-08

---

## Tactics

- Waitlists with automated notifications fill 70–80% of cancelled slots (source: Hackathon URLs.txt → MedLaunch) (vendor claim, unsourced). **Contradicted (2026-10-07)**: see "Peer-reviewed results" below.
- Offer a reschedule within 60 seconds of a cancellation (source: Hackathon URLs.txt → MedLaunch).
- Follow up with patients who don't rebook at 24 hours, 7 days and 21 days (source: Hackathon URLs.txt → MedLaunch).
- Track cancellations by provider, site, appointment type and reason (source: Hackathon URLs.txt → MedLaunch).
- Offer flexible slots: early, evening, telehealth and same-day (source: Hackathon URLs.txt → MedLaunch).

## Peer-reviewed results (added 2026-10-07)

- **UCSF Fast Pass** (2022–23): 60,660 offers for 21,978 open slots; about 11% of offers accepted; 5,399 visits completed; patients seen a median of 14 days sooner; 2,576 service hours added; about US$3M in professional fees over 9 months. The US$3M is fees for visits moved earlier, not net new revenue (source: no-show-research-urls-2026-10-07.txt → UCSF Fast Pass) (peer-reviewed, JMIR 2024).
- **Mayo Clinic automated waitlist** (2023): 1,019,698 offers for 229,998 waitlisted appointments (164,248 patients); 24.6% of offers accepted; appointments moved up a mean of 22.6 days (median 15); 65.2% of responses came within 1 hour (source: no-show-research-urls-2026-10-07.txt → Mayo waitlist) (peer-reviewed, Health Services Insights 2025).
- **Vendor figures**: Luma Health claims a 48% waitlist fill rate and 45 same-day cancellations filled a month (source: no-show-research-urls-2026-10-07.txt → Luma Health) (vendor). Emitrr claims 30–50% fill for same-day cancellations vs 60–80% with at least 24 hours' notice (source: no-show-research-urls-2026-10-07.txt → Emitrr) (vendor, unverified).

### More measured results (added 2026-10-08)

- **Acceptance by lead time (Sutter Health):** 3.7% of offers accepted for same-day slots, 8.2% next day, 12–13% beyond a week (source: PMC7315363) (peer-reviewed, read 2026-10-06). **Implication for the offer rules:** a slot freed with a week's notice is worth several same-day ones; the demo should show an offer with lead time, not only the same-afternoon case, and the expiry window should be shorter for same-day slots.
- **Across the independent evaluations opened** (UCSF, Sutter, Mayo and a multisite survey, all large US health systems): 25 to 39% of offered slots were refilled and 3 to 14% of offers accepted, with patients seen two to five weeks sooner. None covers a small office or a dental office, and none compares against a receptionist working a phone list (sources: PMC10988365, PMC7315363, PMC11938453, PMC13395261) (peer-reviewed; the band is derived from the four).
- **Mayo's "24.6% of offers accepted" does not fit its own counts (hypothesis, check the paper):** 1,019,698 offers for 229,998 waitlisted appointments means 24.6% of offers would be about 251,000 acceptances, more than the appointments on the list. 24.6% reads as the share of **waitlisted appointments moved up** (about 56,600), which puts acceptance per offer near 5.5% and inside the band above. Until the paper is re-read, quote Mayo as "about a quarter of waitlisted appointments moved up, a median of 15 days sooner".
- **Lead time raises cancellations**, which is why a queue has something to refill: lead time was a significant predictor in 41 of 49 studies (source: no-show-research-urls-2026-10-07.txt → Dantas Health Policy 2018) (peer-reviewed).

### Equity finding

- UCSF found lower acceptance among patients 65+, non-White and non-English-speaking (source: no-show-research-urls-2026-10-07.txt → UCSF Fast Pass) (peer-reviewed).
- A 2020 Fast Pass study found acceptance higher at ages 18–49 and among portal users, lower with more comorbidities (source: no-show-research-urls-2026-10-07.txt → JMIR 2020 Fast Pass) (peer-reviewed; reported as Kaiser, attribution needs verification; seen via snippet/press, needs verification).
- So an automated backfill can move earlier slots toward younger, connected, English-speaking patients. For PR: Spanish-first, voice/IVR channel, a "can't do same-day" preference, and travel time considered. See [[no-show-control-risks]].

### Contradiction: 70–80% (vendor) vs 11–25% (peer-reviewed)

- MedLaunch's 70–80% "fill rate" is contradicted by peer-reviewed acceptance rates of 11% (UCSF) and 24.6% (Mayo).
- **These are different metrics.** The peer-reviewed numbers are the share of **offers accepted**; one slot can get many offers, so the share of **slots filled** can be higher (UCSF: 5,399 completed visits from 21,978 open slots is about 25% of slots, derived here, not stated by the study). The vendor gives no method for its figure.
- For the pitch, use the peer-reviewed numbers and "patients seen 14–22 days sooner", not 70–80%. See [[idea-3-pitch-evidence]].
- **Update (2026-10-08):** "14–22" pairs UCSF's **median** (14) with Mayo's **mean** (22.6). Like for like, the medians are 14 and 15. Say **"about two weeks sooner (median)"**; keep 22.6 only if it is labelled as Mayo's mean.

## Backfill vs overbooking

- Overbooking models raised profit by up to 43.72% across 59 clinics (source: Hackathon URLs.txt → PMC7280239).
- PS 1263 would require providers to implement appointment-management systems that "eviten la sobreprogramación" (avoid overbooking) (source: Hackathon URLs.txt → senado.pr.gov PS 1263 release).
- **Contradiction**: the strongest profit lever in the research literature is one the proposed PR law would discourage. For a Puerto Rico pitch, backfill from a waitlist is the compatible way to recover lost slots. See [[ps-1263-pr-wait-times-bill]].
- PS 1263 also gives patients rights to penalty-free rescheduling and virtual queue systems (source: Hackathon URLs.txt → senado.pr.gov PS 1263 release). Both fit a backfill design.
- **Update (2026-10-07):** the three bullets above describe a proposal, not law. The Senate Health Committee filed an Informe Negativo on PS 1263 on 2026-08-17; it is not law and is not moving (source: idea-3-gap-research-urls-2026-10-07.txt → SUTRA PS 1263) (government). The contradiction is now between the profit lever and PR physicians' own testimony: the Colegio de Médicos told the Senate that 15–30% no-shows force offices to overbook and proposed voluntary pilots (source: idea-3-gap-research-urls-2026-10-07.txt → PS 1263 Informe Negativo) (government record of a stakeholder claim). A backfill queue is the voluntary pilot that removes the reason to overbook.

## Competitors (added 2026-10-07)

- Waitlist backfill is a mature US category: Epic MyChart Fast Pass, Luma Health Smart Waitlist, Phreesia, Relatient, Clearwave, NexHealth, Weave, Zocdoc and others. Almost all work inside one practice's EHR, in English, for US practices (source: idea-3-gap-research-urls-2026-10-07.txt → search summary) (vendor sites and press; performance claims unverified).
- The open space is plan-wide routing across small PR offices, Spanish-first, phone-friendly, with an audit log. Full table: [[idea-3-competitors]].
- What a single office recovers: [[idea-3-unit-economics]].

## Caveats

- The only backfill fill-rate figure (70–80%) is from a vendor that sells scheduling products, with no cited study. **Update (2026-10-07):** peer-reviewed UCSF and Mayo data now exist (above) and contradict it.
- No source measures backfill in Puerto Rico.
- Both peer-reviewed studies are large academic systems; results for a single office seeing 20–30 patients a day are unknown (research pending; see [[idea-3-pitch-evidence]]). **Update (2026-10-07):** a derived single-office model now exists in [[idea-3-unit-economics]]; it is a model, not a measurement.

## Related pages
- [[no-show-control-benefits]]
- [[no-show-control-risks]]
- [[idea-3-pitch-evidence]]
- [[no-show-research-urls-2026-10-07]]
- [[idea-3-competitors]]
- [[idea-3-unit-economics]]
- [[idea-3-gap-research-urls-2026-10-07]]
- [[appointment-no-shows]]
- [[ps-1263-pr-wait-times-bill]]
- [[idea-3-smart-appointment-queue-evidence]]
- [[hackathon-urls-2026-10-06]]
- [[index]]
