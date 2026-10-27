import { interpolate, spring } from "remotion";

// «Pop» как в референсе: элемент появляется целиком, с лёгким масштабом и прозрачностью.
export const pop = (frame: number, fps: number, startFrame: number) => {
  const f = frame - startFrame;
  if (f < 0) return { opacity: 0, scale: 0.85, y: 22 };
  const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 240, mass: 0.6 } });
  return { opacity: interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" }), scale: 0.85 + 0.15 * s, y: 22 * (1 - s) };
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
