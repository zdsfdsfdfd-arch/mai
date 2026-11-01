import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { shakeAt } from "../anim";
import { colors, fonts, hardShadow, ink, stroke } from "../theme";

// Общие визуальные эффекты в стиле «стикер + плёнка»: фон с прожектором и сеткой,
// зерно, виньетка, лучи удара, тряска, HUD-скобки, карточки с жёсткой тенью, крупный текст.

type Variant = "navy" | "dusk" | "haze" | "basement" | "night" | "room";
const grads: Record<Variant, string> = {
  navy: "linear-gradient(180deg, #182040 0%, #0d1328 55%, #070a14 100%)",
  dusk: "linear-gradient(180deg, #1c1535 0%, #4a2440 35%, #a2452f 70%, #e07a3a 100%)",
  haze: "linear-gradient(180deg, #2a1f22 0%, #6b4030 45%, #b2724a 75%, #2a2630 100%)",
  basement: "linear-gradient(180deg, #0f1326 0%, #0a0d1a 100%)",
  night: "linear-gradient(180deg, #0a0e1f 0%, #141b36 60%, #0a0d18 100%)",
  room: "linear-gradient(180deg, #2a3454 0%, #1d2541 100%)",
};

export const Backdrop: React.FC<{
  variant?: Variant;
  spot?: { x: number; y: number; r?: number; color?: string; opacity?: number };
  grid?: boolean;
  particles?: boolean;
  children?: React.ReactNode;
}> = ({ variant = "navy", spot, grid = true, particles = true, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: grads[variant] }}>
      {grid && (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.09 }}>
          <defs>
            <pattern id="dots" width="54" height="54" patternUnits="userSpaceOnUse">
              <circle cx="27" cy="27" r="2.2" fill={colors.white} />
            </pattern>
          </defs>
          <rect width="1080" height="1920" fill="url(#dots)" />
        </svg>
      )}
      {spot && (
        <div
          style={{
            position: "absolute",
            left: spot.x - (spot.r ?? 520),
            top: spot.y - (spot.r ?? 520),
            width: 2 * (spot.r ?? 520),
            height: 2 * (spot.r ?? 520),
            borderRadius: "50%",
            background: `radial-gradient(circle, ${spot.color ?? "#3f8cff"} 0%, rgba(0,0,0,0) 68%)`,
            opacity: spot.opacity ?? 0.32,
            mixBlendMode: "screen",
          }}
        />
      )}
      {particles && (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {Array.from({ length: 26 }, (_, i) => {
            const x = ((i * 263) % 1080) + Math.sin(t * 0.6 + i) * 18;
            const y = (((i * 151) % 1700) + 1700 - ((t * 10 * (1 + (i % 3))) % 1700)) % 1700 + 100;
            return <circle key={i} cx={x} cy={y} r={1.6 + (i % 3)} fill={colors.white} opacity={0.08 + 0.18 * Math.abs(Math.sin(t * 0.8 + i))} />;
          })}
        </svg>
      )}
      {children}
    </AbsoluteFill>
  );
};

// Плёночное зерно: тайл шума со случайным смещением в каждом кадре.
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.11 }) => {
  const frame = useCurrentFrame();
  const ox = ((frame * 97) % 512) - 256;
  const oy = ((frame * 61) % 512) - 256;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("fx/noise.png")})`,
        backgroundSize: "512px 512px",
        backgroundPosition: `${ox}px ${oy}px`,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.6 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 46%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);

// Мягкое свечение в точке (для вспышек, ламп, экранов).
export const Glow: React.FC<{ x: number; y: number; r: number; color?: string; opacity?: number }> = ({ x, y, r, color = "#fff2c4", opacity = 0.8 }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`, opacity, mixBlendMode: "screen", pointerEvents: "none" }} />
);

