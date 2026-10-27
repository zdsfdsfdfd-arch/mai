import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Camera } from "../components/Camera";
import { Character } from "../components/Character";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { title: string; subtitle: string };

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
        <Character pose={walking ? "walk" : "stand"} frame={frame} fps={fps} x={charX} y={820} scale={0.72} />
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
