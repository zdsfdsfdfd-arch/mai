#!/usr/bin/env node
// Озвучка сценария и сборка таймлайна (Node-версия, работает на Windows, Linux, macOS).
//
//   ENGINE=edge        Microsoft Edge neural (бесплатно, нужен интернет, точные тайминги слов)   [по умолчанию]
//   ENGINE=elevenlabs  ElevenLabs API (ключ ELEVENLABS_API_KEY, точные тайминги слов)
//   ENGINE=sapi        голоса Windows через System.Speech (офлайн, например IVONA), тайминги пропорциональные
//
// Вход:  episode/script.json      Выход: public/audio/<scene>.wav, episode/timeline.json
// Разметка акцентов в тексте: *слово* = жёлтый, !несколько слов! = красный.
// Нужен ffmpeg (FFMPEG_BIN, по умолчанию «ffmpeg» из PATH) для перекодирования в PCM 24 кГц.

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "episode", "script.json");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const TIMELINE = path.join(ROOT, "episode", "timeline.json");

const ENGINE = process.env.ENGINE || "edge";
const FFMPEG = process.env.FFMPEG_BIN || "ffmpeg";
const EDGE_VOICE = process.env.EDGE_VOICE || "ru-RU-DmitryNeural";
const EDGE_RATE = process.env.EDGE_RATE || ""; // например "+8%" или "-5%"
const EL_KEY = process.env.ELEVENLABS_API_KEY || "";
const EL_VOICE = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
const EL_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const SAPI_VOICE = process.env.SAPI_VOICE || "IVONA 2 Maxim OEM";

const FPS = 30;
const LEAD_IN = 0.35;
const GAP = 0.28;
const TAIL = 0.55;
const MIN_SCENE = 2.4;
const SAMPLE_RATE = 24000;

// ---------- текст ----------
const splitPhrases = (text) =>
  text
    .trim()
    .split(/(?<=[.?…:])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

function parseWords(phrase) {
  const words = [];
  let yellow = false;
  let red = false;
  for (const tok of phrase.split(/\s+/)) {
    let t = tok;
    while (t && (t[0] === "*" || t[0] === "!")) {
      if (t[0] === "*") yellow = true;
      else red = true;
      t = t.slice(1);
    }
    let core = t;
    let closing = [];
    const m = /^(.*?)([*!]+)([.,:;…?]*)$/.exec(core);
    if (m && m[2]) {
      core = m[1] + m[3];
      closing = m[2].split("");
    }
    const accent = red ? "red" : yellow ? "yellow" : null;
    for (const c of closing) {
      if (c === "*") yellow = false;
      else red = false;
    }
    if (core) words.push({ text: core, accent });
  }
  return { words, clean: words.map((w) => w.text).join(" ") };
}

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const lettersOnly = (s) => s.replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();

// ---------- аудио ----------
function fileToPcm(file) {
  return execFileSync(FFMPEG, ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SAMPLE_RATE), "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
}

const silence = (sec) => Buffer.alloc(Math.round(sec * SAMPLE_RATE) * 2);

function writeWav(file, pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, pcm]));
}

// ---------- движки: возвращают { pcm, wordTimes | null } ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EDGE_BACKOFF_S = [3, 6, 12, 20, 20, 20, 20, 20, 20, 20, 20];

