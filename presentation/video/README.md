# Two-minute application demo

Open **smart-queue-demo-2min.mp4**, or open `index.html` for an offline player.

- Duration: exactly **2:00**; 1920×1080, 30 fps, H.264 video / AAC audio.
- English synthetic narration: Microsoft neural voice **en-US-JennyNeural** (via `edge-tts`), over a quiet background music bed that dips whenever the voice speaks. Captions are burned into a separate band below the app; `captions.vtt` is also provided.
- Narration (October 9, 2026 script): what Smart Queue does and why it matters in Puerto Rico, told through María (patient), Ana (office assistant), José (waiting list) and Dr. Rivera, and why it differs from other scheduling software in Puerto Rico.
- Real browser recording of the single demo story: Ana's manual work today (her slide in the deck) → María cancels in her own patient view → the AI assistant (simulated) detects the opening, scans four waiting patients and selects José with its real rule-based reasoning (P3 tie broken by the oldest request, Oct 4; Nicolás excluded, mornings only; Elena next) → offer → José explicitly accepts → the assistant updates the schedule and waitlist (4 → 3) → Ana is notified with a summary.
- Dr. Rivera's section shows the **separate monthly capacity demo** (period statistics only); its caption says "separate synthetic month". It does not pretend to share the guided story.
- Opening, Ana's manual work, "why it's different" (the deck's "Why Smart Queue" slide: refill workflow, English / Español) and closing use the existing HTML presentation. The closing narration states that the assistant is simulated and rule-based.
- All records are fictional. No production bookings or outbound messages are claimed.

See `NARRATION.md` for the short spoken script and `scenes.json` for exact scene durations. Manual clicks are visually highlighted in the recording, and view, route and slide changes fade instead of switching instantly (see *Transitions*); these recording-only effects do not alter application logic.

## Music credit

"Clockwork Pulse" by trangiahung159 — <https://pixabay.com/music/corporate-clockwork-pulse-536981/>. Free for use under the [Pixabay Content License](https://pixabay.com/service/license-summary/); the Pixabay page labels the track "AI generated". License verified by Julio from the Pixabay page on October 9, 2026.

- The page shows **"Content ID Registered"**: uploading this video to YouTube may trigger a Content ID claim. Prefer a non-YouTube host, or be ready to clear the claim through Pixabay's claim-clearing process.
- The MP3 itself is **not** in this repository; only the mixed MP4 contains it.

## Recreate

The recording and its selectors target the AI-assistant app (commit `4f7fe3f` plus this presentation update).

1. From `frontend/`, run `npm run build:demo`, then `npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`.
2. From the repository root, run `node presentation/video/record.mjs` (about two minutes). Uses existing Playwright/Chromium.
3. Run `presentation/video/render.py` with one of the narration backends below.

`render.py` selects the narration backend with `VIDEO_TTS`:

