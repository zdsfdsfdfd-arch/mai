#!/usr/bin/env node
// Генератор фоновой музыки: тёмный саспенс-эмбиент под сюжетные ролики, без чужих треков.
// Слои: низкий гул (минорный ход i–♭VI–♭VII–i), «сердцебиение» на каждую долю, тиканье,
// холодный верхний пад, нарастания перед сменой сцены. Напряжение растёт по сценам
// (поле tension 0..1 в script.json или линейный рост по умолчанию).
//
// Вход:  episode/timeline.json (+ music в episode/script.json)   Выход: public/audio/music.wav (стерео 44,1 кГц)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, "episode", "timeline.json"), "utf8"));
const script = JSON.parse(fs.readFileSync(path.join(ROOT, "episode", "script.json"), "utf8"));
const OUT = path.join(ROOT, "public", "audio", "music.wav");

const cfg = {
  bpm: 76,
  root: 55, // A1
  heartbeat: 1, // 0..1
  tick: 0.6,
  drone: 1,
  shimmer: 0.5,
  risers: 1,
  ...(script.music || {}),
  ...(process.env.MUSIC_JSON ? JSON.parse(process.env.MUSIC_JSON) : {}),
};
const OUT_FILE = process.env.MUSIC_OUT || OUT;

const SR = 44100;
const fps = timeline.fps;
const total = timeline.totalFrames / fps + 1.0;
const N = Math.ceil(total * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

// ---------- напряжение по сценам ----------
const scenes = timeline.scenes.map((s, i) => {
  const src = script.scenes.find((x) => x.id === s.id) || {};
  const def = 0.3 + (0.7 * i) / Math.max(1, timeline.scenes.length - 1);
  return { start: s.startFrame / fps, end: (s.startFrame + s.durationFrames) / fps, tension: src.tension ?? def };
});
function tensionAt(t) {
  // плавный переход между сценами за 2 с
  let v = scenes[scenes.length - 1].tension;
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    if (t < s.end) {
      const prev = i > 0 ? scenes[i - 1].tension : s.tension;
      const k = Math.min(1, Math.max(0, (t - s.start) / 2));
      v = prev + (s.tension - prev) * (k * k * (3 - 2 * k));
      break;
    }
  }
  return v;
}

// ---------- утилиты ----------
const beat = 60 / cfg.bpm;
const TWO_PI = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// минорный ход: i, ♭VI, ♭VII, i (по 4 такта каждый)
const chordRatios = [1, 1.5874 / 2, 1.7818 / 2, 1];
const chordLen = 16 * beat;

function onePole(cutoff) {
  let y = 0;
  return (x, fc = cutoff) => {
    const a = clamp((TWO_PI * fc) / SR, 0, 0.99);
    y += a * (x - y);
    return y;
  };
}
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

// ---------- дрон ----------
{
  const lp1 = onePole(300);
  const lp2 = onePole(300);
  let ph1 = 0, ph2 = 0, ph3 = 0, ph4 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const ten = tensionAt(t);
    const chord = chordRatios[Math.floor(t / chordLen) % chordRatios.length];
    const f = cfg.root * chord;
    ph1 += (TWO_PI * f) / SR;
    ph2 += (TWO_PI * f * 1.004) / SR;
    ph3 += (TWO_PI * f * 0.5) / SR;
    ph4 += (TWO_PI * f * 1.5) / SR;
    // пила через ряд гармоник, мягкая
    const saw = (p) => ((p / TWO_PI) % 1) * 2 - 1;
    const raw = 0.35 * saw(ph1) + 0.35 * saw(ph2) + 0.5 * Math.sin(ph3) + 0.18 * saw(ph4);
    const lfo = 0.5 + 0.5 * Math.sin(TWO_PI * 0.045 * t);
    const fc = 140 + 320 * lfo + 500 * ten;
    const env = clamp(t / 6, 0, 1) * (0.55 + 0.45 * ten);
    const a = lp1(raw, fc) * 0.22 * env * cfg.drone;
    const b = lp2(raw, fc * 0.9) * 0.22 * env * cfg.drone;
    L[i] += a;
    R[i] += b;
  }
}

