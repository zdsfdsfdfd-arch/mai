#!/usr/bin/env node
// Генератор звуковых эффектов интерфейса и монтажа (синтез, без чужих библиотек):
// cut (переход между сценами), whoosh, pop (появление плашки), click, knock (удар по стене),
// switch (выключение света), beep (нет сети), callfail (вызов сорвался), boom (акцент), chime (окно зажглось), rise.
// Выход: public/sfx/<name>.wav, 44,1 кГц моно.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "sfx");
const SR = 44100;
const TWO_PI = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
let seed = 777;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function onePole(fc) {
  let y = 0;
  return (x, f = fc) => {
    const a = clamp((TWO_PI * f) / SR, 0, 0.99);
    y += a * (x - y);
    return y;
  };
}

const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
const expEnv = (t, tau) => Math.exp(-t / tau);

// тон с глиссандо: f0 → f1 за glideSec, затухание tau
function tone(out, f0, f1, glideSec, tau, amp, start = 0) {
  let ph = 0;
  const s0 = Math.floor(start * SR);
  for (let i = s0; i < out.length; i++) {
    const t = (i - s0) / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t / Math.max(1e-4, glideSec));
    ph += (TWO_PI * f) / SR;
    out[i] += Math.sin(ph) * expEnv(t, tau) * amp;
  }
}

// шум через полосу (hp..lp), цепочка кривых по времени
function noise(out, len, env, hpAt, lpAt, amp, start = 0) {
  const hp = onePole(500);
  const lp = onePole(3000);
  const s0 = Math.floor(start * SR);
  const n = Math.floor(len * SR);
  for (let k = 0; k < n && s0 + k < out.length; k++) {
    const x = k / n;
    const r = rnd();
    const low = hp(r, hpAt(x));
    const v = lp(r - low, lpAt(x));
    out[s0 + k] += v * env(x) * amp;
  }
}

const sfx = {};

sfx.whoosh = () => {
  const o = buf(0.5);
  noise(o, 0.5, (x) => Math.pow(Math.sin(Math.PI * x), 1.6), (x) => 200 + 1400 * Math.sin(Math.PI * x), (x) => 900 + 5000 * Math.sin(Math.PI * x), 0.9);
  return o;
};

sfx.rise = () => {
  const o = buf(0.7);
  noise(o, 0.7, (x) => Math.pow(x, 1.5) * (1 - Math.pow(x, 12)), (x) => 150 + 1500 * x, (x) => 700 + 6000 * x, 0.8);
  tone(o, 220, 880, 0.0001, 0.7, 0.08);
  return o;
};

sfx.cut = () => {
  // короткий вжух + мягкий удар в конце: переход между сценами
  const o = buf(0.55);
  noise(o, 0.3, (x) => Math.pow(Math.sin(Math.PI * x), 1.3), (x) => 300 + 1800 * x, (x) => 1200 + 6000 * x, 0.7);
  tone(o, 90, 48, 0.08, 0.16, 0.8, 0.22);
  noise(o, 0.08, (x) => Math.exp(-x * 5), () => 60, () => 900, 0.5, 0.22);
  return o;
};

sfx.pop = () => {
  const o = buf(0.16);
  tone(o, 950, 260, 0.05, 0.05, 0.9);
  noise(o, 0.006, (x) => 1 - x, () => 2000, () => 9000, 0.4);
  return o;
};

sfx.click = () => {
  const o = buf(0.05);
  noise(o, 0.006, (x) => 1 - x, () => 2500, () => 10000, 0.8);
  tone(o, 2600, 2200, 0.01, 0.012, 0.5);
  return o;
};

sfx.knock = () => {
  const o = buf(0.3);
  tone(o, 120, 52, 0.04, 0.09, 1.0);
  noise(o, 0.02, (x) => 1 - x, () => 120, () => 1800, 0.9);
  tone(o, 740, 740, 0.0001, 0.12, 0.12);
  tone(o, 1180, 1180, 0.0001, 0.09, 0.08);
  return o;
};

sfx.switch = () => {
  const o = buf(0.18);
  noise(o, 0.008, (x) => 1 - x, () => 1500, () => 8000, 0.9);
  tone(o, 1400, 320, 0.03, 0.05, 0.5, 0.01);
  return o;
};

sfx.beep = () => {
  const o = buf(0.55);
  for (let k = 0; k < 3; k++) tone(o, 880, 880, 0.0001, 0.05, 0.6, k * 0.17);
  return o;
};

sfx.callfail = () => {
  const o = buf(0.7);
  tone(o, 660, 660, 0.0001, 0.09, 0.6, 0);
  tone(o, 520, 520, 0.0001, 0.09, 0.6, 0.18);
  tone(o, 400, 380, 0.05, 0.16, 0.6, 0.36);
  return o;
};

