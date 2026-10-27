import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { colors, fonts } from "../theme";
import type { TopPlaque as TopPlaqueSpec } from "../types";

// Верхняя бежевая плашка, слегка повёрнутая: «Часть 1 · ДЕНЬ 1 · 01:30» или «2. ВЫХОД».
export const TopPlaque: React.FC<{ part: number; dayLabel: string; spec?: TopPlaqueSpec; delay?: number }> = ({
  part,
  dayLabel,
  spec,
  delay = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, scale, y } = pop(frame, fps, delay);
  const numbered = spec && spec.num;
  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${-y}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          background: colors.beige,
          color: colors.beigeInk,
          padding: "18px 44px 20px",
          transform: "rotate(-2.5deg)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 420,
        }}
      >
        {numbered ? (
          <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 64, lineHeight: 1, letterSpacing: 2 }}>
            <span style={{ color: colors.red }}>{spec!.num}.</span> {spec!.text}
          </div>
        ) : (
          <>
            <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 70, lineHeight: 1, fontStyle: "italic", letterSpacing: 1 }}>
              Часть {part}
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: 28, letterSpacing: 4, marginTop: 8, opacity: 0.85 }}>
              {spec?.text ?? dayLabel}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Плашка-статус над субтитрами. Префикс «!» делает её красной, иначе тёмная.
export const StatusPlaque: React.FC<{ text: string; delay?: number }> = ({ text, delay = 10 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const red = text.startsWith("!");
  const label = red ? text.slice(1) : text;
  const { opacity, scale, y } = pop(frame, fps, delay);
  return (
    <div style={{ position: "absolute", top: 1180, left: 0, right: 0, display: "flex", justifyContent: "center", opacity, transform: `translateY(${y}px) scale(${scale})` }}>
      <div
        style={{
          background: red ? colors.red : colors.panelLight,
          color: colors.white,
          fontFamily: fonts.text,
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: 2,
          padding: "14px 34px",
          borderRadius: 18,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// HUD-таймер в углу, моноширинный, как «04:24 ост.» в референсе.
export const Hud: React.FC<{ label: string; value: string; tone?: "red" | "green" | "yellow"; delay?: number }> = ({
  label,
  value,
  tone = "red",
  delay = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity } = pop(frame, fps, delay);
  const color = tone === "red" ? colors.red : tone === "green" ? colors.green : colors.yellow;
  return (
    <div
      style={{
        position: "absolute",
        top: 330,
        right: 60,
        opacity,
        fontFamily: fonts.mono,
        color,
        border: `4px solid ${color}`,
        borderRadius: 10,
        padding: "10px 18px",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <div style={{ fontSize: 24, letterSpacing: 4, opacity: 0.9 }}>{label}</div>
      <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: 2 }}>{value}</div>
    </div>
  );
};

// Водяной знак канала, всегда справа внизу.
export const Watermark: React.FC<{ channel: string }> = ({ channel }) => (
  <div
    style={{
      position: "absolute",
      right: 50,
      bottom: 90,
      display: "flex",
      alignItems: "center",
      gap: 14,
      color: colors.white,
      fontFamily: fonts.text,
      fontWeight: 600,
      fontSize: 30,
      opacity: 0.9,
      textShadow: "0 2px 8px rgba(0,0,0,0.8)",
    }}
  >
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="17" fill={colors.white} />
      <polygon points="14,10 27,18 14,26" fill={colors.bg} />
    </svg>
    {channel}
  </div>
);

// Подпись-плашка под схемой: тёмная, с белым капсом («ДЕСЯТКИ ЗЕРКАЛ»).
export const Label: React.FC<{ text: string; x: number; y: number; delay?: number; tone?: "dark" | "red" | "green" | "beige"; size?: number }> = ({
  text,
  x,
  y,
  delay = 0,
  tone = "dark",
  size = 36,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, scale, y: dy } = pop(frame, fps, delay);
  const bg = tone === "red" ? colors.red : tone === "green" ? colors.green : tone === "beige" ? colors.beige : colors.panelLight;
  const fg = tone === "beige" ? colors.beigeInk : colors.white;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, calc(-50% + ${dy}px)) scale(${scale})`,
        opacity,
        background: bg,
        color: fg,
        fontFamily: fonts.text,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: 2,
        padding: "12px 26px",
        borderRadius: 14,
        whiteSpace: "nowrap",
        boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
};
