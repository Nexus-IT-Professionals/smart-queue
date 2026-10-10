# Two-minute application demo

> **STALE MP4 — regenerate before use (October 9, 2026).** `smart-queue-demo-2min.mp4` still shows the earlier **manual** flow (Ana confirms María's cancellation, confirms José's priority and sends the offer; a staff-confirmed capacity refill). The app now runs the **AI-assistant (simulated)** story, and `scenes.json`, `NARRATION.md`, `captions.vtt` and `record.mjs` already describe that new story, so the MP4 no longer matches its own script and captions. The recording step was re-run successfully on Windows against the current app, but the render step needs macOS `say` with the Samantha voice, which is not available there, so the MP4 was left untouched. Run step 3 below on macOS to regenerate it.

Open **smart-queue-demo-2min.mp4**, or open `index.html` for an offline player.

- Duration: exactly **2:00**; 1920×1080, 30 fps, H.264 video / AAC audio.
- English synthetic narration: macOS Samantha. Captions are burned into a separate band below the app; `captions.vtt` is also provided.
- Real browser recording of the single demo story: Ana's manual work today → María cancels in her own patient view → the AI assistant (simulated) detects the opening, scans four waiting patients and selects José with its real rule-based reasoning (P3 tie broken by the oldest request, Oct 4; Nicolás excluded, mornings only; Elena next) → offer → José explicitly accepts → the assistant updates the schedule and waitlist (4 → 3) → Ana is notified with a summary.
- A short section shows the **separate monthly capacity demo** (period statistics only). It does not pretend to share the guided story.
- Opening and closing use the existing HTML presentation, including the "Why AI?" slide: the assistant is simulated and rule-based (no AI model runs); a model-backed assistant is future work.
- All records are fictional. No production bookings or outbound messages are claimed.

See `NARRATION.md` for the short spoken script and `scenes.json` for exact scene durations. Manual clicks are visually highlighted in the recording; these recording-only outlines do not alter application logic.

## Recreate

The recording and its selectors target the AI-assistant app (commit `4f7fe3f` plus this presentation update).

1. From `frontend/`, run `npm run build:demo`, then `npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`.
2. From the repository root, run `node presentation/video/record.mjs` (about two minutes). Uses existing Playwright/Chromium.
3. On macOS with Samantha installed, run `VIDEO_FFMPEG=/path/to/ffmpeg python3 presentation/video/render.py`.

Set `VIDEO_BASE_URL` for a different local preview and `VIDEO_WORK_DIR` for another scratch directory. Default recording, WAVs and intermediate clips stay in `/tmp/smart-queue-video-work`, outside the repository. FFmpeg must support H.264/AAC encoding. No frontend or backend dependency was added. `render.py` also rewrites `captions.vtt` and `NARRATION.md` from `scenes.json`.

The deliverable is local. The existing production presentation asset allowlist intentionally does not publish this video; hosting/submission is a separate action.

## Validation

October 9, 2026 (Windows, AI-assistant story):

- Step 1 (`npm run build:demo` + preview on 4176): passed.
- Step 2 (`record.mjs`): passed. All 12 scenes completed within their durations without page errors; assertions verified María's SQ-006 row before cancelling, the assistant's "Best match selected" step and its reasoning (oldest request Oct 4; Elena next), José's "14 days earlier" offer, José Pérez in SQ-006 after acceptance, Ana's "No action needed" notification, and 440 monthly seats on the capacity dashboard. Scene frames were reviewed.
- Step 3 (`render.py`): **not run to completion** — it stops at the first narration clip because macOS `say` (Samantha voice) does not exist on Windows. FFmpeg 8.0.1 is available. No substitute voice was used, so the MP4 is the earlier manual-flow version (see the notice above).
- Narration fit (estimated at Samantha's 165 words/minute): every scene's text fits its duration with margin; confirm on macOS, where `render.py` fails loudly if any clip runs long.
- `captions.vtt` and `NARRATION.md` were regenerated from `scenes.json` with the same formatting `render.py` uses.

Earlier validation of the current MP4 (manual flow, baseline `833ad91`): 120.000 seconds, 1920×1080; 3,600 frames at 30 fps; H.264/AAC; no decoding errors; approximately 7.6 MB.
