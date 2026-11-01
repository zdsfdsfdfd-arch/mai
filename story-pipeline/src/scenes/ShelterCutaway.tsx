import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, Burst, Glow, Puff, Shake } from "../components/Fx";
import { Label } from "../components/Overlays";
import { colors, fonts, ink, stroke } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { floors: number };

// Машина с красным крестом, герой бежит к толстому дому (пыль из-под ног), дом в разрезе:
// этажи подкрашиваются по защите, герой спускается в подвал, где горит лампа.
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
  const crossBurst = interpolate(t, [carAt + 0.1, carAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const runK = interpolate(t, [bAt, bAt + 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const heroX = 60 + 300 * runK;
  const outsideOp = interpolate(t, [bAt + 1.6, bAt + 1.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const carLblOp = interpolate(t, [bAt + 0.8, bAt + 1.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const baseK = interpolate(t, [baseAt, baseAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const keys = [focusKey(0, 300, 1000, 1.25), focusKey(carAt + 0.6, 300, 1000, 1.25), focusKey(bAt + 1.2, 640, 800, 0.95), focusKey(fAt, 670, 760, 1.0), focusKey(baseAt + 0.5, 670, 1040, 1.35), focusKey(dur, 670, 1050, 1.4)];
  const floorColor = (n: number) => {
    const d = (p.floors - n) * 0.07;
    const k = interpolate(t, [fAt + d, fAt + d + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (k === 0) return "rgba(0,0,0,0)";
    const mid = n >= 3 && n <= p.floors - 2;
    return mid ? `rgba(243,192,58,${0.38 * k})` : `rgba(229,57,47,${0.34 * k})`;
  };
  const lbl = (txt: string, x: number, y: number, at: number, tone: "dark" | "red" | "green" | "beige") => <Label text={txt} x={x} y={y} delay={sec(at, fps)} tone={tone} size={26} />;
  const stepPuff = runK > 0 && runK < 1 ? ((t - bAt) % 0.32) / 0.32 : 0;

  return (
    <Backdrop variant="haze" grid={false} particles={false}>
      <Camera keys={keys}>
        <Shake at={carAt} amp={10} dur={0.4}>
          <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
            {/* дымка и земля */}
            {[0, 1].map((i) => (
              <ellipse key={i} cx={300 + i * 500} cy={900 + i * 40} rx={420} ry={50} fill="#c9a07a" opacity={0.12} />
            ))}
            {/* далёкий гриб и дым, соседние дома */}
            <g transform="translate(150 520) scale(0.42)" opacity={0.75}>
              <path d="M-40 320 C-40 140, -60 60, -34 -10 L34 -10 C60 60, 40 140, 40 320 Z" fill="#5a4648" {...stroke} />
              <ellipse cx={0} cy={-30} rx={210} ry={110} fill="#6f5c5c" {...stroke} />
              <ellipse cx={-70} cy={-80} rx={120} ry={80} fill="#86716f" {...stroke} />
              <ellipse cx={0} cy={-120} rx={150} ry={70} fill="#9a8484" {...stroke} />
            </g>
            <rect x={960} y={520} width={200} height={600} fill="#2a2a3c" {...stroke} strokeWidth={5} />
            {[0, 1, 2, 3, 4, 5].map((r) => (
              <rect key={r} x={990} y={550 + r * 90} width={40} height={50} fill="#0f1428" stroke={ink} strokeWidth={3} />
            ))}
            {Array.from({ length: 30 }, (_, i) => (
              <circle key={i} cx={(i * 157) % 1080} cy={(((i * 211) % 900) + t * 40 * (1 + (i % 3))) % 900 + 300} r={2 + (i % 3)} fill="#d9cfb8" opacity={0.4} />
            ))}
            <rect x={-200} y={ground} width={1480} height={500} fill="#2b2b33" />
            <line x1={-200} y1={ground} x2={1280} y2={ground} stroke={ink} strokeWidth={8} />
            {/* подвал */}
            <rect x={left - 14} y={ground} width={right - left + 28} height={186} fill="#1c2440" {...stroke} />
            <rect x={left} y={ground} width={right - left} height={170} fill={baseK > 0 ? `rgba(62,198,109,${0.12 + 0.25 * baseK})` : "rgba(0,0,0,0)"} stroke={colors.green} strokeWidth={baseK > 0 ? 6 : 0} />
            <line x1={left + 20} y1={ground + 24} x2={right - 20} y2={ground + 24} stroke="#4a567a" strokeWidth={10} strokeLinecap="round" />
            <line x1={left + 60} y1={ground + 24} x2={left + 60} y2={ground + 60} stroke="#4a567a" strokeWidth={10} strokeLinecap="round" />
            <rect x={left + 40} y={ground + 110} width={70} height={60} rx={6} fill="#6b4420" {...stroke} strokeWidth={4} />
            <line x1={670} y1={ground + 24} x2={670} y2={ground + 56} stroke={ink} strokeWidth={4} />
            <circle cx={670} cy={ground + 66} r={14} fill={baseK > 0 ? colors.yellow : "#5a5a66"} {...stroke} strokeWidth={4} />
            <text x={(left + right) / 2 + 100} y={ground + 70} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fontWeight={700} fill={colors.green} letterSpacing={4} opacity={baseK}>ПОДВАЛ</text>
            {/* дом в разрезе */}
            <rect x={left} y={top} width={right - left} height={ground - top} fill="#232a44" {...stroke} />
            {Array.from({ length: p.floors }, (_, i) => i + 1).map((n) => {
              const y = ground - n * fh;
              return (
                <g key={n}>
                  <rect x={left} y={y} width={right - left} height={fh} fill={floorColor(n)} />
                  <line x1={left} y1={y} x2={right} y2={y} stroke={ink} strokeWidth={4} />
                  <rect x={left + 22} y={y + fh * 0.22} width={44} height={fh * 0.5} rx={4} fill="#0f1428" stroke={ink} strokeWidth={3} />
                  <rect x={right - 66} y={y + fh * 0.22} width={44} height={fh * 0.5} rx={4} fill="#0f1428" stroke={ink} strokeWidth={3} />
                  <rect x={left + 130} y={y + fh * 0.55} width={60} height={fh * 0.3} rx={4} fill="#3a4668" stroke={ink} strokeWidth={3} />
                  <rect x={right - 190} y={y + fh * 0.5} width={44} height={fh * 0.35} rx={4} fill="#6b4420" stroke={ink} strokeWidth={3} />
                  <text x={left - 22} y={y + fh * 0.7} textAnchor="end" fontFamily={fonts.mono} fontSize={24} fontWeight={700} fill={colors.beige}>{n}</text>
                </g>
              );
            })}
            {/* лестница */}
            <path d={Array.from({ length: p.floors }, (_, i) => `${i === 0 ? "M" : "L"}${670 + (i % 2 ? 40 : -40)} ${ground - i * fh}`).join(" ") + ` L670 ${top}`} fill="none" stroke="#4a567a" strokeWidth={6} />
            {/* стены и крыша */}
            <rect x={left - 16} y={top} width={16} height={ground - top} fill="#6a6a78" {...stroke} strokeWidth={5} />
            <rect x={right} y={top} width={16} height={ground - top} fill="#6a6a78" {...stroke} strokeWidth={5} />
            <rect x={left - 30} y={top - 24} width={right - left + 60} height={26} rx={6} fill="#4a567a" {...stroke} />
            {/* дверь */}
            <rect x={left + 4} y={ground - 80} width={48} height={80} rx={4} fill="#6b4420" {...stroke} strokeWidth={5} />
            {/* машина */}
            <g transform="translate(130 1000)">
              <path d="M0 60 L0 30 Q0 18 14 16 L54 10 L84 -24 Q92 -34 108 -34 L170 -34 Q186 -34 194 -24 L220 10 L232 14 Q244 18 244 32 L244 60 Q244 70 232 70 L12 70 Q0 70 0 60 Z" fill="#a33a3a" {...stroke} />
              <path d="M92 -22 L110 -22 L110 8 L70 8 Z" fill="#cfe3ff" stroke={ink} strokeWidth={4} />
              <path d="M124 -22 L166 -22 L184 8 L124 8 Z" fill="#cfe3ff" stroke={ink} strokeWidth={4} />
              <rect x={0} y={40} width={244} height={10} fill="#7a2a2a" opacity={0.7} />
              <circle cx={56} cy={74} r={26} fill="#1b1b22" {...stroke} strokeWidth={5} />
              <circle cx={56} cy={74} r={10} fill="#8c91a6" />
              <circle cx={188} cy={74} r={26} fill="#1b1b22" {...stroke} strokeWidth={5} />
              <circle cx={188} cy={74} r={10} fill="#8c91a6" />
              <rect x={226} y={30} width={14} height={14} rx={3} fill={colors.yellow} stroke={ink} strokeWidth={3} />
            </g>
            <g opacity={crossK > 0 ? 1 : 0} strokeLinecap="round">
              <line x1={120} y1={940} x2={120 + 270 * Math.min(1, crossK * 2)} y2={940 + 180 * Math.min(1, crossK * 2)} stroke={ink} strokeWidth={28} />
              <line x1={390} y1={940} x2={390 - 270 * Math.max(0, crossK * 2 - 1)} y2={940 + 180 * Math.max(0, crossK * 2 - 1)} stroke={ink} strokeWidth={28} />
              <line x1={120} y1={940} x2={120 + 270 * Math.min(1, crossK * 2)} y2={940 + 180 * Math.min(1, crossK * 2)} stroke={colors.red} strokeWidth={16} />
              <line x1={390} y1={940} x2={390 - 270 * Math.max(0, crossK * 2 - 1)} y2={940 + 180 * Math.max(0, crossK * 2 - 1)} stroke={colors.red} strokeWidth={16} />
            </g>
          </svg>
          <Burst x={255} y={1030} k={crossBurst} n={10} r0={90} r1={320} color={colors.red} width={7} />
          {/* герой бежит к дому */}
          <Puff x={heroX + 60} y={ground - 6} k={stepPuff} r={26} color="#8a7a66" />
          <Character pose={runK > 0 && runK < 1 ? "run" : "stand"} frame={frame} fps={fps} x={heroX} y={ground - 540 * 0.62 + 10} scale={0.62} mood={runK < 1 ? "scared" : "neutral"} opacity={outsideOp} />
          {/* герой внутри: идёт по первому этажу к лестнице, потом сидит в подвале */}
          {t >= bAt + 1.7 && baseK < 1 && (
            <Character pose={t < baseAt - 0.2 ? "walk" : "stand"} frame={frame} fps={fps} x={440 + 180 * interpolate(t, [bAt + 1.7, baseAt - 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} y={ground - 0.99 * 560 * 0.16} scale={0.16} opacity={1 - baseK} shadow={false} />
          )}
          {baseK > 0 && <Glow x={670} y={ground + 80} r={180} color={colors.yellow} opacity={0.45 * baseK} />}
          {baseK > 0 && <Character pose="sit" frame={frame} fps={fps} x={500} y={ground + 162 - 0.9 * 560 * 0.3} scale={0.3} mood="tired" opacity={baseK} />}
          <div style={{ position: "absolute", inset: 0, opacity: carLblOp, pointerEvents: "none" }}>{lbl("МАШИНА · ПОЧТИ 0", 400, 870, carAt, "red")}</div>
          {lbl("ВЕРХ · ОКНА ÷2", 670, top + fh * 0.5, fAt + 0.3, "red")}
          {lbl("СЕРЕДИНА ÷10", 670, top + fh * (p.floors / 2), fAt + 0.6, "beige")}
          {lbl("ПОДВАЛ ÷50", 770, ground + 150, baseAt + 0.3, "green")}
        </Shake>
      </Camera>
    </Backdrop>
  );
};