let edge = null;
async function synthEdge(text, tmpDir) {
  // Сервис Edge рвёт WebSocket сериями (похоже на троттлинг): до 12 попыток с нарастающей паузой
  // и короткая пауза после каждого успешного запроса.
  let lastErr = null;
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      if (!edge) {
        const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
        edge = new MsEdgeTTS({ connectionTimeoutMs: 15000, synthesisTimeoutMs: 90000 });
        await edge.setMetadata(EDGE_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
      }
      const dir = fs.mkdtempSync(path.join(tmpDir, "edge-"));
      const prosody = EDGE_RATE ? { rate: EDGE_RATE } : undefined;
      const { audioFilePath, metadataFilePath } = await edge.toFile(dir, escapeXml(text), prosody);
      const pcm = fileToPcm(audioFilePath);
      if (pcm.length < SAMPLE_RATE * 2 * 0.15) throw new Error("пустое аудио от сервиса");
      let wordTimes = null;
      if (metadataFilePath && fs.existsSync(metadataFilePath)) {
        const meta = JSON.parse(fs.readFileSync(metadataFilePath, "utf8"));
        wordTimes = (meta.Metadata || [])
          .filter((m) => m.Type === "WordBoundary")
          .map((m) => ({ text: m.Data.text.Text, start: m.Data.Offset / 1e7, end: (m.Data.Offset + m.Data.Duration) / 1e7 }));
      }
      await sleep(500);
      return { pcm, wordTimes };
    } catch (e) {
      lastErr = e;
      const wait = EDGE_BACKOFF_S[Math.min(attempt - 1, EDGE_BACKOFF_S.length - 1)];
      console.warn(`  edge: попытка ${attempt} не удалась (${e.message}), пауза ${wait} с`);
      try {
        edge?.close();
      } catch {}
      edge = null;
      await sleep(wait * 1000);
    }
  }
  throw lastErr;
}

// Кэш озвученных фраз: повторный запуск не переозвучивает готовое (ключ = движок, голос, текст).
const CACHE_DIR = path.join(ROOT, ".tts-cache");
function cacheKey(text) {
  const voice = ENGINE === "edge" ? EDGE_VOICE : ENGINE === "elevenlabs" ? `${EL_VOICE}:${EL_MODEL}` : SAPI_VOICE;
  return createHash("sha1").update(`${ENGINE}|${voice}|${EDGE_RATE}|${text}`).digest("hex");
}
async function synthCached(text, tmpDir) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const base = path.join(CACHE_DIR, cacheKey(text));
  if (fs.existsSync(`${base}.pcm`) && fs.existsSync(`${base}.json`)) {
    return { pcm: fs.readFileSync(`${base}.pcm`), wordTimes: JSON.parse(fs.readFileSync(`${base}.json`, "utf8")) };
  }
  const r = await synth(text, tmpDir);
  fs.writeFileSync(`${base}.pcm`, r.pcm);
  fs.writeFileSync(`${base}.json`, JSON.stringify(r.wordTimes));
  return r;
}

async function synthElevenLabs(text, tmpDir) {
  if (!EL_KEY) throw new Error("ELEVENLABS_API_KEY не задан");
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}/with-timestamps?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": EL_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: EL_MODEL }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const mp3 = path.join(tmpDir, `el-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);
  fs.writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
  const pcm = fileToPcm(mp3);
  let wordTimes = null;
  const al = data.alignment;
  if (al && Array.isArray(al.characters)) {
    wordTimes = [];
    let cur = null;
    al.characters.forEach((ch, i) => {
      if (/\s/.test(ch)) {
        if (cur) wordTimes.push(cur);
        cur = null;
        return;
      }
      if (!cur) cur = { text: ch, start: al.character_start_times_seconds[i], end: al.character_end_times_seconds[i] };
      else {
        cur.text += ch;
        cur.end = al.character_end_times_seconds[i];
      }
    });
    if (cur) wordTimes.push(cur);
  }
  return { pcm, wordTimes };
}

