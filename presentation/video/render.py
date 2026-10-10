"""Render the recorded UI, narration, and captions as a 120-second MP4.
Requires ffmpeg (VIDEO_FFMPEG). Narration backend (VIDEO_TTS):
- `say` (default): macOS `say` with the Samantha voice; no music unless VIDEO_MUSIC is set.
- `edge`: Microsoft neural voices via the `edge-tts` CLI (VIDEO_EDGE_TTS, VIDEO_TTS_VOICE,
  VIDEO_TTS_RATE). edge-tts calls Microsoft's online TTS service with the narration text.
VIDEO_MUSIC=<audio file> adds a background bed: 60/40 voice/music baseline, sidechain-ducked
under the voice, faded in/out, then two-pass linear loudnorm. No application dependencies.
"""
import json, math, os, pathlib, re, subprocess, wave
ROOT = pathlib.Path(__file__).resolve().parent
WORK = pathlib.Path(os.environ.get('VIDEO_WORK_DIR', '/tmp/smart-queue-video-work'))
FFMPEG = os.environ.get('VIDEO_FFMPEG', 'ffmpeg')
TTS = os.environ.get('VIDEO_TTS', 'say')
MUSIC = os.environ.get('VIDEO_MUSIC')
scenes = json.loads((ROOT / 'scenes.json').read_text(encoding='utf-8'))
timeline = json.loads((WORK / 'timeline.json').read_text(encoding='utf-8'))
assert sum(s['duration'] for s in scenes) == 120

def synthesize(text, voice):
    if TTS == 'say':
        subprocess.run(['say', '-v', 'Samantha', '--file-format=WAVE', '--data-format=LEI16', '-r', '165', '-o', str(voice), text], check=True)
        return
    if TTS != 'edge':
        raise RuntimeError(f'Unknown VIDEO_TTS backend: {TTS}')
    mp3 = voice.with_suffix('.mp3')
    subprocess.run([os.environ.get('VIDEO_EDGE_TTS', 'edge-tts'), '--voice', os.environ.get('VIDEO_TTS_VOICE', 'en-US-JennyNeural'), f"--rate={os.environ.get('VIDEO_TTS_RATE', '+5%')}", '--text', text, '--write-media', str(mp3)], check=True)
    # Trim the service's leading/trailing silence so the 120 ms scene offset is the real voice start.
    trim = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse'
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(mp3), '-af', trim, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', str(voice)], check=True)

def ffmpeg_stderr(args):
    return subprocess.run([FFMPEG, '-hide_banner', '-nostats', *args], capture_output=True, text=True, check=True).stderr

def integrated(path):
    out = ffmpeg_stderr(['-i', str(path), '-af', 'ebur128', '-f', 'null', '-'])
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])

for i, (scene, timing) in enumerate(zip(scenes, timeline)):
    voice = WORK / f'voice-{i:02}.wav'
    synthesize(scene['text'], voice)
    with wave.open(str(voice)) as audio:
        duration = audio.getnframes() / audio.getframerate()
    if duration + .2 > scene['duration']:
        raise RuntimeError(f'Narration too long in scene {i + 1}: {duration}')
    filters = f"[0:v]setpts=PTS-STARTPTS,fps=30,scale=1600:800,tpad=stop_mode=clone:stop_duration=1,pad=1600:900:0:0:color=0x142747[screen];[screen][1:v]overlay=0:800,scale=1920:1080,setsar=1,format=yuv420p[v];[2:a]adelay=120,apad,atrim=duration={scene['duration']}[a]"
    command = [FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(timing['offset']), '-i', str(WORK / 'recording.webm'), '-loop', '1', '-i', str(WORK / f'caption-{i:02}.png'), '-i', str(voice), '-filter_complex', filters, '-map', '[v]', '-map', '[a]', '-t', str(scene['duration']), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-threads', '4', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', str(WORK / f'part-{i:02}.mp4')]
    subprocess.run(command, check=True)
    print(f"Rendered {i + 1}/12 · {scene['title']} · voice {duration:.2f}s", flush=True)
