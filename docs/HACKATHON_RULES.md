# Hackathon Rules and Compliance Checklist

**Summary**: The official Caribbean AI Summit 2026 hackathon rules, copied word for word from Devpost, followed by a checklist the team uses to confirm compliance before and during the build. The rules section is a copy; do not edit it. Only the checklist is updated.
**Sources**: [raw/devpost-hackathon-rules-2026-10-07.txt](raw/devpost-hackathon-rules-2026-10-07.txt) (pasted from https://caribbean-ai-summit-hackathon.devpost.com/rules on 2026-10-07 16:12 AST; Devpost blocks automated fetches); judging criteria from the CaribbeanAI_Summit2026 repo, `CervelAI/Research/HACKATHON_RESEARCH.md` (2026-10-03)
**Last updated**: 2026-10-09

---

> Recheck the live Devpost page before submitting. Start and deadline times were "to be announced" when this copy was made; the times announced since are recorded in R4 of the checklist (organizer email of 2026-10-07).

## Official rules (verbatim, 2026-10-07)

### Participation Requirements

Every participant must have a valid Caribbean AI Summit conference ticket and register for the hackathon on Devpost.

Joining Devpost or the WhatsApp group does not replace purchasing a conference ticket.

Organizers may verify tickets. Participants without a valid ticket will not be eligible to compete or receive prizes.

### Team Rules

- Teams of 2–4 participants
- Solo participation allowed (hard mode)
- Pre-formed teams allowed

### Build Rules

- Project development must take place during the official hackathon build period, October 8–10, 2026. Exact start and submission times will be announced.
- Projects must address a healthcare challenge relevant to Puerto Rico or the Caribbean.
- Use any tools, frameworks, or APIs. AI is optional, not required.
- Existing libraries, frameworks, and publicly available resources are allowed. Clearly identify and credit any pre-existing components.
- Fully pre-built projects are not eligible. The prototype’s core functionality must be developed during the hackathon.

### Submission Rules

- Submit through Devpost before the announced deadline. Late submissions may not be reviewed.
- Include the project name, team members, a 2–3 sentence problem-and-solution description, a working demo OR demo video of up to 2 minutes, and a code repository link.
- Ensure judges can access your submitted links and provide basic instructions for reviewing or running the project.
- Optional materials include a slide deck of up to 5 slides and a live hosted demo

### Demo Rules

- Finalists must be prepared for a 5-minute live presentation followed by 3 minutes of Q&A.
- All finalists must provide a 2-minute backup demo video.
- Clearly distinguish working functionality from simulated features or planned capabilities.

### Code of Conduct

- Treat participants, judges, mentors, volunteers, and organizers with respect.
- Harassment, discrimination, plagiarism, and disruptive behavior are not permitted.
- Report conduct or privacy concerns to the organizing team.
- Organizers may disqualify submissions that violate these rules and remove participants who violate the code of conduct.

## From the Devpost overview page (not on the rules page; needs verification)

Recorded by Reyis Jones in the original repo on 2026-10-03; not rechecked for this folder.

- **Judging criteria** (no weights published): Healthcare Impact & Local Relevance; Quality of the Idea; Prototype Execution; Feasibility & Responsible Design; Usability & Clarity.
- **Data**: use non-identifiable synthetic, public or approved data; no real patient records and no secrets.

## Compliance checklist

Status values: `open`, `done`, `n/a` (reason required). Owner = team member responsible.

### Before the build starts

| # | Requirement | Rule | Owner | Status |
|---|---|---|---|---|
| R1 | Every team member holds a valid conference ticket | Participation | team | open: human check; owner: team |
| R2 | Every team member is registered for the hackathon on Devpost | Participation | team | open: human check on Devpost; owner: team |
| R3 | Team has 2–4 members (or a solo entry) and the roster is recorded in `participants/` | Team | | open |
| R4 | Official start time, submission deadline and timezone recorded here | Build | | done (2026-10-08): kickoff Thursday 2026-10-08, 6:00pm AST at Centro Unido de Detallistas (wrap-up 10:00pm, remote work afterwards); Friday 2026-10-09 teams work at their own pace, Room 207 is the hackathon lounge during conference hours, mentorship from 6:00pm in Room 209A; **final submissions due Saturday 2026-10-10 at 12:00pm AST** on Devpost. Presentation and awards time not announced (the summit page placed finalist demos 3:30–4:15pm). Source: Devpost organizer email "Hackathon Starts Tomorrow", 2026-10-07 9:09pm AST |
| R5 | Problem is a healthcare challenge relevant to Puerto Rico | Build | | done: missed and cancelled appointments in PR medical offices (see `wiki/idea-3-pitch-evidence.md`) |

### During the build

| # | Requirement | Rule | Owner | Status |
|---|---|---|---|---|
| R6 | No prototype code written before the official start; pre-event work limited to research and planning documents | Build | | open |
| R7 | Pre-existing components listed and credited (frameworks, libraries, models, templates, any reused code) in the repo README | Build | | done (2026-10-09): README "Pre-existing components" credits every package in `frontend/package.json` (dependencies and devDependencies) and `backend/requirements.txt` with its license, plus Ollama/Qwen2.5, GitHub Actions, Gitleaks, Vercel and Node.js; `frontend/tests/submission.test.mjs` fails if a package is not credited |
| R8 | Only synthetic or approved data; no real patient records or secrets in the repo | Overview (verify) | | done (2026-10-09): CI scans the full Git history with Gitleaks 8.30.1 before every deploy (`.github/workflows/deploy-vercel.yml`; the run for commit 32b519e passed); demo data in `frontend/src/demo/` is fictional and labeled as such; the public build blocks network requests |
| R9 | Git history shows the core features were built during October 8–10 | Build (evidence) | | done (2026-10-09): `git log --reverse --date=iso` shows the first commit at 2026-10-08 20:32 -0400 (after the 6:00pm AST kickoff) and the latest at 2026-10-09 17:19 -0400; all 31 commits fall on October 8–9. Recheck the last commit before submitting |

### Submission

| # | Requirement | Rule | Owner | Status |
|---|---|---|---|---|
| R10 | Project name final | Submission | team | open: proposed "Smart Appointment Queue" in docs/SUBMISSION.md; owner: team |
| R11 | Team members listed on Devpost | Submission | team | open: names drafted from Git authors in docs/SUBMISSION.md; confirm and enter on Devpost; owner: team |
| R12 | 2–3 sentence problem-and-solution description | Submission | team | open: 3-sentence draft in docs/SUBMISSION.md (length checked by `submission.test.mjs`); team to approve; owner: team |
| R13 | Working demo or a demo video of 2 minutes or less | Submission | team | open: live demo works (see R17); video not recorded; owner: team |
| R14 | Code repository link; judges can open it (test from a signed-out browser) | Submission | | done (2026-10-09): https://github.com/Nexus-IT-Professionals/smart-queue returns HTTP 200 to an unauthenticated `curl`; recheck in a signed-out browser before submitting |
| R15 | Basic instructions for reviewing or running the project | Submission | | done (2026-10-09): docs/SUBMISSION.md "How to review" (5 steps) and "Run locally"; README "Run locally" |
| R16 | Optional: slide deck of 5 slides or fewer | Submission (optional) | | open |
| R17 | Optional: live hosted demo | Submission (optional) | | done (2026-10-09): https://smart-queue-demo.vercel.app and its /presentation/index.html return HTTP 200 to an unauthenticated `curl`; CI deploys only after lint, unit and browser tests pass |
| R18 | Submitted on Devpost before the deadline | Submission | team | open: owner: team |

### If selected as a finalist

| # | Requirement | Rule | Owner | Status |
|---|---|---|---|---|
| R19 | 5-minute live presentation rehearsed and timed | Demo | team | open: owner: team |
| R20 | Ready for 3 minutes of Q&A (see `wiki/idea-3-weaknesses.md` for likely questions) | Demo | team | open: owner: team |
| R21 | 2-minute backup demo video | Demo | team | open: owner: team |
| R22 | Every feature shown is labeled working, simulated or planned | Demo | | done (2026-10-09): feature table in docs/SUBMISSION.md labels each feature Working, Simulated or Planned; every Working/Simulated row cites a test title that `submission.test.mjs` checks exists |

### Conduct

| # | Requirement | Rule | Owner | Status |
|---|---|---|---|---|
| R23 | No plagiarism: research claims cite their sources; no copied designs or code without credit | Code of Conduct | | open |