function synthSapi(text, tmpDir) {
  const txt = path.join(tmpDir, `sapi-${Date.now()}.txt`);
  const wav = path.join(tmpDir, `sapi-${Date.now()}.wav`);
  fs.writeFileSync(txt, text, "utf8");
  const ps = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('${SAPI_VOICE.replace(/'/g, "''")}')
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(${SAMPLE_RATE}, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$s.SetOutputToWaveFile('${wav.replace(/'/g, "''")}', $fmt)
$s.Speak([IO.File]::ReadAllText('${txt.replace(/'/g, "''")}', [Text.Encoding]::UTF8))
$s.Dispose()`;
  const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`SAPI: ${r.stderr || r.stdout}`);
  return { pcm: fileToPcm(wav), wordTimes: null };
}

async function synth(text, tmpDir) {
  if (ENGINE === "edge") return synthEdge(text, tmpDir);
  if (ENGINE === "elevenlabs") return synthElevenLabs(text, tmpDir);
  if (ENGINE === "sapi") return synthSapi(text, tmpDir);
  throw new Error(`Неизвестный ENGINE: ${ENGINE}`);
}

// ---------- тайминги слов ----------
function proportional(words, start, end) {
  const weights = words.map((w) => {
    let wt = lettersOnly(w.text).length + 0.8;
    if (/[,:;]$/.test(w.text)) wt += 1.6;
    return wt;
  });
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let t = start;
  return words.map((w, i) => {
    const d = ((end - start) * weights[i]) / total;
    const out = { text: w.text, start: +t.toFixed(3), end: +(t + d).toFixed(3), accent: w.accent };
    t += d;
    return out;
  });
}

function alignWords(words, wordTimes, start, end) {
  const wt = (wordTimes || []).filter((w) => lettersOnly(w.text).length > 0);
  if (wt.length === 0 || wt.length !== words.length) return proportional(words, start, end);
  return words.map((w, i) => ({ text: w.text, start: +(start + wt[i].start).toFixed(3), end: +(start + wt[i].end).toFixed(3), accent: w.accent }));
}

// ---------- готовые файлы озвучки (ElevenLabs из веб-интерфейса и т. п.) ----------
// ENGINE=files, VOICE_DIR=episode/voice. Либо по файлу на сцену (s01.mp3 … s12.mp3),
// либо один файл all.mp3, где сцены разделены паузами не короче 0,9 с.
// Границы фраз внутри сцены находятся по паузам (silencedetect), слова распределяются пропорционально.
const VOICE_DIR = path.resolve(ROOT, process.env.VOICE_DIR || "episode/voice");

function detectSilences(file, noiseDb, minDur) {
  const r = spawnSync(FFMPEG, ["-i", file, "-af", `silencedetect=noise=${noiseDb}dB:d=${minDur}`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const out = [];
  let start = null;
  for (const m of (r.stderr || "").matchAll(/silence_(start|end): ([\d.]+)/g)) {
    if (m[1] === "start") start = parseFloat(m[2]);
    else if (start !== null) {
      out.push([start, parseFloat(m[2])]);
      start = null;
    }
  }
  if (start !== null) out.push([start, Infinity]);
  return out;
}

function findVoiceFile(base) {
  for (const ext of ["wav", "mp3", "m4a", "ogg", "flac", "aac"]) {
    const p = path.join(VOICE_DIR, `${base}.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Выбирает из найденных пауз те n−1, при которых длительности фраз ближе всего
// к пропорции длин их текста (перебор сочетаний, пауз обычно меньше 15).
function bestBoundaries(phrasesSrc, inner, a, b) {
  const need = phrasesSrc.length - 1;
  if (need === 0) return [];
  let cand = inner;
  if (cand.length > 14) cand = cand.slice().sort((x, y) => y[1] - y[0] - (x[1] - x[0])).slice(0, 14).sort((x, y) => x[0] - y[0]);
  if (cand.length < need) return null;
  const lens = phrasesSrc.map((p) => Math.max(1, lettersOnly(p).length));
  const totalLen = lens.reduce((x, y) => x + y, 0);
  let best = null;
  let bestCost = Infinity;
  const pick = [];
  const rec = (from, k) => {
    if (k === need) {
      let cur = a;
      let cost = 0;
      for (let i = 0; i < phrasesSrc.length; i++) {
        const end = i < need ? pick[i][0] : b;
        const expected = ((b - a) * lens[i]) / totalLen;
        cost += Math.pow((end - cur - expected) / (b - a), 2);
        if (i < need) cur = pick[i][1];
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = pick.slice();
      }
      return;
    }
    for (let j = from; j <= cand.length - (need - k); j++) {
      pick.push(cand[j]);
      rec(j + 1, k + 1);
      pick.pop();
    }
  };
  rec(0, 0);
  return best;
}

