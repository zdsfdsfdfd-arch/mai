import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, sec } from "../anim";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { floors: number[]; cabinBetween: [number, number]; reach: number[]; label: string; wavesAt: number };

// Шахта как труба: звуковые волны идут вверх, этажи в зоне слышимости подсвечиваются.
export const SoundDiagram: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const top = 420;
  const bottom = 1160;
  const fh = (bottom - top) / p.floors.length;
  const floorTop = (f: number) => bottom - (p.floors.indexOf(f) + 1) * fh;
  const cabinY = floorTop(p.cabinBetween[0]); // граница между этажами
  const wavesStart = sec(p.wavesAt, fps);
  const wavesOn = frame >= wavesStart;
  const period = 36; // кадров на один цикл волны

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <rect x={440} y={top} width={200} height={bottom - top} fill="#0a0d1a" stroke={colors.line} strokeWidth={3} />
        {p.floors.map((f, i) => {
          const y = floorTop(f);
          const reachIdx = p.reach.indexOf(f);
          const on = reachIdx >= 0 ? fade(frame, wavesStart + 8 + reachIdx * 12, 8) : 0;
          return (
            <g key={f}>
              <rect x={300} y={y} width={140} height={fh} fill={colors.panel} stroke={colors.line} strokeWidth={2} />
              <rect x={640} y={y} width={140} height={fh} fill={colors.panel} stroke={colors.line} strokeWidth={2} />
              {on > 0 && <rect x={300} y={y} width={480} height={fh} fill={colors.green} opacity={0.25 * on} />}
              <text x={370} y={y + fh * 0.6} textAnchor="middle" fontFamily={fonts.mono} fontSize={44} fill={on > 0 ? colors.green : colors.dim}>
                {f}
              </text>
              {/* дверь квартиры */}
              <rect x={690} y={y + fh * 0.3} width={40} height={fh * 0.6} rx={4} fill={on > 0 ? colors.green : colors.doorDark} />
              <line x1={440} y1={y} x2={640} y2={y} stroke={colors.line} strokeWidth={2} strokeDasharray="6 6" />
            </g>
          );
        })}
        {/* кабина */}
        <rect x={470} y={cabinY - fh * 0.3} width={140} height={fh * 0.6} rx={6} fill={colors.panelLight} stroke={colors.yellow} strokeWidth={5} />
        <circle cx={540} cy={cabinY} r={16} fill={colors.skin} />
        {/* волны вверх */}
        {wavesOn &&
          [0, 1, 2].map((k) => {
            const ph = ((frame - wavesStart + k * (period / 3)) % period) / period;
            const r = interpolate(ph, [0, 1], [30, 320]);
            const o = interpolate(ph, [0, 0.1, 1], [0, 0.9, 0]);
            const cy = cabinY - fh * 0.3;
            return <path key={k} d={`M ${540 - r} ${cy} A ${r} ${r} 0 0 1 ${540 + r} ${cy}`} fill="none" stroke={colors.yellow} strokeWidth={8} strokeDasharray="22 16" opacity={o} />;
          })}
      </svg>
      <Label text={p.label} x={540} y={1225} delay={wavesStart + 20} tone="green" />
    </AbsoluteFill>
  );
};