// ---------- сердцебиение ----------
if (cfg.heartbeat > 0) {
  const thump = (startSample, amp) => {
    const len = Math.floor(0.32 * SR);
    for (let k = 0; k < len && startSample + k < N; k++) {
      const tt = k / SR;
      const f = 40 + 40 * Math.exp(-tt * 18);
      const env = Math.exp(-tt * 9) * amp;
      const v = Math.sin(TWO_PI * f * tt) * env;
      L[startSample + k] += v;
      R[startSample + k] += v;
    }
  };
  for (let b = 0; b * beat < total; b++) {
    const t = b * beat;
    const ten = tensionAt(t);
    const amp = (0.25 + 0.45 * ten) * cfg.heartbeat * clamp(t / 4, 0, 1);
    thump(Math.floor(t * SR), amp);
    thump(Math.floor((t + 0.19) * SR), amp * 0.55);
  }
}

// ---------- тиканье ----------
if (cfg.tick > 0) {
  const bp = onePole(4000);
  for (let b = 0; b * beat < total; b++) {
    const t = b * beat + beat / 2;
    const ten = tensionAt(t);
    const amp = (0.06 + 0.1 * ten) * cfg.tick;
    const start = Math.floor(t * SR);
    const len = Math.floor(0.012 * SR);
    for (let k = 0; k < len && start + k < N; k++) {
      const env = Math.exp(-k / (0.0025 * SR));
      const n = rnd();
      const v = (n - bp(n, 1800)) * env * amp; // грубый band-pass: шум минус низ
      L[start + k] += v * 0.6;
      R[start + k] += v * 1.0;
    }
  }
}

// ---------- холодный верхний пад ----------
if (cfg.shimmer > 0) {
  let ph = 0, ph2 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const ten = tensionAt(t);
    const chord = chordRatios[Math.floor(t / chordLen) % chordRatios.length];
    const f = cfg.root * chord * 8;
    ph += (TWO_PI * f) / SR;
    ph2 += (TWO_PI * f * 1.5) / SR;
    const trem = 0.6 + 0.4 * Math.sin(TWO_PI * 0.3 * t);
    const v = (Math.sin(ph) * 0.6 + Math.sin(ph2) * 0.3) * 0.035 * trem * (0.4 + 0.6 * ten) * cfg.shimmer * clamp(t / 10, 0, 1);
    L[i] += v * (0.5 + 0.5 * Math.sin(TWO_PI * 0.07 * t));
    R[i] += v * (0.5 + 0.5 * Math.cos(TWO_PI * 0.07 * t));
  }
}

// ---------- нарастания перед сценами с ростом напряжения ----------
if (cfg.risers > 0) {
  const lp = onePole(400);
  for (let i = 1; i < scenes.length; i++) {
    if (scenes[i].tension <= scenes[i - 1].tension + 0.05) continue;
    const dur = 3.5;
    const t0 = scenes[i].start - dur;
    const s0 = Math.floor(Math.max(0, t0) * SR);
    const len = Math.floor(dur * SR);
    let ph = 0;
    for (let k = 0; k < len && s0 + k < N; k++) {
      const x = k / len;
      const env = Math.pow(x, 2.2) * 0.22 * cfg.risers;
      const n = lp(rnd(), 300 + 4000 * x);
      const f = 180 + 520 * x;
      ph += (TWO_PI * f) / SR;
      const v = (n * 0.7 + Math.sin(ph) * 0.12) * env;
      L[s0 + k] += v;
      R[s0 + k] += v;
    }
  }
}

// ---------- простой стерео-ревербератор (две линии задержки с обратной связью) ----------
{
  const d1 = Math.floor(0.271 * SR), d2 = Math.floor(0.317 * SR);
  const bufL = new Float32Array(d1), bufR = new Float32Array(d2);
  let i1 = 0, i2 = 0;
  const lpL = onePole(2200), lpR = onePole(2200);
  for (let i = 0; i < N; i++) {
    const wl = bufL[i1], wr = bufR[i2];
    bufL[i1] = lpL(L[i] + wr * 0.38);
    bufR[i2] = lpR(R[i] + wl * 0.38);
    L[i] += wl * 0.28;
    R[i] += wr * 0.28;
    i1 = (i1 + 1) % d1;
    i2 = (i2 + 1) % d2;
  }
}

// ---------- финальное затухание и нормализация ----------
{
  const fadeOut = 1.5 * SR;
  for (let i = N - fadeOut; i < N; i++) {
    const g = clamp((N - i) / fadeOut, 0, 1);
    L[i] *= g;
    R[i] *= g;
  }
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.7 / peak : 1;
  const pcm = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    pcm.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), i * 4);
    pcm.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, Buffer.concat([header, pcm]));
  console.log(`music: ${total.toFixed(1)} с, ${cfg.bpm} bpm, напряжение ${scenes[0].tension.toFixed(2)} → ${scenes[scenes.length - 1].tension.toFixed(2)} → ${OUT_FILE}`);
}