// Разбивает отрезок [a, b] записи на фразы по паузам внутри него.
function phrasesFromSegment(phrasesSrc, silences, a, b) {
  const inner = silences.filter(([s, e]) => s > a + 0.05 && e < b - 0.05);
  const need = phrasesSrc.length - 1;
  const bounds = bestBoundaries(phrasesSrc, inner, a, b) || [];
  const phrases = [];
  let cur = a;
  for (let i = 0; i < phrasesSrc.length; i++) {
    const { words, clean } = parseWords(phrasesSrc[i]);
    let end;
    if (bounds.length === need) end = i < need ? bounds[i][0] : b;
    else {
      // пауз не хватило: делим пропорционально длине текста
      const total = phrasesSrc.reduce((s, p) => s + p.length, 0);
      end = i < phrasesSrc.length - 1 ? cur + ((b - a) * phrasesSrc[i].length) / total : b;
    }
    phrases.push({ text: clean, start: cur, end, words });
    cur = bounds.length === need && i < need ? bounds[i][1] : end;
  }
  return phrases;
}

function buildFromFiles(script) {
  const all = findVoiceFile("all");
  const scenesOut = [];
  let cursor = 0;
  const pushScene = (scene, pcmFile, silences, a, b, phrasesSrc) => {
    // a, b — границы речи сцены в секундах внутри pcmFile (без тишины по краям)
    const full = fileToPcm(pcmFile);
    const s0 = Math.max(0, Math.floor((a - 0.08) * SAMPLE_RATE)) * 2;
    const s1 = Math.min(full.length / 2, Math.ceil((b + 0.12) * SAMPLE_RATE)) * 2;
    const voice = full.subarray(s0, s1);
    // позиция в исходном файле → позиция в WAV сцены (речь начинается после LEAD_IN)
    const offset = LEAD_IN - s0 / 2 / SAMPLE_RATE;
    const phrases = phrasesFromSegment(phrasesSrc, silences, a, b).map((p) => ({
      text: p.text,
      start: +(p.start + offset).toFixed(3),
      end: +(p.end + offset).toFixed(3),
      words: proportional(p.words, p.start + offset, p.end + offset),
    }));
    const chunks = [silence(LEAD_IN), voice, silence(TAIL)];
    let duration = LEAD_IN + voice.length / 2 / SAMPLE_RATE + TAIL;
    if (duration < MIN_SCENE) {
      chunks.push(silence(MIN_SCENE - duration));
      duration = MIN_SCENE;
    }
    writeWav(path.join(AUDIO_DIR, `${scene.id}.wav`), Buffer.concat(chunks));
    const frames = Math.ceil(duration * FPS);
    scenesOut.push({
      id: scene.id,
      type: scene.type,
      startFrame: cursor,
      durationFrames: frames,
      audio: `audio/${scene.id}.wav`,
      audioDuration: +duration.toFixed(3),
      phrases,
      props: scene.props || {},
      character: scene.character,
      topPlaque: scene.topPlaque,
      status: scene.status,
    });
    cursor += frames;
    console.log(`${scene.id.padStart(4)} ${scene.type.padEnd(18)} ${duration.toFixed(2).padStart(6)} с  ${phrases.length} фраз  (${path.basename(pcmFile)} ${a.toFixed(2)}–${b.toFixed(2)} с)`);
  };

  if (all) {
    const silences = detectSilences(all, -38, 0.22);
    const dur = fileToPcm(all).length / 2 / SAMPLE_RATE;
    const long = silences.filter(([s, e]) => e - s >= 0.9 && s > 0.3 && e < dur - 0.3);
    if (long.length !== script.scenes.length - 1) {
      throw new Error(`В ${path.basename(all)} найдено ${long.length} длинных пауз (≥0,9 с), а нужно ${script.scenes.length - 1}: по одной между сценами`);
    }
    let a = silences.length && silences[0][0] < 0.05 ? silences[0][1] : 0;
    const last = silences[silences.length - 1];
    const fileEnd = last && (last[1] === Infinity || last[1] > dur - 0.05) ? last[0] : dur;
    script.scenes.forEach((scene, i) => {
      const b = i < long.length ? long[i][0] : fileEnd;
      pushScene(scene, all, silences, a, b, splitPhrases(scene.narration));
      if (i < long.length) a = long[i][1];
    });
  } else {
    for (const scene of script.scenes) {
      const f = findVoiceFile(scene.id);
      if (!f) throw new Error(`Нет файла озвучки для сцены ${scene.id} в ${VOICE_DIR} (ожидался ${scene.id}.mp3 или .wav, либо all.mp3)`);
      const silences = detectSilences(f, -38, 0.22);
      const dur = fileToPcm(f).length / 2 / SAMPLE_RATE;
      const a = silences.length && silences[0][0] < 0.05 ? silences[0][1] : 0;
      const last = silences[silences.length - 1];
      const b = last && (last[1] === Infinity || last[1] > dur - 0.05) ? last[0] : dur;
      pushScene(scene, f, silences, a, b, splitPhrases(scene.narration));
    }
  }
  return { scenesOut, cursor };
}

