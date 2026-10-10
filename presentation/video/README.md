# Two-minute application demo

Open **smart-queue-demo-2min.mp4**, or open `index.html` for an offline player.

- Duration: exactly **2:00**; 1920×1080, 30 fps, H.264 video / AAC audio.
- English synthetic narration: Microsoft neural voice **en-US-JennyNeural** (via `edge-tts`), over a quiet background music bed that dips whenever the voice speaks. Captions are burned into a separate band below the app; `captions.vtt` is also provided.
- Real browser recording of the single demo story: Ana's manual work today → María cancels in her own patient view → the AI assistant (simulated) detects the opening, scans four waiting patients and selects José with its real rule-based reasoning (P3 tie broken by the oldest request, Oct 4; Nicolás excluded, mornings only; Elena next) → offer → José explicitly accepts → the assistant updates the schedule and waitlist (4 → 3) → Ana is notified with a summary.
- A short section shows the **separate monthly capacity demo** (period statistics only). It does not pretend to share the guided story.
- Opening and closing use the existing HTML presentation, including the "Why AI?" slide: the assistant is simulated and rule-based (no AI model runs); a model-backed assistant is future work.
- All records are fictional. No production bookings or outbound messages are claimed.

See `NARRATION.md` for the short spoken script and `scenes.json` for exact scene durations. Manual clicks are visually highlighted in the recording; these recording-only outlines do not alter application logic.

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

### Voice choice

Jenny and Aria (`en-US-AriaNeural`) were both generated for all twelve scenes. Jenny was chosen: Microsoft lists it as a general-purpose, friendly voice (Aria is tuned for news/novel reading), and at the same rate its narration is about 4.5% shorter in total, so a +5% rate fits every scene instead of a larger speed-up. At +5% the tightest clips are the closing line (0.4 s spare) and scene 01 (0.8 s spare).

The closing line did not fit its six seconds in any setting: Jenny pauses after each of its five one- or two-word sentences (about 8 s of speech even at +5%). Its punctuation was changed, not its words — "Fictional patients, browser-only simulation. Smart Queue: less waiting, better care." — which brings it to 5.6 s.

### Mix

1. Per-scene voice clips are concatenated into a 120 s voice track (each clip starts 120 ms into its scene).
2. The music is trimmed/padded to 120 s with a 1.5 s fade-in and a 3 s fade-out.
3. Both are measured (EBU R128) and brought to −23 LUFS, then weighted **60/40** (voice −4.4 dB, music −8.0 dB: a 3.5 dB baseline gap).
4. `sidechaincompress` (keyed on the voice; `threshold=0.008:ratio=10:attack=15:release=450:knee=4`, override with `VIDEO_DUCK`) ducks the music while the voice speaks; `amix` (no normalization) sums them.
5. The mix is gained to about −16 LUFS, an `alimiter` at −3 dBFS catches the few voice peaks, and a two-pass **linear** `loudnorm` sets −16 LUFS / −1.5 dBTP. `render.py` fails if loudnorm would fall back to its dynamic mode, which would change the measured balance.

Measured on the October 9 render (ffmpeg `ebur128`; voice and ducked-music stems as mixed, before the final common gain):

| Measure | Value |
| --- | --- |
| Voice track, integrated | −27.4 LUFS |
| Music as mixed (after ducking), integrated | −33.4 LUFS (6.0 LU below the voice) |
| Voice while speaking (momentary, energy average) | −27.4 LUFS |
| Music while the voice speaks | −40.6 LUFS — **13.2 LU below the voice** (target ≥ 10) |
| Music in pauses | −31.1 LUFS (ducking depth 9.5 dB) |
| Final MP4 | −16.0 LUFS integrated, LRA 3.1 LU, true peak −2.6 dBFS |

"While speaking" uses 100 ms steps where the voice's 400 ms momentary loudness is within 12 LU of its integrated level; "pauses" are steps where it is more than 35 LU below (excluding the first 2 s and the fade-out).

The deliverable is local. The existing production presentation asset allowlist intentionally does not publish this video; hosting/submission is a separate action.

## Validation

October 9, 2026 (Windows 11, edge-tts backend with music):

- Step 1 (`npm run build:demo` + preview on 4176): passed.
- Step 2 (`record.mjs`): passed. All 12 scenes completed within their durations without page errors, with the script's UI assertions (María's SQ-006 row, "Best match selected" and its reasoning, José's "14 days earlier" offer, José Pérez in SQ-006 after acceptance, Ana's "No action needed" notification, 440 monthly seats).
- Step 3 (`render.py`, edge backend + music): passed. Voice clip lengths 5.6–9.6 s; every clip fits its scene with at least 0.4 s spare.
- Output (`ffprobe`): exactly 120.000 s; H.264 1920×1080, 30 fps, 3,600 frames; AAC 48 kHz stereo, 120.000 s; about 8.5 MB. `ffmpeg -v error -i smart-queue-demo-2min.mp4 -f null -` reported no decoding errors.
- Captions: `captions.vtt` has 12 cues on the scene boundaries; in the narration track the voice starts 0.12–0.21 s after each cue start.
- Frames reviewed at 0:03 (title slide), 0:20 (María's cancel view), 0:45 (assistant reasoning: oldest request Oct 4, Elena next), 1:04 (José's offer, 14 days earlier), 1:28 (Ana's notification, waitlist 3) and 1:40 (separate capacity demo); 1:57 caption band checked for the closing line. Captions were readable and matched the scene each time.
- The `say` backend was not run (no macOS available); on Windows it still stops at the first clip because `say` does not exist, as before.
