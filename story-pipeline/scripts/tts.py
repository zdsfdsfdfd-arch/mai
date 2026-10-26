#!/usr/bin/env python3
"""Озвучка сценария и сборка таймлайна.

Вход:  episode/script.json
Выход: public/audio/<scene>.wav, episode/timeline.json

Движок: piper (офлайн). В проде заменяется на ElevenLabs/SpeechKit: достаточно
реализовать synth_phrase(), возвращающую WAV и (опционально) точные тайминги слов.
Разметка акцентов в тексте: *слово* = жёлтый, !несколько слов! = красный.
"""
from __future__ import annotations

import json
import math
import os
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "episode" / "script.json"
AUDIO_DIR = ROOT / "public" / "audio"
TIMELINE = ROOT / "episode" / "timeline.json"

PIPER = os.environ.get("PIPER_BIN", "piper")
PIPER_MODEL = os.environ.get("PIPER_MODEL", "")
LENGTH_SCALE = float(os.environ.get("PIPER_LENGTH_SCALE", "1.0"))

FPS = 30
LEAD_IN = 0.35      # тишина перед первой фразой сцены
GAP = 0.28          # пауза между фразами
TAIL = 0.55         # хвост после последней фразы
MIN_SCENE = 2.4     # минимальная длительность сцены, сек

SAMPLE_RATE = 22050


def split_phrases(text: str) -> list[str]:
    # Делим по . ? … : (не по «!», он занят под разметку акцентов)
    parts = re.split(r"(?<=[.?…:])\s+", text.strip())
    return [p for p in (x.strip() for x in parts) if p]


def parse_words(phrase: str):
    """Разбирает слова и акценты. Возвращает (слова_для_субтитров, чистый_текст_для_озвучки)."""
    words = []
    yellow = False
    red = False
    for tok in phrase.split():
        t = tok
        acc = None
        # открывающие маркеры
        while t and t[0] in "*!":
            if t[0] == "*":
                yellow = True
            else:
                red = True
            t = t[1:]
        # закрывающие маркеры могут стоять после знаков препинания: "процентов!."
        closing = []
        core = t
        m = re.match(r"^(.*?)([*!]+)([.,:;…?]*)$", core)
        if m and m.group(2):
            core = m.group(1) + m.group(3)
            closing = list(m.group(2))
        acc = "red" if red else ("yellow" if yellow else None)
        for c in closing:
            if c == "*":
                yellow = False
            else:
                red = False
        if core:
            words.append({"text": core, "accent": acc})
    clean = " ".join(w["text"] for w in words)
    return words, clean


def synth_phrase(text: str, out_wav: Path) -> float:
    """Озвучивает одну фразу в WAV, возвращает длительность в секундах."""
    if not PIPER_MODEL:
        sys.exit("PIPER_MODEL не задан (путь к .onnx)")
    cmd = [PIPER, "-m", PIPER_MODEL, "-f", str(out_wav), "--length-scale", str(LENGTH_SCALE)]
    subprocess.run(cmd, input=text.encode("utf-8"), check=True, capture_output=True)
    with wave.open(str(out_wav), "rb") as w:
        assert w.getframerate() == SAMPLE_RATE and w.getnchannels() == 1 and w.getsampwidth() == 2
        return w.getnframes() / w.getframerate()


def word_timings(words, start: float, end: float):
    """Распределяет длительность фразы по словам пропорционально длине (пока нет точных таймингов TTS)."""
    weights = []
    for w in words:
        core = re.sub(r"[^\w]", "", w["text"])
        wt = len(core) + 0.8
        if w["text"].endswith((",", ":", ";")):
            wt += 1.6
        weights.append(wt)
    total = sum(weights) or 1.0
    t = start
    out = []
    for w, wt in zip(words, weights):
        d = (end - start) * wt / total
        out.append({"text": w["text"], "start": round(t, 3), "end": round(t + d, 3), "accent": w["accent"]})
        t += d
    return out


def silence(seconds: float) -> bytes:
    return b"\x00\x00" * int(seconds * SAMPLE_RATE)


def main():
    script = json.loads(SCRIPT.read_text(encoding="utf-8"))
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    scenes_out = []
    cursor = 0
    tmp = Path(tempfile.mkdtemp(prefix="tts-"))

    for scene in script["scenes"]:
        phrases_src = split_phrases(scene["narration"])
        pcm = bytearray(silence(LEAD_IN))
        t = LEAD_IN
        phrases = []
        for i, ph in enumerate(phrases_src):
            words, clean = parse_words(ph)
            wav_path = tmp / f"{scene['id']}_{i}.wav"
            dur = synth_phrase(clean, wav_path)
            with wave.open(str(wav_path), "rb") as w:
                pcm += w.readframes(w.getnframes())
            phrases.append({
                "text": clean,
                "start": round(t, 3),
                "end": round(t + dur, 3),
                "words": word_timings(words, t, t + dur),
            })
            t += dur
            if i < len(phrases_src) - 1:
                pcm += silence(GAP)
                t += GAP
        pcm += silence(TAIL)
        t += TAIL
        duration = max(t, MIN_SCENE)
        if duration > t:
            pcm += silence(duration - t)

        audio_rel = f"audio/{scene['id']}.wav"
        with wave.open(str(AUDIO_DIR / f"{scene['id']}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SAMPLE_RATE)
            w.writeframes(bytes(pcm))

        frames = math.ceil(duration * FPS)
        scenes_out.append({
            "id": scene["id"],
            "type": scene["type"],
            "startFrame": cursor,
            "durationFrames": frames,
            "audio": audio_rel,
            "audioDuration": round(duration, 3),
            "phrases": phrases,
            "props": scene.get("props", {}),
            "character": scene.get("character"),
            "topPlaque": scene.get("topPlaque"),
            "status": scene.get("status"),
        })
        cursor += frames
        print(f"{scene['id']:>4} {scene['type']:<18} {duration:6.2f} s  {len(phrases)} фраз")

    timeline = {
        "fps": FPS,
        "width": 1080,
        "height": 1920,
        "totalFrames": cursor,
        "series": script["series"],
        "part": script["part"],
        "channel": script.get("channel", ""),
        "dayLabel": script.get("dayLabel", ""),
        "scenes": scenes_out,
    }
    TIMELINE.write_text(json.dumps(timeline, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"итого {cursor / FPS:.1f} с, {cursor} кадров → {TIMELINE}")


if __name__ == "__main__":
    main()
