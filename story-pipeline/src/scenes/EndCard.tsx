import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Camera } from "../components/Camera";
import { Character } from "../components/Character";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { title: string; subtitle: string; thumb?: boolean };

const ThumbIcon: React.FC<{ x: number; y: number; opacity: number; scale: number }> = ({ x, y, opacity, scale }) => (
  <svg width={300} height={340} viewBox="0 0 300 340" style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${scale})` }}>
    <path d="M40 330 L40 160 C40 120, 110 110, 120 150 L126 60 C128 10, 196 10, 198 60 L204 150 L250 150 C280 150, 290 190, 270 210 C290 230, 290 270, 262 280 C280 300, 270 330, 240 330 Z" fill="#e8c9a8" stroke="#07090f" strokeWidth="8" strokeLinejoin="round" />
    <rect x="18" y="160" width="60" height="170" rx="14" fill="#2a3a66" stroke="#07090f" strokeWidth="8" />
  </svg>
);

// Финальная карточка: персонаж входит в кадр шагом и останавливается, заголовок пульсирует,
// в воздухе медленно плывут частицы, камера чуть наезжает.
export const EndCard: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const dur = scene.durationFrames / fps;
  const title = pop(frame, fps, 4);
  const sub = pop(frame, fps, 14);
  const walkK = interpolate(t, [0.2, 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const charX = 120 + 310 * walkK;
  const walking = walkK > 0 && walkK < 1;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${colors.bg2} 0%, ${colors.bg} 70%)` }}>
      <Camera keys={[{ t: 0, scale: 1 }, { t: dur, scale: 1.08 }]} origin="540px 900px">
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 263) % 1080} cy={((i * 151) % 1400) + 300 - ((t * 12 * (1 + (i % 3))) % 1400)} r={1.5 + (i % 3)} fill={colors.white} opacity={0.15 + 0.25 * Math.abs(Math.sin(t + i))} />
          ))}
        </svg>
        {p.thumb ? (
          <ThumbIcon x={390} y={860} opacity={pop(frame, fps, 10).opacity} scale={pop(frame, fps, 10).scale * (1 + 0.03 * Math.sin(t * 3))} />
        ) : (
          <Character pose={walking ? "walk" : "stand"} frame={frame} fps={fps} x={charX} y={820} scale={0.72} />
        )}
      </Camera>
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.display,
          fontWeight: 900,
          fontSize: 260,
          lineHeight: 1,
          letterSpacing: 4,
          color: colors.white,
          WebkitTextStroke: "4px #07090f",
          paintOrder: "stroke fill",
          opacity: title.opacity,
          transform: `scale(${title.scale * (1 + 0.012 * Math.sin(t * 2))})`,
        }}
      >
        {p.title}
      </div>
      <div style={{ position: "absolute", top: 720, left: 0, right: 0, textAlign: "center", fontFamily: fonts.mono, fontSize: 44, letterSpacing: 8, color: colors.yellow, opacity: sub.opacity, transform: `scale(${sub.scale})` }}>
        {p.subtitle}
      </div>
      <Label text="ПОДПИШИСЬ, ЧТОБЫ НЕ ПРОПУСТИТЬ" x={540} y={1225} delay={24} tone="red" size={32} />
    </AbsoluteFill>
  );
};
