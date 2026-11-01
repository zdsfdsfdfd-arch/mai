import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, stamp } from "../anim";
import { Camera } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, BigText, Burst, Glow } from "../components/Fx";
import { Label } from "../components/Overlays";
import { colors, fonts, ink } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { title: string; subtitle: string; thumb?: boolean };

const ThumbIcon: React.FC<{ x: number; y: number; opacity: number; scale: number; rotate: number }> = ({ x, y, opacity, scale, rotate }) => (
  <svg width={300} height={340} viewBox="0 0 300 340" style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${scale}) rotate(${rotate}deg)`, overflow: "visible" }}>
    <path d="M40 330 L40 160 C40 120, 110 110, 120 150 L126 60 C128 10, 196 10, 198 60 L204 150 L250 150 C280 150, 290 190, 270 210 C290 230, 290 270, 262 280 C280 300, 270 330, 240 330 Z" fill={colors.skin} stroke={ink} strokeWidth="9" strokeLinejoin="round" />
    <path d="M204 150 L250 150 C280 150, 290 190, 270 210 L210 210 Z" fill="#d3a984" opacity="0.5" />
    <rect x="146" y="28" width="32" height="24" rx="10" fill="#f3dcc4" stroke={ink} strokeWidth="4" />
    <rect x="18" y="160" width="60" height="170" rx="14" fill="#2f4a8f" stroke={ink} strokeWidth="9" />
  </svg>
);

// Финальная карточка: заголовок впечатывается с лучами, иконка пальца покачивается в свете,
// призыв подписаться пульсирует.
export const EndCard: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const dur = scene.durationFrames / fps;
  const title = stamp(frame, fps, 4);
  const sub = pop(frame, fps, 14);
  const burst = interpolate(frame, [6, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const walkK = interpolate(t, [0.2, 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const charX = 120 + 310 * walkK;
  const walking = walkK > 0 && walkK < 1;
  const th = pop(frame, fps, 10);

  return (
    <Backdrop variant="night" spot={{ x: 540, y: 1000, color: "#f3c03a", opacity: 0.22, r: 600 }}>
      <Camera keys={[{ t: 0, scale: 1 }, { t: dur, scale: 1.08 }]} origin="540px 900px">
        <Glow x={540} y={1020} r={260} color={colors.yellow} opacity={0.35 * th.opacity} />
        {p.thumb ? (
          <>
            <ThumbIcon x={390} y={860} opacity={th.opacity} scale={th.scale * (1 + 0.03 * Math.sin(t * 3))} rotate={-6 + 6 * Math.sin(t * 2)} />
            <Character pose="thumb" blend={{ from: "stand", to: "thumb", at: 0.5, dur: 0.5 }} frame={frame} fps={fps} x={60} y={1200 - 554 * 0.72} scale={0.72} mood="smile" wink={t > 1.1} lookAt={[0.8, -0.3]} />
          </>
        ) : (
          <Character pose={walking ? "walk" : "stand"} frame={frame} fps={fps} x={charX} y={820} scale={0.72} />
        )}
      </Camera>
      <Burst x={540} y={560} k={burst} n={16} r0={200} r1={700} color={colors.yellow} width={9} />
      <BigText text={p.title} y={560} size={250} rotate={-3} opacity={title.opacity} scale={title.scale} letterSpacing={4} />
      <div style={{ position: "absolute", top: 710, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: sub.opacity, transform: `scale(${sub.scale})` }}>
        <div style={{ fontFamily: fonts.mono, fontSize: 40, fontWeight: 700, letterSpacing: 8, color: ink, background: colors.beige, border: `4px solid ${ink}`, boxShadow: `7px 7px 0 ${ink}`, padding: "12px 30px", transform: "rotate(1.5deg)" }}>{p.subtitle}</div>
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.03 * Math.sin(t * 4)})`, transformOrigin: "540px 1225px" }}>
        <Label text="ПОДПИШИСЬ, ЧТОБЫ НЕ ПРОПУСТИТЬ" x={540} y={1225} delay={24} tone="red" size={32} />
      </div>
    </Backdrop>
  );
};
