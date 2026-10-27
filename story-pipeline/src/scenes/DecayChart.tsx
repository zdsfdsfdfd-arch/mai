import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// График спада: 1 ч 100 %, 7 ч 10 %, 48 ч 1 %. Столбики растут по фразам, зелёная зона «24 ч»,
// герой сидит в подвале.
export const DecayChart: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const sitAt = B.sitAt3(scene);
  const chartAt = B.chartAt(scene);
  const sevenAt = B.sevenAt(scene);
  const twoAt = B.twoDaysAt(scene);
  const dayAt = B.dayAt(scene);
  const bars = [
    { label: "1 Ч", pct: "100 %", h: 520, at: chartAt, color: colors.red },
    { label: "7 Ч", pct: "10 %", h: 190, at: sevenAt, color: colors.yellow },
    { label: "48 Ч", pct: "1 %", h: 70, at: twoAt, color: colors.green },
  ];
  const base = 1040;
  const axisK = interpolate(t, [chartAt - 0.2, chartAt + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const band = pop(frame, fps, sec(dayAt, fps));
  const keys = [focusKey(0, 540, 820, 1.0), focusKey(chartAt, 600, 800, 1.1), focusKey(twoAt, 600, 800, 1.1), focusKey(dayAt + 0.4, 560, 820, 1.0), focusKey(dur, 560, 820, 1.0)];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        {/* подвал: стена и герой */}
        <div style={{ position: "absolute", left: 0, top: 330, width: 1080, height: 860, background: "#1c2440" }} />
        <div style={{ position: "absolute", left: 0, top: 1190, width: 1080, height: 110, background: "#15192b" }} />
        <Character pose="sit" frame={frame} fps={fps} x={60} y={700} scale={0.75} mood="tired" sitAt={sitAt} />
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* оси */}
          <line x1={360} y1={base} x2={360 + 600 * axisK} y2={base} stroke={colors.white} strokeWidth={5} />
          <line x1={360} y1={base} x2={360} y2={base - 560 * axisK} stroke={colors.white} strokeWidth={5} />
          <text x={340} y={base - 540} textAnchor="end" fontFamily={fonts.mono} fontSize={26} fill={colors.dim} opacity={axisK}>ДОЗА</text>
          {bars.map((b, i) => {
            const k = interpolate(t, [b.at, b.at + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const x = 420 + i * 180;
            const h = b.h * k;
            return (
              <g key={i} opacity={k > 0 ? 1 : 0}>
                <rect x={x} y={base - h} width={110} height={h} rx={10} fill={b.color} />
                <text x={x + 55} y={base - h - 16} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={54} fill={b.color} opacity={k}>{b.pct}</text>
                <text x={x + 55} y={base + 44} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fill={colors.white}>{b.label}</text>
              </g>
            );
          })}
          {/* зелёная зона первых суток */}
          <g opacity={band.opacity}>
            <rect x={400} y={base - 560} width={330} height={560} fill={colors.green} opacity={0.12} />
            <line x1={730} y1={base - 560} x2={730} y2={base} stroke={colors.green} strokeWidth={4} strokeDasharray="14 10" />
          </g>
        </svg>
        <Label text="24 Ч ВНУТРИ" x={565} y={base - 650} delay={sec(dayAt, fps)} tone="green" />
      </Camera>
      <Label text="ПРАВИЛО 7:10 · ×7 ВРЕМЯ = ÷10 ДОЗА" x={540} y={1225} delay={sec(sevenAt, fps) + 8} tone="dark" size={28} />
    </AbsoluteFill>
  );
};
