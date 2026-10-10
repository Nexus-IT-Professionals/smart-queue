"""Render the recorded UI, local narration, and captions as a 120-second MP4.
Requires ffmpeg (VIDEO_FFMPEG) and macOS `say`; no application dependencies.
"""
import json, os, pathlib, subprocess, wave
ROOT = pathlib.Path(__file__).resolve().parent
WORK = pathlib.Path(os.environ.get('VIDEO_WORK_DIR', '/tmp/smart-queue-video-work'))
FFMPEG = os.environ.get('VIDEO_FFMPEG', 'ffmpeg')
scenes = json.loads((ROOT / 'scenes.json').read_text())
timeline = json.loads((WORK / 'timeline.json').read_text())
assert sum(s['duration'] for s in scenes) == 120
for i, (scene, timing) in enumerate(zip(scenes, timeline)):
    voice = WORK / f'voice-{i:02}.wav'
    subprocess.run(['say', '-v', 'Samantha', '--file-format=WAVE', '--data-format=LEI16', '-r', '165', '-o', str(voice), scene['text']], check=True)
    with wave.open(str(voice)) as audio:
        duration = audio.getnframes() / audio.getframerate()
    if duration + .2 > scene['duration']:
        raise RuntimeError(f'Narration too long in scene {i + 1}: {duration}')
    filters = f"[0:v]setpts=PTS-STARTPTS,fps=30,scale=1600:800,tpad=stop_mode=clone:stop_duration=1,pad=1600:900:0:0:color=0x142747[screen];[screen][1:v]overlay=0:800,scale=1920:1080,setsar=1,format=yuv420p[v];[2:a]adelay=120,apad,atrim=duration={scene['duration']}[a]"
    command = [FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(timing['offset']), '-i', str(WORK / 'recording.webm'), '-loop', '1', '-i', str(WORK / f'caption-{i:02}.png'), '-i', str(voice), '-filter_complex', filters, '-map', '[v]', '-map', '[a]', '-t', str(scene['duration']), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-threads', '4', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', str(WORK / f'part-{i:02}.mp4')]
    subprocess.run(command, check=True)
    print(f"Rendered {i + 1}/12 · {scene['title']}", flush=True)
(WORK / 'parts.txt').write_text(''.join(f"file '{WORK / f'part-{i:02}.mp4'}'\nduration {scenes[i]['duration']}\n" for i in range(len(scenes))))
output = ROOT / 'smart-queue-demo-2min.mp4'
subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(WORK / 'parts.txt'), '-vf', 'fps=30,setpts=N/(30*TB),tpad=stop_mode=clone:stop_duration=1', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-threads', '4', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,asetpts=N/SR/TB,atrim=duration=120', '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', '-t', '120', '-movflags', '+faststart', str(output)], check=True)
start = 0
vtt = ['WEBVTT', '']
notes = ['# Smart Queue — two-minute screen demo', '', 'English narration · exactly 2:00 · fictional data and real local UI interactions.', '', 'The AI assistant shown is simulated and rule-based: no AI model, no network. The separate monthly dataset is explicitly identified. No production bookings or messaging are claimed.', '']
def clock(t):
    return f'{t // 3600:02}:{(t // 60) % 60:02}:{t % 60:02}.000'
for i, scene in enumerate(scenes):
    end = start + scene['duration']
    vtt += [str(i + 1), f'{clock(start)} --> {clock(end)}', scene['text'], '']
    notes += [f"## {start // 60}:{start % 60:02}–{end // 60}:{end % 60:02} · {scene['title']}", '', scene['text'], '']
    start = end
(ROOT / 'captions.vtt').write_text('\n'.join(vtt))
(ROOT / 'NARRATION.md').write_text('\n'.join(notes))
print(f'Created {output}: {output.stat().st_size / 1_000_000:.2f} MB', flush=True)