sfx.boom = () => {
  const o = buf(1.5);
  tone(o, 60, 36, 0.12, 0.45, 1.0);
  noise(o, 0.25, (x) => Math.exp(-x * 4), () => 40, () => 500, 0.6);
  noise(o, 0.01, (x) => 1 - x, () => 800, () => 6000, 0.3);
  return o;
};

sfx.chime = () => {
  const o = buf(1.0);
  tone(o, 1318, 1318, 0.0001, 0.3, 0.5);
  tone(o, 1760, 1760, 0.0001, 0.25, 0.35, 0.005);
  tone(o, 2637, 2637, 0.0001, 0.18, 0.2, 0.01);
  return o;
};

// блеяние: жужжащий тон с вибрато и дрожью «э-э-э»
function bleatInto(o, f0, start, len = 0.7, amp = 0.9) {
  const lp = onePole(2500);
  let ph = 0;
  const s0 = Math.floor(start * SR);
  const n = Math.floor(len * SR);
  for (let k = 0; k < n && s0 + k < o.length; k++) {
    const tt = k / SR;
    const x = k / n;
    const f = f0 * (1 - 0.12 * x) * (1 + 0.05 * Math.sin(TWO_PI * 9 * tt));
    ph += (TWO_PI * f) / SR;
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(ph * h) / h;
    const trem = 0.55 + 0.45 * Math.sin(TWO_PI * 22 * tt);
    const env = Math.min(1, tt / 0.04) * (x > 0.8 ? (1 - x) / 0.2 : 1);
    o[s0 + k] += lp(v) * trem * env * amp * 0.35;
  }
}

sfx.bleat = () => {
  const o = buf(0.8);
  bleatInto(o, 230, 0);
  return o;
};

sfx.bleats = () => {
  const o = buf(1.4);
  bleatInto(o, 200, 0, 0.8, 0.8);
  bleatInto(o, 265, 0.25, 0.7, 0.7);
  bleatInto(o, 305, 0.5, 0.8, 0.6);
  return o;
};

sfx.trot = () => {
  const o = buf(1.1);
  for (let k = 0; k < 6; k++) {
    tone(o, 85, 48, 0.03, 0.06, 0.8, k * 0.16);
    noise(o, 0.03, (x) => 1 - x, () => 50, () => 700, 0.5, k * 0.16);
  }
  return o;
};

sfx.crunch = () => {
  const o = buf(0.6);
  for (let k = 0; k < 3; k++) noise(o, 0.07, (x) => Math.pow(1 - x, 1.5) * (0.6 + 0.4 * Math.sin(x * 40)), () => 1500, () => 6000, 0.9, k * 0.18);
  return o;
};

sfx.creak = () => {
  const o = buf(0.7);
  const lp = onePole(1200);
  let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const tt = i / SR;
    const x = i / o.length;
    const f = 380 - 140 * x + 20 * Math.sin(TWO_PI * 15 * tt);
    ph += (TWO_PI * f) / SR;
    const v = (Math.sin(ph) * 0.6 + Math.sin(ph * 2.01) * 0.3) * (0.7 + 0.3 * Math.sin(TWO_PI * 13 * tt));
    o[i] += lp(v + rnd() * 0.2) * Math.sin(Math.PI * x) * 0.6;
  }
  return o;
};

sfx.stamp = () => {
  const o = buf(0.3);
  tone(o, 130, 55, 0.03, 0.08, 1.0);
  noise(o, 0.025, (x) => 1 - x, () => 200, () => 2500, 0.8);
  return o;
};

sfx.heart = () => {
  const o = buf(0.4);
  tone(o, 420, 210, 0.04, 0.06, 0.8);
  tone(o, 360, 180, 0.04, 0.07, 0.6, 0.14);
  return o;
};

function writeWav(file, data) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.8 / peak : 1;
  // короткий фейд по краям, чтобы не щёлкало
  const fade = Math.min(64, data.length >> 2);
  const pcm = Buffer.alloc(data.length * 2);
  for (let i = 0; i < data.length; i++) {
    let v = data[i] * g;
    if (i < fade) v *= i / fade;
    if (i > data.length - fade) v *= (data.length - i) / fade;
    pcm.writeInt16LE(Math.round(clamp(v, -1, 1) * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, make] of Object.entries(sfx)) {
  writeWav(path.join(OUT_DIR, `${name}.wav`), make());
}
console.log(`sfx: ${Object.keys(sfx).join(", ")} → ${OUT_DIR}`);
