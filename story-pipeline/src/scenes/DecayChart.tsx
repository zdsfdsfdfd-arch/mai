import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, punch, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, Glow } from "../components/Fx";
import { DrawPath } from "../components/Motion";
import { Label } from "../components/Overlays";
import { colors, fonts, ink, stroke } from "../theme";
import type { SceneTimeline } from "../types";

// Подвал с лампой и трубами, герой на ящике, график спада: столбики бьют вверх по фразам,
// зелёная зона первых суток в HUD-скобках.
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
  const flicker = 0.85 + 0.15 * Math.abs(Math.sin(t * 7) * Math.sin(t * 3.3));

  return (
    <Backdrop variant="basement" grid={false}>
      <Camera keys={keys}>
        <Glow x={540} y={330} r={520} color="#ffd98a" opacity={0.28 * flicker} />
        <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
          {/* стена, трубы, пол */}
          <rect x={-100} y={300} width={1280} height={900} fill="#151b33" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <line key={i} x1={-100} y1={360 + i * 90} x2={1180} y2={360 + i * 90} stroke={colors.white} strokeWidth={2} opacity={0.05} />
          ))}
          <line x1={-100} y1={320} x2={1180} y2={320} stroke="#3a4668" strokeWidth={22} />
          <line x1={-100} y1={320} x2={1180} y2={320} stroke={ink} strokeWidth={4} opacity={0.6} />
          <line x1={880} y1={320} x2={880} y2={520} stroke="#3a4668" strokeWidth={18} />
          <circle cx={880} cy={520} r={22} fill="#4a567a" {...stroke} strokeWidth={4} />
          {/* лампа */}
          <line x1={540} y1={310} x2={540} y2={380} stroke={ink} strokeWidth={5} />
          <path d="M470 380 L610 380 L580 420 L500 420 Z" fill="#3a4668" {...stroke} strokeWidth={5} />
          <circle cx={540} cy={436} r={22} fill="#ffe9a8" {...stroke} strokeWidth={4} />
          <polygon points="500,420 580,420 820,1190 260,1190" fill="#ffe9a8" opacity={0.07 * flicker} />
          <rect x={-100} y={1190} width={1280} height={300} fill="#0f1326" />
          <line x1={-100} y1={1190} x2={1180} y2={1190} stroke={ink} strokeWidth={8} />
          {/* ящик */}
          <rect x={90} y={1070} width={190} height={120} rx={8} fill="#6b4420" {...stroke} />
          <line x1={90} y1={1130} x2={280} y2={1130} stroke={ink} strokeWidth={4} opacity={0.6} />
          <line x1={185} y1={1070} x2={185} y2={1190} stroke={ink} strokeWidth={4} opacity={0.6} />
        </svg>
        <Character pose="sit" frame={frame} fps={fps} x={50} y={700} scale={0.78} mood="tired" sitAt={sitAt} shadow={false} />
        <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
          {/* оси */}
          <DrawPath d={`M360 ${base - 580} L360 ${base} L960 ${base}`} at={chartAt - 0.3} dur={0.7} stroke={colors.white} width={5} outline />
          <text x={340} y={base - 556} textAnchor="end" fontFamily={fonts.mono} fontSize={26} fontWeight={700} fill={colors.beige} opacity={axisK}>ДОЗА</text>
          {bars.map((b, i) => {
            const k = punch(frame, fps, sec(b.at, fps));
            const x = 420 + i * 180;
            const h = Math.max(0, b.h * k);
            return (
              <g key={i} opacity={k > 0 ? 1 : 0}>
                <rect x={x} y={base - h} width={116} height={h} rx={12} fill={b.color} {...stroke} />
                <rect x={x + 10} y={base - h + 10} width={24} height={Math.max(0, h - 24)} rx={10} fill={colors.white} opacity={0.22} />
                <text x={x + 58} y={base - h - 18} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={56} fill={b.color} stroke={ink} strokeWidth={5} paintOrder="stroke" opacity={Math.min(1, k)}>{b.pct}</text>
                <text x={x + 58} y={base + 46} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fontWeight={700} fill={colors.white}>{b.label}</text>
              </g>
            );
          })}
          {/* зелёная зона первых суток */}
          <g opacity={band.opacity}>
            <rect x={396} y={base - 586} width={340} height={586} fill={colors.green} opacity={0.14} />
          </g>
          <DrawPath d={`M396 ${base - 586} h340 v586 h-340 Z`} at={dayAt} dur={0.7} stroke={colors.green} width={6} dash="22 14" />
        </svg>
        <Label text="24 Ч ВНУТРИ" x={565} y={base - 650} delay={sec(dayAt, fps)} tone="green" />
      </Camera>
      <Label text="ПРАВИЛО 7:10 · ×7 ВРЕМЯ = ÷10 ДОЗА" x={540} y={1225} delay={sec(sevenAt, fps) + 8} tone="dark" size={28} />
    </Backdrop>
  );
};
