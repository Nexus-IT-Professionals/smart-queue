# Smart Queue presentation

Open **`index.html`** in a modern desktop browser. Keep this folder and its assets together. It works directly from disk, offline, with no installation, account, app server, fonts, or CDN required.

- **Story:** 12 slides, 2:40 estimated narration + 15 seconds of transitions = 2:55 target. No live demo included.
- **Submission:** choose “Submission · 5 slides” in the toolbar. Separate 1:50 narration leaves 10 seconds within a two-minute recording. `index.html?mode=submission` also selects it.
- The official optional deck limit is five slides; use submission mode when submitting. The 12-slide story is for rehearsal or a separately permitted presentation. Check the [current rules](https://caribbean-ai-summit-hackathon.devpost.com/rules) before submission.

| Control | Action |
|---|---|
| → / Space / Page Down | Next slide |
| ← / Page Up | Previous slide |
| Home / End | First / last slide |
| F | Toggle fullscreen (or use the browser’s fullscreen command) |
| N / Escape | Toggle / dismiss speaker notes |
| T | Start / pause timer |
| R | Reset timer |

Notes appear **on the same screen**; hide them before presenting. The timer is optional and never advances slides. Amber indicates planned narration time; red indicates the mode's hard limit (3:00 / 2:00). Changing modes returns to the first slide and resets the timer. System fonts keep the presentation offline; appearance can vary slightly by OS. The 16:9 canvas fits smaller screens, but a desktop/projector is the intended viewing environment.

Read [SPEAKER_NOTES.md](SPEAKER_NOTES.md) for both scripts and [PRESENTATION_PLAN.md](PRESENTATION_PLAN.md) for claim verification, judging alignment, source limitations, and visual provenance.

## Local verification and capture

Uses the project's existing Playwright installation; the presentation itself has no dependencies. From the repository root:

```sh
node --check presentation/script.js
node presentation/tests/validate.mjs
```

The test launches Chromium with the browser context offline, checks all 12 slides and the five-slide subset, notes, timer, fullscreen, keyboard controls, asset decoding, no external requests, no uncaught JS errors, and canvas fit at 1280×720, 1024×768, and 390×844. Rendered slides go to `/tmp/smart-queue-presentation-qa`, outside the repository. Set `PRESENTATION_QA_DIR` to change that path.

To refresh the real app captures after an app change:

```sh
cd frontend
npm run build:demo
python3 -m http.server 8001 --bind 127.0.0.1 --directory dist
```

In another terminal, from the repository root:

```sh
node presentation/tests/capture.mjs
```

The capture script uses a fresh session, synthetic fixtures, 1440×1000 viewport, 2× pixel density, and actual panel screenshots. It leaves application source unchanged; the app fixtures use the story names (José Pérez, María Rodríguez, Dr. Carlos Rivera). The schedule screenshot intentionally filters to SQ-006. Only the four panels displayed in the presentation are captured, directly to WebP at native 2× panel size; if the app UI changes a panel's height, update that image's `width`/`height` attributes in `index.html`.

## Before presenting

1. Open the local HTML, select the appropriate mode, hide notes, and enter fullscreen.
2. Rehearse aloud using the timer. The 370-word story assumes about 139 words/minute; timing is estimated, not a measured human performance.
3. Check readability on the actual projector, especially the large screenshot buttons and schedule row.
4. Keep the disclosure: browser simulation, synthetic data, no implemented AI or real bookings.

No deployment or submission was performed. Team attribution, public links, the recorded backup video, and real-device rehearsal remain separate submission work.

## Web image optimization

The presentation loads five local WebP images totaling approximately **291 KB**. The October 9 recapture kept the screenshot widths; the patient confirmation (900 px) and schedule (612 px, now with the priority badge) are taller, and `index.html` declares those dimensions. The illustration uses lossy quality 88; screenshots use quality 96 for readable text. Superseded PNGs and the unused activity image are not shipped. No CDN or runtime dependency is needed.

`tests/capture.mjs` encodes fresh screenshots directly to WebP using the existing Playwright Chromium installation; intermediate PNG buffers remain in memory. Keep an external original when editing the character illustration to avoid recompressing the delivery image. HTML dimensions and responsive CSS preserve aspect ratios.

After refreshing screenshots, run `node presentation/tests/validate.mjs` and review text readability on the presentation device.