- `say` (default, macOS): `VIDEO_FFMPEG=/path/to/ffmpeg python3 presentation/video/render.py` uses `say` with the Samantha voice and no music — the earlier recipe, unchanged.
- `edge` (any OS, used for the current MP4): Microsoft neural voices through the open-source [`edge-tts`](https://github.com/rany2/edge-tts) package (LGPL-3.0), pinned to **edge-tts 7.2.8**. Options: `VIDEO_EDGE_TTS` (path to the `edge-tts` executable), `VIDEO_TTS_VOICE` (default `en-US-JennyNeural`), `VIDEO_TTS_RATE` (default `+5%`). **edge-tts calls Microsoft's online text-to-speech service and sends it the narration text**, which is already public in this repository; no other data is sent. Leading and trailing silence returned by the service is trimmed, so each scene's voice starts 120 ms after its caption.
- `VIDEO_MUSIC=<audio file>` adds the background bed (see *Mix*). Without it there is no music.

`VIDEO_XFADE` sets the scene-to-scene crossfade in seconds (default `0.8`; `0` restores the earlier hard cuts). It applies to every backend, including the macOS default.

Every backend keeps the scene-fit check: rendering stops with an error if any narration clip (plus 0.2 s) is longer than its scene.

### Windows recipe (PowerShell 7, as used on October 9, 2026)

edge-tts is installed only in a temporary virtual environment outside the repository; no repository dependency is added.

```powershell
py -3 -m venv $env:TEMP\sq-tts-venv
& $env:TEMP\sq-tts-venv\Scripts\python.exe -m pip install edge-tts==7.2.8

# Step 1 runs in its own terminal (preview on 4176). Then, from the repository root:
$env:VIDEO_WORK_DIR = "$env:TEMP\smart-queue-video-work"
node presentation/video/record.mjs

$env:VIDEO_TTS = 'edge'
$env:VIDEO_EDGE_TTS = "$env:TEMP\sq-tts-venv\Scripts\edge-tts.exe"
$env:VIDEO_TTS_VOICE = 'en-US-JennyNeural'
$env:VIDEO_TTS_RATE = '+5%'
$env:VIDEO_MUSIC = "$env:TEMP\sq-video-music\clockwork-pulse.mp3"   # downloaded from the Pixabay page above
py -3 presentation/video/render.py
```

Set `VIDEO_WORK_DIR` explicitly on Windows: the default `/tmp/smart-queue-video-work` resolves to `C:\tmp\…` there. On macOS the default stays `/tmp/smart-queue-video-work`, outside the repository. Set `VIDEO_BASE_URL` for a different local preview. FFmpeg must support H.264/AAC encoding (`VIDEO_FFMPEG` if it is not on `PATH`). `render.py` also rewrites `captions.vtt` and `NARRATION.md` from `scenes.json`.

### Transitions

Two levels, so nothing switches between one frame and the next:

- **Between scenes (`render.py`).** The screen crossfades (`xfade=transition=fade`, 0.8 s) centred on each cue: 0.4 s before to 0.4 s after. A plain dissolve, not `fadeblack`, because at most cues the picture on both sides is the same view, so a dip to black would add a flash where there is no real change. Each scene's screen segment takes 0.4 s of pre-roll from the recording and holds its frame from 0.2 s before its end, which hides the first frames of the next action. The caption band does not cross-dissolve (two paragraphs on top of each other are unreadable). Instead the outgoing text fades out over the last 0.4 s and the new text fades in over the first 0.4 s, so the cue itself still switches exactly on the boundary. Scene cues, `captions.vtt` and the audio timeline are unchanged, and the picture and audio are muxed in one pass at exactly 120 s.
- **Inside scenes (`record.mjs`, recording only, injected with `addInitScript` / `page.evaluate`).** A full-viewport curtain in the app's background colour (`#f3f5f9`) fades in (300 ms), holds while the route, view or deck slide changes underneath (including page loads and the deck's slide flipping), then fades out (380 ms). Scrolls ease (cubic in-out, 700 ms) instead of jumping. A clicked control keeps its highlight 420 ms before and 250 ms after the click, and each scene holds still for 400 ms after its cue, so the crossfade runs over a still frame. The app's reduced-motion rule is respected for the app's own animations; only the injected curtain overrides it.

### Voice choice

Jenny and Aria (`en-US-AriaNeural`) were both generated for all twelve scenes. Jenny was chosen: Microsoft lists it as a general-purpose, friendly voice (Aria is tuned for news/novel reading), and at the same rate its narration is about 4.5% shorter in total, so a +5% rate fits every scene instead of a larger speed-up. With the October 9 script at +5%, every scene fits at the planned durations without any wording change; the tightest clips are scene 04, the reasoning (0.2 s spare beyond the 0.2 s margin), and scene 09, Dr. Rivera (0.8 s spare).

### Mix

1. Per-scene voice clips are concatenated into a 120 s voice track (each clip starts 120 ms into its scene).
2. The music is trimmed/padded to 120 s with a 1.5 s fade-in and a 3 s fade-out.
3. Both are measured (EBU R128) and brought to −23 LUFS, then weighted **60/40** (voice −4.4 dB, music −8.0 dB: a 3.5 dB baseline gap).
4. `sidechaincompress` (keyed on the voice; `threshold=0.008:ratio=10:attack=15:release=450:knee=4`, override with `VIDEO_DUCK`) ducks the music while the voice speaks; `amix` (no normalization) sums them.
5. The mix is gained to about −16 LUFS, an `alimiter` at −3 dBFS catches the few voice peaks, and a two-pass **linear** `loudnorm` sets −16 LUFS / −1.5 dBTP. `render.py` fails if loudnorm would fall back to its dynamic mode, which would change the measured balance.

