# Two-minute application demo

Open **smart-queue-demo-2min.mp4**, or open `index.html` for an offline player.

- Duration: exactly **2:00**; 1920×1080, 30 fps, H.264 video / AAC audio.
- English synthetic narration: macOS Samantha. Captions are burned into a separate band below the app; `captions.vtt` is also provided.
- Real browser recording: María's cancellation → Ana confirms José's priority → offer → José explicitly accepts → Dr. Rivera's updated schedule.
- The final application section uses the **separate monthly capacity demo**, showing period selection, cancellation, and staff-confirmed reassignment. It does not pretend to share the guided Patient inbox.
- Opening/closing use the existing HTML presentation; 107 of 120 seconds show the application.
- All records are fictional. No production bookings, outbound messages, or implemented AI triage are claimed.

## Review basis

Reviewed the HTML presentation, speaker notes, submission feature status, current reducers/components and browser workflow tests after the cast-alignment and presentation-control updates (baseline `833ad91`). The video uses the current José/María/Dr. Carlos Rivera identities, rather than older Elena screenshot fixtures. The fixed October 2026 scenario and October monthly statistics are deterministic synthetic examples, not current healthcare activity.

See `NARRATION.md` for the short spoken script and `scenes.json` for exact scene durations. Manual clicks are visually highlighted in the recording; these recording-only outlines do not alter application logic.

## Recreate

The recording and its selectors target application revision **`833ad91`**. Build the preview below from that revision in a separate checkout and point `VIDEO_BASE_URL` at it. UI improvements merged afterward (`fb444cb`) change some button labels and layout; recording the newer UI requires updating the selectors. The exported MP4 intentionally preserves the reviewed recording.

1. From `frontend/`, run `npm run build:demo`, then `npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`.
2. From the repository root, run `node presentation/video/record.mjs` (about two minutes). Uses existing Playwright/Chromium.
3. On macOS with Samantha installed, run `VIDEO_FFMPEG=/path/to/ffmpeg python3 presentation/video/render.py`.

Set `VIDEO_BASE_URL` for a different local preview and `VIDEO_WORK_DIR` for another scratch directory. Default recording, WAVs and intermediate clips stay in `/tmp/smart-queue-video-work`, outside the repository. FFmpeg must support H.264/AAC encoding. No frontend or backend dependency was added.

The deliverable is local. The existing production presentation asset allowlist intentionally does not publish this video; hosting/submission is a separate action.

## Validation

- Browser metadata: 120.000 seconds, 1920×1080; playback and seeking passed.
- Full FFmpeg decode: 3,600 frames at 30 fps; H.264/AAC; no decoding errors.
- All 12 recording stages completed without page errors. Assertions verified José's updated booking, 440 monthly seats, 17 occupied daily seats after cancellation, and 50% eligible-release fill rate after reassignment.
- Reviewed priority, patient confirmation, updated schedule and statistics frames for readable captions and correct application state. Final MP4 is approximately 7.6 MB.
- The application code and existing slide content were not modified. No deployment or submission performed.
