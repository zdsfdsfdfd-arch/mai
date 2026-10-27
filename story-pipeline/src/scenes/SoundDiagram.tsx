import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, sec, wiggle } from "../anim";
import { reachLabelAt, reachTimes, wavesAt } from "../beats";
import { Camera, type CamKey } from "../components/Camera";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { floors: number[]; cabinBetween: [number, number]; reach: number[]; label: string };

// Шахта как труба: удар по кабине, волны идут вверх, камера следует за ними, этажи в зоне
// слышимости подсвечиваются один за другим, по стенам шахты бегут штрихи.
export const SoundDiagram: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const dur = scene.durationFrames / fps;
  const top = 420;
  const bottom = 1160;
  const fh = (bottom - top) / p.floors.length;
  const floorTop = (f: number) => bottom - (p.floors.indexOf(f) + 1) * fh;
  const cabinY = floorTop(p.cabinBetween[0]);
  const wStart = wavesAt(scene);
  const wavesOn = t >= wStart;
  const period = 36;
  const reach = reachTimes(scene);
  const topFloorY = floorTop(p.floors[p.floors.length - 1]) + fh / 2;
  const hit = t >= wStart && t < wStart + 0.2 ? wiggle(frame, 5, 4) : { x: 0, y: 0 };
  const focus = (px: number, py: number, s: number): CamKey => ({ t: 0, x: (px - 540) * s, y: (py - 800) * s, scale: s });
  const keys: CamKey[] = [
    { ...focus(540, cabinY, 1.5), t: 0 },
    { ...focus(540, cabinY, 1.5), t: wStart + 0.2 },
    { ...focus(540, topFloorY + 60, 1.3), t: wStart + 1.8 },
    { ...focus(540, 800, 1.0), t: (reach[0] ?? wStart + 2.5) + 0.3 },
    { ...focus(540, 800, 1.0), t: dur },
  ];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <rect x={440} y={top} width={200} height={bottom - top} fill="#0a0d1a" stroke={colors.line} strokeWidth={3} />
          {/* бегущие штрихи вдоль стен шахты после удара */}
          {wavesOn && (
            <g opacity={0.5}>
              <line x1={452} y1={top} x2={452} y2={bottom} stroke={colors.yellow} strokeWidth={3} strokeDasharray="10 30" strokeDashoffset={frame * 3} />
              <line x1={628} y1={top} x2={628} y2={bottom} stroke={colors.yellow} strokeWidth={3} strokeDasharray="10 30" strokeDashoffset={frame * 3 + 15} />
            </g>
          )}
          {p.floors.map((f, i) => {
            const y = floorTop(f);
            const reachIdx = p.reach.indexOf(f);
            const on = reachIdx >= 0 ? fade(frame, sec(reach[reachIdx] ?? 0, fps), 8) : 0;
            return (
              <g key={f}>
                <rect x={300} y={y} width={140} height={fh} fill={colors.panel} stroke={colors.line} strokeWidth={2} />
                <rect x={640} y={y} width={140} height={fh} fill={colors.panel} stroke={colors.line} strokeWidth={2} />
                {on > 0 && <rect x={300} y={y} width={480} height={fh} fill={colors.green} opacity={0.25 * on} />}
                <text x={370} y={y + fh * 0.6} textAnchor="middle" fontFamily={fonts.mono} fontSize={44} fill={on > 0 ? colors.green : colors.dim}>
                  {f}
                </text>
                <rect x={690} y={y + fh * 0.3} width={40} height={fh * 0.6} rx={4} fill={on > 0 ? colors.green : colors.doorDark} />
                <line x1={440} y1={y} x2={640} y2={y} stroke={colors.line} strokeWidth={2} strokeDasharray="6 6" />
              </g>
            );
          })}
          <g transform={`translate(${hit.x} ${hit.y})`}>
            <rect x={470} y={cabinY - fh * 0.3} width={140} height={fh * 0.6} rx={6} fill={colors.panelLight} stroke={colors.yellow} strokeWidth={5} />
            <circle cx={540} cy={cabinY} r={16} fill={colors.skin} />
          </g>
          {wavesOn &&
            [0, 1, 2].map((k) => {
              const ph = ((frame - sec(wStart, fps) + k * (period / 3)) % period) / period;
              const r = interpolate(ph, [0, 1], [30, 320]);
              const o = interpolate(ph, [0, 0.1, 1], [0, 0.9, 0]);
              const cy = cabinY - fh * 0.3;
              return <path key={k} d={`M ${540 - r} ${cy} A ${r} ${r} 0 0 1 ${540 + r} ${cy}`} fill="none" stroke={colors.yellow} strokeWidth={8} strokeDasharray="22 16" opacity={o} />;
            })}
        </svg>
        <Label text={p.label} x={540} y={1225} delay={sec(reachLabelAt(scene), fps)} tone="green" />
      </Camera>
    </AbsoluteFill>
  );
};
