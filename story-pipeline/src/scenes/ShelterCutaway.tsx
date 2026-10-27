import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { floors: number };

// Машина с красным крестом, герой бежит к толстому дому, дом в разрезе с подвалом: этажи
// раскрашиваются по защите (подвал ÷50, середина ÷10, верх и окна ÷2), камера уходит в подвал.
export const ShelterCutaway: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const carAt = B.carAt(scene);
  const bAt = B.buildingAt(scene);
  const fAt = B.floorsAt(scene);
  const baseAt = B.basementAt(scene);
  const left = 420;
  const right = 920;
  const top = 380;
  const ground = 1120;
  const fh = (ground - top) / p.floors;
  const crossK = interpolate(t, [carAt, carAt + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const runK = interpolate(t, [bAt, bAt + 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const heroX = 60 + 300 * runK;
  const outsideOp = interpolate(t, [bAt + 1.6, bAt + 1.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const carLblOp = interpolate(t, [bAt + 0.8, bAt + 1.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const colorK = interpolate(t, [fAt, fAt + 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const baseK = interpolate(t, [baseAt, baseAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const keys = [focusKey(0, 300, 1000, 1.25), focusKey(carAt + 0.6, 300, 1000, 1.25), focusKey(bAt + 1.2, 640, 800, 0.95), focusKey(fAt, 670, 760, 1.0), focusKey(baseAt + 0.5, 670, 1040, 1.35), focusKey(dur, 670, 1050, 1.4)];
  const floorColor = (n: number) => {
    // n = 1..floors снизу; защита: верхний и первый слабые, середина лучше
    if (colorK === 0) return colors.panel;
    const mid = n >= 3 && n <= p.floors - 2;
    return mid ? `rgba(243,192,58,${0.35 * colorK})` : `rgba(229,57,47,${0.3 * colorK})`;
  };
  const lbl = (txt: string, x: number, y: number, at: number, tone: "dark" | "red" | "green" | "beige") => <Label text={txt} x={x} y={y} delay={sec(at, fps)} tone={tone} size={26} />;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #3a2a2a 0%, #5a4a40 60%, #2b2b33 100%)` }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* земля и подвал */}
          <rect x={0} y={ground} width={1080} height={400} fill="#2b2b33" />
          <rect x={left} y={ground} width={right - left} height={170} fill={baseK > 0 ? `rgba(62,198,109,${0.15 + 0.3 * baseK})` : "#1c2440"} stroke={colors.green} strokeWidth={baseK > 0 ? 6 : 0} />
          <text x={(left + right) / 2 + 100} y={ground + 70} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fill={colors.green} letterSpacing={4} opacity={baseK}>ПОДВАЛ</text>
          {/* дом в разрезе */}
          <rect x={left} y={top} width={right - left} height={ground - top} fill={colors.panel} stroke={colors.line} strokeWidth={4} />
          {Array.from({ length: p.floors }, (_, i) => i + 1).map((n) => {
            const y = ground - n * fh;
            return (
              <g key={n}>
                <rect x={left} y={y} width={right - left} height={fh} fill={floorColor(n)} />
                <line x1={left} y1={y} x2={right} y2={y} stroke={colors.line} strokeWidth={2} />
                <rect x={left + 20} y={y + fh * 0.25} width={40} height={fh * 0.5} fill="#0f1428" />
                <rect x={right - 60} y={y + fh * 0.25} width={40} height={fh * 0.5} fill="#0f1428" />
                <text x={left - 16} y={y + fh * 0.7} textAnchor="end" fontFamily={fonts.mono} fontSize={24} fill={colors.dim}>{n}</text>
              </g>
            );
          })}
          {/* стены толстые */}
          <rect x={left - 14} y={top} width={14} height={ground - top} fill="#6a6a78" />
          <rect x={right} y={top} width={14} height={ground - top} fill="#6a6a78" />
          {/* машина слева */}
          <g transform="translate(140 1010)">
            <rect x={0} y={20} width={220} height={70} rx={18} fill="#8a3a3a" />
            <rect x={50} y={-20} width={120} height={50} rx={14} fill="#8a3a3a" />
            <rect x={60} y={-12} width={100} height={34} rx={8} fill="#cfe3ff" />
            <circle cx={50} cy={95} r={24} fill="#1b1b22" />
            <circle cx={170} cy={95} r={24} fill="#1b1b22" />
          </g>
          <g opacity={crossK > 0 ? 1 : 0}>
            <line x1={120} y1={960} x2={120 + 260 * Math.min(1, crossK * 2)} y2={960 + 170 * Math.min(1, crossK * 2)} stroke={colors.red} strokeWidth={16} strokeLinecap="round" />
            <line x1={380} y1={960} x2={380 - 260 * Math.max(0, crossK * 2 - 1)} y2={960 + 170 * Math.max(0, crossK * 2 - 1)} stroke={colors.red} strokeWidth={16} strokeLinecap="round" />
          </g>
        </svg>
        {/* герой бежит к дому */}
        <Character pose={runK > 0 && runK < 1 ? "run" : "stand"} frame={frame} fps={fps} x={heroX} y={ground - 540 * 0.62 + 10} scale={0.62} mood={runK < 1 ? "scared" : "neutral"} opacity={outsideOp} />
        {/* герой в подвале */}
        {baseK > 0 && <Character pose="sit" frame={frame} fps={fps} x={470} y={ground + 160 - 0.9 * 560 * 0.42} scale={0.42} mood="tired" opacity={baseK} />}
        <div style={{ position: "absolute", inset: 0, opacity: carLblOp, pointerEvents: "none" }}>{lbl("МАШИНА · ПОЧТИ 0", 400, 870, carAt, "red")}</div>
        {lbl("ВЕРХ · ОКНА ÷2", 670, top + fh * 0.5, fAt + 0.3, "red")}
        {lbl("СЕРЕДИНА ÷10", 670, top + fh * (p.floors / 2), fAt + 0.6, "beige")}
        {lbl("ПОДВАЛ ÷50", 770, ground + 150, baseAt + 0.3, "green")}
      </Camera>
    </AbsoluteFill>
  );
};
