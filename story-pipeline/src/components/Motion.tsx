import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ink } from "../theme";

// Примитивы движения: всё въезжает с пружиной и перелётом, линии прорисовываются, элементы живут.

export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOutBack = (k: number) => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);

export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
};

// Прогресс 0..1 от момента at (сек) за dur сек с ease-out.
export const useReveal = (at: number, dur = 0.5, ease: (k: number) => number = easeOut) => {
  const { t } = useT();
  return ease(interpolate(t, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
};

type Dir = "up" | "down" | "left" | "right" | "scale" | "none";

// Появление элемента в момент at: пружина с перелётом из направления from; необязательный уход в until.
export const Enter: React.FC<{
  at: number;
  until?: number;
  from?: Dir;
  dist?: number;
  rotate?: number;
  stiff?: number;
  style?: React.CSSProperties;
  origin?: string;
  children: React.ReactNode;
}> = ({ at, until, from = "up", dist = 120, rotate = 0, stiff = 170, style, origin = "50% 50%", children }) => {
  const { frame, fps, t } = useT();
  const f = frame - Math.round(at * fps);
  if (f < 0) return null;
  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: stiff, mass: 0.8 } });
  const op = interpolate(f, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  let x = 0;
  let y = 0;
  let sc = 1;
  if (from === "up") y = dist * (1 - s);
  if (from === "down") y = -dist * (1 - s);
  if (from === "left") x = -dist * (1 - s);
  if (from === "right") x = dist * (1 - s);
  if (from === "scale") sc = 0.6 + 0.4 * s;
  const r = rotate * (1 - s);
  let outOp = 1;
  let outY = 0;
  if (until !== undefined && t > until - 0.3) {
    const k = interpolate(t, [until - 0.3, until], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    outOp = 1 - k;
    outY = -40 * k * k;
    sc *= 1 - 0.1 * k;
  }
  if (until !== undefined && t > until) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: op * outOp, transform: `translate(${x}px, ${y + outY}px) scale(${sc}) rotate(${r}deg)`, transformOrigin: origin, ...style }}>
      {children}
    </div>
  );
};

// Прорисовка SVG-пути от момента at: штрих рисуется, заливка проявляется следом.
export const DrawPath: React.FC<{
  d: string;
  at: number;
  dur?: number;
  stroke?: string;
  width?: number;
  fill?: string;
  outline?: boolean;
  opacity?: number;
  dash?: string;
  linecap?: "round" | "butt";
}> = ({ d, at, dur = 0.5, stroke = "#f5f3ea", width = 6, fill = "none", outline = false, opacity = 1, dash, linecap = "round" }) => {
  const k = useReveal(at, dur);
  if (k <= 0) return null;
  const fillOp = interpolate(k, [0.6, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g opacity={opacity}>
      {fill !== "none" && <path d={d} fill={fill} stroke="none" opacity={fillOp} />}
      {outline && <path d={d} fill="none" stroke={ink} strokeWidth={width + 8} strokeLinecap={linecap} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />}
      <path d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap={linecap} strokeLinejoin="round" pathLength={1} strokeDasharray={dash ?? 1} strokeDashoffset={dash ? undefined : 1 - k} opacity={dash ? k : 1} />
    </g>
  );
};

// Живой элемент: медленно покачивается и чуть вращается.
export const Float: React.FC<{ amp?: number; speed?: number; rot?: number; seed?: number; origin?: string; children: React.ReactNode }> = ({ amp = 8, speed = 1.4, rot = 1.5, seed = 0, origin = "50% 50%", children }) => {
  const { t } = useT();
  const y = Math.sin(t * speed + seed) * amp;
  const x = Math.cos(t * speed * 0.7 + seed) * amp * 0.4;
  const r = Math.sin(t * speed * 0.8 + seed * 1.3) * rot;
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", transform: `translate(${x}px, ${y}px) rotate(${r}deg)`, transformOrigin: origin }}>{children}</div>;
};

// Группа SVG, которая появляется с пружиной (масштаб и сдвиг) в момент at.
export const GEnter: React.FC<{ at: number; cx: number; cy: number; from?: Dir; dist?: number; children: React.ReactNode }> = ({ at, cx, cy, from = "scale", dist = 80, children }) => {
  const { frame, fps } = useT();
  const f = frame - Math.round(at * fps);
  if (f < 0) return null;
  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 180, mass: 0.8 } });
  const op = interpolate(f, [0, 4], [0, 1], { extrapolateRight: "clamp" });
  const sc = from === "scale" ? 0.5 + 0.5 * s : 1;
  const dx = from === "left" ? -dist * (1 - s) : from === "right" ? dist * (1 - s) : 0;
  const dy = from === "up" ? dist * (1 - s) : from === "down" ? -dist * (1 - s) : 0;
  return (
    <g opacity={op} transform={`translate(${cx + dx} ${cy + dy}) scale(${sc}) translate(${-cx} ${-cy})`}>
      {children}
    </g>
  );
};

// Бегущие цифры: каждая цифра выезжает снизу при смене.
export const RollNumber: React.FC<{ value: string; size: number; color: string; font: string; weight?: number; stroke?: number }> = ({ value, size, color, font, weight = 700, stroke = 0 }) => {
  const { frame, fps } = useT();
  return (
    <div style={{ display: "inline-flex", height: size * 1.05, overflow: "hidden", verticalAlign: "bottom" }}>
      {value.split("").map((ch, i) => {
        const digit = /\d/.test(ch);
        const n = digit ? Number(ch) : 0;
        const key = `${i}-${ch}`;
        const s = spring({ frame: frame % Math.max(1, Math.round(fps * 0.5)), fps, config: { damping: 14, stiffness: 300 } });
        void s;
        return (
          <div key={key} style={{ position: "relative", width: digit ? size * 0.62 : size * 0.4, height: size * 1.05 }}>
            <div style={{ position: "absolute", left: 0, top: 0, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.05, color, WebkitTextStroke: stroke ? `${stroke}px ${ink}` : undefined, paintOrder: "stroke fill", textShadow: stroke ? `${stroke * 1.5}px ${stroke * 1.5}px 0 ${ink}` : undefined }}>
              {digit ? n : ch}
            </div>
          </div>
        );
      })}
    </div>
  );
};