(WORK / 'parts.txt').write_text(''.join(f"file '{(WORK / f'part-{i:02}.mp4').as_posix()}'\nduration {scenes[i]['duration']}\n" for i in range(len(scenes))), encoding='utf-8')
output = ROOT / 'smart-queue-demo-2min.mp4'
concat = ['-f', 'concat', '-safe', '0', '-i', str(WORK / 'parts.txt')]
video_args = ['-vf', 'fps=30,setpts=N/(30*TB),tpad=stop_mode=clone:stop_duration=1', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-threads', '4']
if not MUSIC:
    audio_in, audio_args = [], ['-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,asetpts=N/SR/TB,atrim=duration=120']
else:
    # Voice track (scene parts) and music bed (trimmed/padded to 120 s, faded), each measured.
    voice_track, bed = WORK / 'voice-track.wav', WORK / 'music-bed.wav'
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *concat, '-vn', '-af', 'aresample=48000,asetpts=N/SR/TB,apad,atrim=duration=120', '-ac', '2', '-c:a', 'pcm_s16le', str(voice_track)], check=True)
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', MUSIC, '-af', 'aresample=48000,atrim=duration=120,apad,atrim=duration=120,afade=t=in:d=1.5,afade=t=out:st=117:d=3', '-ac', '2', '-c:a', 'pcm_f32le', str(bed)], check=True)
    # Bring both to -23 LUFS, then weight 60/40 (music 3.5 dB under voice) and duck music under speech.
    gv, gm = -23 - integrated(voice_track), -23 - integrated(bed)
    gv += 20 * math.log10(.6)
    gm += 20 * math.log10(.4)
    duck = os.environ.get('VIDEO_DUCK', 'threshold=0.008:ratio=10:attack=15:release=450:knee=4')
    graph = (f'[0:a]volume={gv:.2f}dB,asplit=3[vkey][vmix][vout];[1:a]volume={gm:.2f}dB[bed];'
             f'[bed][vkey]sidechaincompress={duck},asplit=2[mmix][mout];'
             '[vmix][mmix]amix=inputs=2:normalize=0:duration=first[mix]')
    raw, mix = WORK / 'mix-raw.wav', WORK / 'mix.wav'
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(voice_track), '-i', str(bed), '-filter_complex', graph,
                    '-map', '[mix]', '-c:a', 'pcm_f32le', str(raw), '-map', '[vout]', '-c:a', 'pcm_f32le', str(WORK / 'stem-voice.wav'),
                    '-map', '[mout]', '-c:a', 'pcm_f32le', str(WORK / 'stem-music.wav')], check=True)
    # Gain to about -16 LUFS and catch the few voice peaks, so the final loudnorm can stay linear
    # (a dynamic loudnorm would change the voice/music balance measured on the stems).
    raw_i = integrated(raw)
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(raw), '-af', f'volume={-16 - raw_i:.2f}dB,alimiter=limit=0.708:attack=5:release=50:level=disabled', '-c:a', 'pcm_f32le', str(mix)], check=True)
    measure = lambda f: json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', ffmpeg_stderr(['-i', str(mix), '-af', f, '-f', 'null', '-'])).group(0))
    stats = measure('loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json')
    norm = (f"loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}"
            f":measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}")
    if measure(norm + ':print_format=json')['normalization_type'] != 'linear':
        raise RuntimeError(f'Final loudnorm would not be linear (true peak {stats["input_tp"]} dBTP)')
    print(f"Mix: voice gain {gv:.2f} dB, music gain {gm:.2f} dB, raw mix {raw_i} LUFS, limited mix {stats['input_i']} LUFS / {stats['input_tp']} dBTP, linear loudnorm to -16", flush=True)
    audio_in = ['-i', str(mix)]
    audio_args = ['-map', '0:v', '-map', '1:a', '-af', f'{norm},aresample=48000,asetpts=N/SR/TB,atrim=duration=120']
subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *concat, *audio_in, *video_args, *audio_args, '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', '-t', '120', '-movflags', '+faststart', str(output)], check=True)
start = 0
vtt = ['WEBVTT', '']
narrator = 'macOS Samantha' if TTS == 'say' else f"Microsoft neural voice {os.environ.get('VIDEO_TTS_VOICE', 'en-US-JennyNeural')} via edge-tts, rate {os.environ.get('VIDEO_TTS_RATE', '+5%')}"
notes = ['# Smart Queue — two-minute screen demo', '', f"English narration ({narrator}{', with background music' if MUSIC else ''}) · exactly 2:00 · fictional data and real local UI interactions.", '', 'The AI assistant shown is simulated and rule-based: no AI model, no network. The separate monthly dataset is explicitly identified. No production bookings or messaging are claimed.', '']
def clock(t):
    return f'{t // 3600:02}:{(t // 60) % 60:02}:{t % 60:02}.000'
for i, scene in enumerate(scenes):
    end = start + scene['duration']
    vtt += [str(i + 1), f'{clock(start)} --> {clock(end)}', scene['text'], '']
    notes += [f"## {start // 60}:{start % 60:02}–{end // 60}:{end % 60:02} · {scene['title']}", '', scene['text'], '']
    start = end
(ROOT / 'captions.vtt').write_bytes('\n'.join(vtt).encode('utf-8'))
(ROOT / 'NARRATION.md').write_bytes('\n'.join(notes).encode('utf-8'))
print(f'Created {output}: {output.stat().st_size / 1_000_000:.2f} MB', flush=True)