// Лучи удара из точки: k 0..1 — прогресс, линии разлетаются и гаснут.
export const Burst: React.FC<{ x: number; y: number; k: number; n?: number; r0?: number; r1?: number; color?: string; width?: number }> = ({ x, y, k, n = 14, r0 = 60, r1 = 420, color = colors.white, width = 8 }) => {
  if (k <= 0 || k >= 1) return null;
  const e = 1 - Math.pow(1 - k, 2);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.2;
        const len = 90 + ((i * 53) % 90);
        const d = r0 + (r1 - r0) * e;
        return <line key={i} x1={x + Math.cos(a) * d} y1={y + Math.sin(a) * d} x2={x + Math.cos(a) * (d + len * (1 - e))} y2={y + Math.sin(a) * (d + len * (1 - e))} stroke={color} strokeWidth={width * (1 - e * 0.6)} strokeLinecap="round" opacity={1 - e} />;
      })}
    </svg>
  );
};

// Тряска содержимого после момента at (сек).
export const Shake: React.FC<{ at: number; amp?: number; dur?: number; seed?: number; children: React.ReactNode }> = ({ at, amp = 12, dur = 0.5, seed = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = shakeAt(frame / fps, at, amp, dur, seed);
  return <div style={{ position: "absolute", inset: 0, transform: `translate(${s.x}px, ${s.y}px)` }}>{children}</div>;
};

// HUD-скобки по углам прямоугольника.
export const Bracket: React.FC<{ x: number; y: number; w: number; h: number; color?: string; len?: number; width?: number; opacity?: number }> = ({ x, y, w, h, color = colors.yellow, len = 34, width = 6, opacity = 1 }) => (
  <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity}>
    <path d={`M${x} ${y + len} L${x} ${y} L${x + len} ${y}`} />
    <path d={`M${x + w - len} ${y} L${x + w} ${y} L${x + w} ${y + len}`} />
    <path d={`M${x + w} ${y + h - len} L${x + w} ${y + h} L${x + w - len} ${y + h}`} />
    <path d={`M${x + len} ${y + h} L${x} ${y + h} L${x} ${y + h - len}`} />
  </g>
);

// Карточка-стикер: тёмная панель, обводка, жёсткая тень, цветная полоска сверху.
export const Card: React.FC<{ x: number; y: number; w: number; h?: number; color?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ x, y, w, h, color = colors.yellow, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: colors.panel,
      border: `4px solid ${ink}`,
      borderRadius: 22,
      boxShadow: hardShadow(8),
      overflow: "hidden",
      boxSizing: "border-box",
      ...style,
    }}
  >
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 12, background: color }} />
    {children}
  </div>
);

// Крупный заголовок: условный жирный капс, обводка и жёсткая тень.
export const BigText: React.FC<{ text: string; size?: number; color?: string; x?: number; y: number; rotate?: number; opacity?: number; scale?: number; letterSpacing?: number }> = ({ text, size = 200, color = colors.yellow, x = 540, y, rotate = -2, opacity = 1, scale = 1, letterSpacing = 2 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
      fontFamily: fonts.display,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1,
      letterSpacing,
      color,
      WebkitTextStroke: `${Math.max(4, size / 36)}px ${ink}`,
      paintOrder: "stroke fill",
      textShadow: `${size / 22}px ${size / 22}px 0 ${ink}`,
      whiteSpace: "nowrap",
      textTransform: "uppercase",
      opacity,
    }}
  >
    {text}
  </div>
);

// Пыльное облачко/пуф при ударе: k 0..1.
export const Puff: React.FC<{ x: number; y: number; k: number; color?: string; r?: number }> = ({ x, y, k, color = "#c9bfae", r = 50 }) => {
  if (k <= 0 || k >= 1) return null;
  const e = 1 - Math.pow(1 - k, 2);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return <circle key={i} cx={x + Math.cos(a) * r * (0.5 + e)} cy={y + Math.sin(a) * r * 0.5 * (0.5 + e)} r={r * 0.45 * (1 - e * 0.5)} fill={color} opacity={0.9 * (1 - e)} {...stroke} strokeWidth={4} />;
      })}
    </svg>
  );
};
