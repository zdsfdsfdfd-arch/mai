import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { minutes: number };

// После удара: школа, далёкий гриб, большой таймер бежит к 15:00, с неба начинает сыпаться пыль,
// знак радиации и плашка «главная опасность».
export const FalloutTimer: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const startAt = B.timerStartAt(scene);
  const dustAt = B.dustAt(scene);
  const dangerAt = B.dangerAt(scene);
  const timerK = interpolate(t, [startAt, dustAt], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const minutes = Math.floor(timerK * p.minutes);
  const secs = Math.floor((timerK * p.minutes * 60) % 60);
  const timer = pop(frame, fps, sec(startAt, fps));
  const dustK = interpolate(t, [dustAt, dustAt + 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tre = pop(frame, fps, sec(dustAt, fps) + 6);
  const keys = [focusKey(0, 540, 760, 1.0), focusKey(startAt + 0.5, 540, 820, 1.1), focusKey(dustAt + 0.5, 540, 760, 1.0), focusKey(dur, 540, 740, 1.05)];
  const dust = Array.from({ length: 70 }, (_, i) => ({ x: (i * 157) % 1080, y0: (i * 211) % 1200, s: 1.2 + (i % 4) * 0.4, r: 3 + (i % 3) * 2 }));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #3a2a2a 0%, #6a4a3a 40%, #2b2b33 100%)` }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* далёкий гриб */}
          <g transform="translate(820 520) scale(0.55)">
            <rect x={-40} y={-10} width={80} height={320} fill="#4a3a3a" opacity={0.8} />
            <ellipse cx={0} cy={-30} rx={210} ry={110} fill="#6a5a5a" />
            <ellipse cx={0} cy={-110} rx={150} ry={70} fill="#8a7a7a" opacity={0.9} />
          </g>
          {/* школа слева, разбитые окна */}
          <rect x={120} y={600} width={420} height={360} fill="#3a4668" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => <rect key={`${r}-${c}`} x={150 + c * 100} y={630 + r * 100} width={60} height={70} fill="#05070d" />),
          )}
          <text x={330} y={590} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fill={colors.beige} letterSpacing={4}>ШКОЛА</text>
          <rect x={0} y={960} width={1080} height={400} fill="#2b2b33" />
          {/* пыль */}
          {dustK > 0 &&
            dust.map((d, i) => {
              const y = (d.y0 + (t - dustAt) * 90 * d.s) % 1300;
              return <circle key={i} cx={d.x + Math.sin(t * 2 + i) * 12} cy={y} r={d.r} fill="#bfb5a0" opacity={0.75 * dustK} />;
            })}
        </svg>
        {/* таймер */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", opacity: timer.opacity, transform: `translateY(${timer.y}px) scale(${timer.scale})` }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 30, letterSpacing: 6, color: colors.dim }}>ДО ПЫЛИ</div>
          <div style={{ fontFamily: fonts.mono, fontSize: 170, fontWeight: 700, color: timerK >= 1 ? colors.red : colors.white, lineHeight: 1.05 }}>
            {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>
        {/* знак радиации */}
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: tre.opacity, transform: `scale(${tre.scale})`, transformOrigin: "540px 820px" }}>
          <circle cx={540} cy={1040} r={110} fill={colors.yellow} />
          {[0, 1, 2].map((i) => (
            <path key={i} d="M540 1040 L540 930 A110 110 0 0 1 635 985 Z" fill="#0b0b10" transform={`rotate(${i * 120} 540 1040)`} />
          ))}
          <circle cx={540} cy={1040} r={22} fill="#0b0b10" />
          <circle cx={540} cy={1040} r={12} fill={colors.yellow} />
        </svg>
      </Camera>
      <Label text="РАДИОАКТИВНАЯ ПЫЛЬ · ГЛАВНАЯ ОПАСНОСТЬ" x={540} y={1225} delay={sec(dangerAt, fps)} tone="red" size={28} />
    </AbsoluteFill>
  );
};