Measured on the October 9 render and unchanged on the October 10 transitions render (ffmpeg `ebur128`; voice and ducked-music stems as mixed, before the final common gain):

| Measure | Value |
| --- | --- |
| Voice track, integrated | −27.4 LUFS |
| Music as mixed (after ducking), integrated | −35.3 LUFS (7.9 LU below the voice) |
| Voice while speaking (momentary, energy average) | −27.5 LUFS |
| Music while the voice speaks | −41.1 LUFS — **13.7 LU below the voice** (target ≥ 10) |
| Music in pauses | −31.5 to −31.9 LUFS (ducking depth 9.2–9.6 dB; the pause-step count varies slightly between edge-tts runs) |
| Final MP4 | −16.0 LUFS integrated, LRA 2.4 LU, true peak −2.1 dBFS |

"While speaking" uses 100 ms steps where the voice's 400 ms momentary loudness is within 12 LU of its integrated level; "pauses" are steps where it is more than 35 LU below (excluding the first 2 s and the fade-out).

The deliverable is local. The existing production presentation asset allowlist intentionally does not publish this video; hosting/submission is a separate action.

## Validation

October 9, 2026 (Windows 11, edge-tts backend with music; narration script v2):

- Step 1 (`npm run build:demo` + preview on 4176): passed.
- Step 2 (`record.mjs`): passed. October 10 re-record with transitions: the tightest scenes are 06 (6.2 s of actions in 7 s), 09 (9.8 of 12 s) and 02 (8.0 of 10 s). All 12 scenes completed within their durations without page errors, with the script's UI assertions (María's SQ-006 row, "Best match selected" and its reasoning, José's "14 days earlier" offer, José Pérez in SQ-006 after acceptance, Ana's "No action needed" notification, 440 monthly seats).
- Step 3 (`render.py`, edge backend + music): passed on the first run. Voice clip lengths 4.6–13.1 s; every clip fits its scene with at least 0.2 s spare beyond the 0.2 s margin.
- Output (`ffprobe`): exactly 120.000 s; H.264 1920×1080, 30 fps, 3,600 frames; AAC 48 kHz stereo, 120.000 s; about 15.5 MB with transitions (8.5 MB before: the fades and eased scrolls add motion). `ffmpeg -v error -i smart-queue-demo-2min.mp4 -f null -` reported no decoding errors.
- Captions: `captions.vtt` has 12 cues on the scene boundaries; in the narration track the voice starts 0.12–0.21 s after each cue start.
- One frame per scene reviewed (0:09, 0:20, 0:30, 0:40, 0:50, 0:58, 1:05, 1:14, 1:24, 1:36, 1:50, 1:58): title slide, Ana's slide, María's cancelled appointment, the assistant's activity feed and reasoning, José's 14-days-earlier offer, his confirmation, the updated schedule (José in SQ-006, 3 waiting), Ana's notification, the capacity demo (440 seats), the "Why Smart Queue" slide and the closing slide. Caption titles were readable and matched the narration and the visual each time.
- `npm test` (frontend) and `node presentation/tests/validate.mjs`: passed.
- Transitions (October 10): ffmpeg scene detection on the app area found single-frame jumps before at every in-app view switch and scroll (scores 0.17–0.68) and on the deck slide flips (1.0 at 1:38 and 1:53). Afterwards the highest per-frame score is 0.43, and every remaining peak sits inside a curtain fade. Frames at −0.4, 0, +0.4 and +1.0 s around all 11 cues show the old view held up to the cue and a curtain dip or eased scroll after it. A caption band strip from 10.4 to 11.6 s shows the old text fully readable until about −0.1 s and the new text from about +0.1 s, fully opaque by +0.4 s. The final audio matches the voice stem at a constant −5 ms (AAC priming) at 0:11, 0:33, 1:01, 1:40 and 1:54. `VIDEO_XFADE=0` with music, and the default crossfade without music, were also rendered and passed `ffprobe` (120.000 s / 3,600 frames) and the decode check.
- The `say` backend was not run (no macOS available); on Windows it still stops at the first clip because `say` does not exist, as before.
