
# Puerto Rico No-Show Data

**Summary**: What is known about missed appointments in Puerto Rico. No general-population PR no-show rate exists in published sources. The best PR data point is CFSE (workers' compensation) appointment counts, which give a derived 4.7% no-show rate that could reach 22.8% depending on one unclear status. Proxies, VA San Juan wait times, and a list of who could supply baseline data for a pilot are included.
**Sources**: `raw/idea-3-gap-research-urls-2026-10-07.txt`; `raw/no-show-research-urls-2026-10-07.txt` (Dantas proxy)
**Last updated**: 2026-10-07

---

Citations are to `raw/idea-3-gap-research-urls-2026-10-07.txt` unless noted; see [[idea-3-gap-research-urls-2026-10-07]].

## The gap

- No peer-reviewed or general-population PR no-show rate was found. Searched: ASES / Plan Vital, the MCOs, the PR Health Sciences Journal, and the press (source: idea-3-gap-research-urls-2026-10-07.txt → search summary) (negative finding; "not found" is not proof of absence).
- The often-repeated "15–30%" comes from the Colegio de Médicos Cirujanos in its comment on PS 1263. It is a physicians' group claim in a legislative record, not a measured rate (source: idea-3-gap-research-urls-2026-10-07.txt → PS 1263 Informe Negativo) (government record of a stakeholder claim). See [[ps-1263-pr-wait-times-bill]].

## CFSE appointment data (a PR government system)

CFSE (Corporación del Fondo del Seguro del Estado) is Puerto Rico's state workers' compensation insurer. It publishes monthly appointment counts by status from its AMA platform, covering internal and external providers (source: idea-3-gap-research-urls-2026-10-07.txt → CFSE AMA stats) (government, full table read).

FY2025-26 (July 2025 to June 2026), preliminary and "sujeto a revisión" (subject to revision), grouped by appointment creation date:

| Status | Count |
|---|---|
| Attended | 194,681 |
| Not Attended | 9,525 |
| Cancelled | 37,254 |
| Cancelled On Site | 612 |
| "Attendance Overdue" | 47,882 |
| Scheduled (future) | 348,243 |
| **Grand total** | **638,413** |

### Derived rates (our arithmetic, verified)

- **No-show rate ≈ 4.7%**: 9,525 / (194,681 + 9,525) (derived).
- **Cancellations ≈ 15.6%** of resolved appointments: (37,254 + 612) / (194,681 + 9,525 + 37,254 + 612) (derived).
- **Upper bound ≈ 22.8%**: if "Attendance Overdue" means past appointments with no status recorded, and all of them were missed, the no-show share becomes (9,525 + 47,882) / (194,681 + 9,525 + 47,882) (derived).
- **The meaning of "Attendance Overdue" is unconfirmed.** Ask the CFSE Oficina de Planificación.

### How to use it

- Say "a PR government appointment system (workers' compensation) records X", **not** "the PR no-show rate". Injured workers are not the general or Plan Vital population.
- The data is preliminary and grouped by creation date, so FY2025-26 counts will move.
- The 4.7%–22.8% range itself is a useful message: even the government system cannot say cleanly how many patients never showed, which is the "evidencia" (audit log) argument for Idea 3.

## Proxies for the Plan Vital population

- **16.5% no-show** at a US community health center serving mostly Latino, low-income patients; no-showers were more likely Hispanic or on Medicaid (source: idea-3-gap-research-urls-2026-10-07.txt → Kaplan-Lewis 2013) (peer-reviewed; seen via snippet, needs verification).
- **About 23%** global mean across 105 studies (source: no-show-research-urls-2026-10-07.txt → Dantas Health Policy 2018) (peer-reviewed). Backup proxy.
- For comparison, the US Medicaid and safety-net rates of 36–42% and the private-practice median of 5–7% are in [[appointment-no-shows]].

## VA Caribbean Healthcare System (San Juan) wait times

Live data read 2026-10-07; days to appointment (source: idea-3-gap-research-urls-2026-10-07.txt → VA Caribbean access data) (government).

| Clinic | Established patient | New patient |
|---|---|---|
| Primary care | 12 | 15 |
| Mental health, individual | 14 | 16 |
| Mental health, group | 8 | 78 |
| Cardiology | 15 | 24 |
| Orthopedics | 4 | 24 |
| Ophthalmology | 18 | 85 |

- The VA site publishes no no-show data for San Juan.
- New patients wait far longer than established ones in group mental health (78 vs 8) and ophthalmology (85 vs 18). Those are the slots where backfill helps most.

## Other PR access evidence

- Specialist waits "up to a year", including a 10-month wait for pediatric neurology (source: idea-3-gap-research-urls-2026-10-07.txt → El Mañana 2023) (news; seen via snippet, needs verification).
- An FTI Consulting study for the Fiscal Oversight Board (February 2025) looked at why appointments are hard to get in PR. In a test call, the caller got an earlier slot after saying they had Plan Vital. No rates were given (source: idea-3-gap-research-urls-2026-10-07.txt → Telemundo FTI 2025) (news, read).
- The Colegio de Médicos president said patients who miss appointments disrupt schedules (source: idea-3-gap-research-urls-2026-10-07.txt → Primera Hora 2010 Colegio) (news, 2010, qualitative).
- More PR capacity data: [[pr-specialist-shortage]].

## Who could supply baseline data for a pilot

- **CFSE Oficina de Planificación**: meaning of "Attendance Overdue"; monthly data by provider.
- **ASES**: Plan Vital encounter data and MCO access reports.
- **Plan Vital MCOs**: Triple-S, MMM, First Medical, Menonita.
- **Asociación de Salud Primaria de PR**: the Centros 330 (federally qualified health centers). Note that HRSA's UDS reporting has no no-show field, so the centers' own scheduling systems are the source.
- **UPR Medical Sciences Campus** clinics and the University Hospital.
- **VA Caribbean**: through FOIA or its Office of Performance.
- **Colegio de Médicos Cirujanos**: it cited 15–30% to the Senate; ask for the basis.

(source: idea-3-gap-research-urls-2026-10-07.txt → search summary) (derived list of candidate data holders; none has been contacted)

## Related pages
- [[appointment-no-shows]]
- [[idea-3-unit-economics]]
- [[idea-3-pitch-evidence]]
- [[ps-1263-pr-wait-times-bill]]
- [[pr-specialist-shortage]]
- [[pr-health-plans-and-medicare-advantage]]
- [[idea-3-gap-research-urls-2026-10-07]]
- [[idea-3-smart-appointment-queue-evidence]]
- [[index]]