// ---------- сборка ----------
async function main() {
  const script = JSON.parse(fs.readFileSync(SCRIPT, "utf8"));
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  if (ENGINE === "files") {
    const { scenesOut, cursor } = buildFromFiles(script);
    const timeline = {
      fps: FPS,
      width: 1080,
      height: 1920,
      totalFrames: cursor,
      series: script.series,
      part: script.part,
      channel: script.channel || "",
      dayLabel: script.dayLabel || "",
      scenes: scenesOut,
    };
    fs.writeFileSync(TIMELINE, JSON.stringify(timeline, null, 1), "utf8");
    console.log(`итого ${(cursor / FPS).toFixed(1)} с, ${cursor} кадров, движок files (${VOICE_DIR}) → ${TIMELINE}`);
    return;
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tts-"));
  const scenes = [];
  let cursor = 0;
  let exact = 0;
  let total = 0;

  for (const scene of script.scenes) {
    const phrasesSrc = splitPhrases(scene.narration);
    const chunks = [silence(LEAD_IN)];
    let t = LEAD_IN;
    const phrases = [];
    for (let i = 0; i < phrasesSrc.length; i++) {
      const { words, clean } = parseWords(phrasesSrc[i]);
      const { pcm, wordTimes } = await synthCached(clean, tmpDir);
      const dur = pcm.length / 2 / SAMPLE_RATE;
      chunks.push(pcm);
      const aligned = alignWords(words, wordTimes, t, t + dur);
      total += 1;
      if (wordTimes && wordTimes.filter((w) => lettersOnly(w.text).length > 0).length === words.length) exact += 1;
      phrases.push({ text: clean, start: +t.toFixed(3), end: +(t + dur).toFixed(3), words: aligned });
      t += dur;
      if (i < phrasesSrc.length - 1) {
        chunks.push(silence(GAP));
        t += GAP;
      }
    }
    chunks.push(silence(TAIL));
    t += TAIL;
    const duration = Math.max(t, MIN_SCENE);
    if (duration > t) chunks.push(silence(duration - t));

    const audioRel = `audio/${scene.id}.wav`;
    writeWav(path.join(AUDIO_DIR, `${scene.id}.wav`), Buffer.concat(chunks));
    const frames = Math.ceil(duration * FPS);
    scenes.push({
      id: scene.id,
      type: scene.type,
      startFrame: cursor,
      durationFrames: frames,
      audio: audioRel,
      audioDuration: +duration.toFixed(3),
      phrases,
      props: scene.props || {},
      character: scene.character,
      topPlaque: scene.topPlaque,
      status: scene.status,
    });
    cursor += frames;
    console.log(`${scene.id.padStart(4)} ${scene.type.padEnd(18)} ${duration.toFixed(2).padStart(6)} с  ${phrases.length} фраз`);
  }

  const timeline = {
    fps: FPS,
    width: 1080,
    height: 1920,
    totalFrames: cursor,
    series: script.series,
    part: script.part,
    channel: script.channel || "",
    dayLabel: script.dayLabel || "",
    scenes,
  };
  fs.writeFileSync(TIMELINE, JSON.stringify(timeline, null, 1), "utf8");
  console.log(`итого ${(cursor / FPS).toFixed(1)} с, ${cursor} кадров, движок ${ENGINE}, точные тайминги слов: ${exact}/${total} фраз → ${TIMELINE}`);
  if (edge) edge.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
