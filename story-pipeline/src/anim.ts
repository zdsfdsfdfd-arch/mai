import { interpolate, spring } from "remotion";

// «Pop» как в референсе: элемент появляется целиком, с лёгким масштабом и прозрачностью.
export const pop = (frame: number, fps: number, startFrame: number) => {
  const f = frame - startFrame;
  if (f < 0) return { opacity: 0, scale: 0.7, y: 60 };
  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 190, mass: 0.8 } });
  return { opacity: interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" }), scale: 0.7 + 0.3 * s, y: 60 * (1 - s) };
};

export const fade = (frame: number, startFrame: number, len = 8) =>
  interpolate(frame, [startFrame, startFrame + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const sec = (s: number, fps: number) => Math.round(s * fps);

// Дрожание кадра на 1–3 px (wiggle), как поверх статики в референсе.
export const wiggle = (frame: number, amp = 2, seed = 0) => {
  const x = Math.sin((frame + seed) * 1.7) * amp + Math.sin((frame + seed) * 0.6) * amp * 0.5;
  const y = Math.cos((frame + seed) * 1.3) * amp + Math.sin((frame + seed) * 0.9) * amp * 0.5;
  return { x, y };
};

// Штамп: прилетает крупным и «впечатывается» с отскоком.
export const stamp = (frame: number, fps: number, startFrame: number) => {
  const f = frame - startFrame;
  if (f < 0) return { opacity: 0, scale: 1.8 };
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 420, mass: 0.5 } });
  return { opacity: interpolate(f, [0, 2], [0, 1], { extrapolateRight: "clamp" }), scale: 1.8 - 0.8 * s };
};

// Въезд сбоку с перелётом: dir = -1 слева, 1 справа.
export const slide = (frame: number, fps: number, startFrame: number, dir = -1, dist = 160) => {
  const f = frame - startFrame;
  if (f < 0) return { opacity: 0, x: dir * dist };
  const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 200, mass: 0.7 } });
  return { opacity: interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }), x: dir * dist * (1 - s) };
};

// Затухающая тряска после момента at (в секундах): амплитуда amp, длительность dur.
export const shakeAt = (t: number, at: number, amp = 12, dur = 0.5, seed = 0) => {
  const d = t - at;
  if (d < 0 || d > dur) return { x: 0, y: 0, k: 0 };
  const k = 1 - d / dur;
  const e = k * k;
  return { x: Math.sin(d * 97 + seed) * amp * e, y: Math.cos(d * 73 + seed * 2) * amp * 0.7 * e, k: e };
};

// Удар: быстрый рост с перелётом за несколько кадров (для столбиков, стрелок).
export const punch = (frame: number, fps: number, startFrame: number) => {
  const f = frame - startFrame;
  if (f < 0) return 0;
  return spring({ frame: f, fps, config: { damping: 12, stiffness: 300, mass: 0.6 } });
};
