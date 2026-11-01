import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Виртуальная камера: ключевые кадры (секунда сцены → позиция и масштаб), плавная интерполяция.
// Сцена всегда «живёт»: медленные наезды и панорамы между событиями сценария.
export type CamKey = { t: number; x?: number; y?: number; scale?: number };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const useCamera = (keys: CamKey[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ks = keys.map((k) => ({ t: k.t, x: k.x ?? 0, y: k.y ?? 0, scale: k.scale ?? 1 })).sort((a, b) => a.t - b.t);
  if (ks.length === 0) return { x: 0, y: 0, scale: 1 };
  if (t <= ks[0].t) return ks[0];
  if (t >= ks[ks.length - 1].t) return ks[ks.length - 1];
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (t >= a.t && t <= b.t) {
      const k = ease(interpolate(t, [a.t, b.t], [0, 1]));
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, scale: a.scale + (b.scale - a.scale) * k };
    }
  }
  return ks[ks.length - 1];
};

export const Camera: React.FC<{ keys: CamKey[]; origin?: string; drift?: number; children: React.ReactNode }> = ({ keys, origin = "540px 800px", drift = 1, children }) => {
  const c = useCamera(keys);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dx = (Math.sin(t * 0.7) * 4 + Math.sin(t * 1.9) * 1.5) * drift;
  const dy = (Math.cos(t * 0.5) * 4 + Math.cos(t * 1.3) * 1.5) * drift;
  const ds = Math.sin(t * 0.35) * 0.005 * drift;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${-c.x + dx}px, ${-c.y + dy}px) scale(${c.scale + ds})`,
        transformOrigin: origin,
      }}
    >
      {children}
    </div>
  );
};

// Ключ камеры, при котором точка контента (px, py) оказывается в центре кадра (540, 800) при масштабе s.
export const focusKey = (t: number, px: number, py: number, s: number): CamKey => ({ t, x: (px - 540) * s, y: (py - 800) * s, scale: s });

// Удобный доступ к моментам фраз сцены: beat(i) = секунда начала i-й фразы (или запасное значение).
export const phraseStarts = (phrases: Array<{ start: number }>, fallbackStep = 2) =>
  (i: number) => phrases[i]?.start ?? (phrases.length ? phrases[phrases.length - 1].start + fallbackStep * (i - phrases.length + 1) : i * fallbackStep);
