import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, sec } from "../anim";
import { Hud } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = {
  floors: number;
  cabinBetween: [number, number];
  highlight?: number[];
  litWindows?: number[];
  litAt?: number;
  hud?: { label: string; value: string; tone?: "red" | "green" | "yellow" };
};

// Дом в разрезе: этажи, шахта лифта, кабина, застрявшая между этажами, подсветка этажей и окон.
export const BuildingCutaway: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const left = 200;
  const right = 820;
  const top = 340;
  const bottom = 1260;
  const fh = (bottom - top) / p.floors;
  const litOpacity = p.litAt !== undefined ? fade(frame, sec(p.litAt, fps), 10) : 1;
  const zoom = interpolate(frame, [0, scene.durationFrames], [1, 1.035]);

  const floorTop = (n: number) => bottom - n * fh; // верхняя граница этажа n
  const cabinY = floorTop(p.cabinBetween[0]) - fh / 2; // кабина застряла между этажами

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute", transform: `scale(${zoom})`, transformOrigin: "540px 800px" }}>
        {/* небо и земля */}
        <rect x={0} y={bottom} width={1080} height={60} fill="#070a14" />
        {/* корпус дома */}
        <rect x={left} y={top} width={right - left} height={bottom - top} fill={colors.panel} />
        {/* шахта */}
        <rect x={500} y={top} width={80} height={bottom - top} fill="#0a0d1a" />
        {Array.from({ length: p.floors }, (_, i) => i + 1).map((n) => {
          const y = floorTop(n);
          const hl = p.highlight?.includes(n);
          const lit = p.litWindows?.includes(n);
          return (
            <g key={n}>
              {hl && <rect x={left} y={y} width={right - left} height={fh} fill={colors.red} opacity={0.22} />}
              <line x1={left} y1={y} x2={right} y2={y} stroke={colors.line} strokeWidth={2} />
              <text x={left - 16} y={y + fh * 0.72} textAnchor="end" fontFamily={fonts.mono} fontSize={fh > 40 ? 26 : 22} fill={hl ? colors.red : colors.dim}>
                {n}
              </text>
              {/* окна слева и справа от шахты */}
              {[250, 330, 410, 620, 700].map((wx) => (
                <rect
                  key={wx}
                  x={wx}
                  y={y + fh * 0.25}
                  width={52}
                  height={fh * 0.5}
                  rx={3}
                  fill={lit ? colors.yellow : "#0f1428"}
                  opacity={lit ? litOpacity : 1}
                />
              ))}
              {lit && (
                <rect x={240} y={y + fh * 0.1} width={230} height={fh * 0.8} rx={10} fill={colors.yellow} opacity={0.18 * litOpacity} />
              )}
            </g>
          );
        })}
        {/* кабина между этажами */}
        <rect x={506} y={cabinY - fh * 0.45} width={68} height={fh * 0.9} rx={4} fill={colors.panelLight} stroke={colors.yellow} strokeWidth={4} />
        <circle cx={540} cy={cabinY} r={fh * 0.16} fill={colors.skin} />
        {/* трос */}
        <line x1={540} y1={top} x2={540} y2={cabinY - fh * 0.45} stroke={colors.dim} strokeWidth={3} strokeDasharray="8 8" />
      </svg>
      {p.hud && <Hud label={p.hud.label} value={p.hud.value} tone={p.hud.tone} />}
    </AbsoluteFill>
  );
};
