## Inspiration

In Puerto Rico, the wait for a specialist can run for months, yet appointments are cancelled every day. In the only measured Puerto Rico appointment dataset (CFSE), about one in six appointments was cancelled: 15.6%, versus 4.7% no-shows. Every cancelled slot is care someone needed. Most physician offices here are small (73.7% have fewer than five employees), so refilling a slot means one person, like Ana, the office assistant, calling patient after patient. Meanwhile, Puerto Rico's Medicaid spends about a third of the state average per enrollee ($3,293 vs $10,426, MACPAC FY2024). We wanted every opening to reach someone who is waiting.

## What it does

Smart Queue turns cancellations into earlier visits. María cancels her appointment in her own patient view. A simulated, rule-based AI assistant detects the opening, scans the waiting list and selects the best match: José, who is free in the afternoons and has the oldest request among patients with the same priority. It explains its reasoning, sends José an in-app offer, and nothing moves until he accepts. When he does, the assistant updates the schedule and the waitlist on its own and notifies Ana with a summary of every change. Patients keep the decisions; the office stops chasing calls. The demo is public, bilingual (English/Spanish), needs no account and uses only fictional data.

## How we built it

A React + TypeScript + Vite web app with patient, office and provider views, a deterministic ranking engine (availability, priority, request date) and a full English/Spanish catalog with Puerto Rico time handling. A FastAPI backend provides the API foundation and a local Microsoft Teams notification plugin. Every push runs lint, unit tests and Playwright browser tests, including accessibility scans (WCAG 2.2 AA), responsive and High Contrast checks, before GitHub Actions deploys to Vercel and rehearses the live site. We grounded every claim in a cited research wiki (MACPAC, CRS, KFF, HRSA, Census, peer-reviewed studies) and produced an HTML presentation and a narrated two-minute video.

## Challenges we ran into

- Puerto Rico has no general no-show statistic; we had to find the one measured dataset and label every estimate honestly.
- Local record systems publish no integration program, so we designed the flow to start from a confirmed cancellation instead of an EHR feed.
- Health-care messaging rules: WhatsApp can't carry appointment details, and Puerto Rico's patient bill of rights led us to keep insurer out of who gets an offer.
- Keeping the AI honest: we show its real rule-based reasoning and label it as simulated rather than overclaim.
- Accessibility edge cases, such as selected buttons becoming invisible in Windows High Contrast, which we found and fixed.

## Accomplishments that we're proud of

- A working end-to-end story anyone can try in a browser in under a minute, in English or Spanish.
- Explainable decisions: the assistant shows exactly why José was chosen and who is next.
- Patient consent built in: nothing changes until the patient says yes.
- Accessibility and privacy treated as features, with automated tests guarding them.
- A transparent benefit model: for a one-doctor office, about 178 recovered visits a year (roughly $12K–$17K) and patients seen about two weeks sooner, an estimate, not a measurement.

## What we learned

Cancellations, not no-shows, are the bigger refillable pool. Reminders mostly turn no-shows into cancellations, so they only pay off if someone refills the slot. Small offices need tools that start without integrations. And in health care, honesty about what is simulated, estimated or unverified builds more trust than a bigger claim.

## What's next for Smart Queue

- A measured pilot with care teams in Puerto Rico, starting with offices paid per visit (specialists, dentists, therapy, imaging).
- Secure persistence and SMS and voice offers in Spanish through a provider that signs a business associate agreement, with patient opt-in.
- A model-backed assistant that understands free-text replies in English and Spanish, under staff oversight.
- Integrations with local record systems, office by office, and access reporting for health plans facing appointment-availability standards.
