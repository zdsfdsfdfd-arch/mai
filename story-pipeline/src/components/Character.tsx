import React from "react";
import { interpolate } from "remotion";
import { colors } from "../theme";

// Персонаж в духе референса: плоский вектор без контуров, большая голова без шеи, профиль с одной
// точкой-глазом, тёмно-синяя куртка со светлым воротником, руки из двух сегментов (плечо и предплечье),
// которые поворачиваются вокруг суставов. Покадровой рисовки нет, только риг.
// Живость: дыхание, моргание, жест рукой на каждую фразу (talkAt), переход «стоит → сидит» (sitAt).

export type Pose = "stand" | "point" | "sit" | "knock" | "walk";

type Props = {
  pose: Pose;
  frame: number;
  fps: number;
  knockAt?: number[]; // секунды ударов для позы knock
  talkAt?: number[]; // секунды начала фраз: лёгкий жест рукой
  sitAt?: number; // секунда, когда персонаж садится (анимация из stand в sit)
  scale?: number;
  x?: number;
  y?: number;
  flip?: boolean;
};

const Arm: React.FC<{ sx: number; sy: number; upper: number; fore: number }> = ({ sx, sy, upper, fore }) => (
  <g transform={`translate(${sx} ${sy}) rotate(${upper})`}>
    <rect x={-16} y={-16} width={32} height={100} rx={16} fill={colors.jacket} />
    <g transform={`translate(0 84) rotate(${fore})`}>
      <rect x={-14} y={-14} width={28} height={92} rx={14} fill={colors.jacket} />
      <circle cx={0} cy={82} r={17} fill={colors.skin} />
    </g>
  </g>
);

const smooth = (k: number) => k * k * (3 - 2 * k);

export const Character: React.FC<Props> = ({ pose, frame, fps, knockAt = [], talkAt = [], sitAt, scale = 1, x = 0, y = 0, flip = false }) => {
  const t = frame / fps;
  const breathe = Math.sin(t * 2.2) * 3;

  // переход стоя → сидя
  let sitK = pose === "sit" ? 1 : 0;
  if (sitAt !== undefined) sitK = smooth(interpolate(t, [sitAt, sitAt + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const sitting = sitK > 0.5;

  // жест на фразу: рука приподнимается и опускается за 0,8 с
  let gesture = 0;
  for (const g of talkAt) {
    const d = t - g;
    if (d >= 0 && d <= 0.9) gesture = Math.max(gesture, Math.sin((d / 0.9) * Math.PI));
  }

  // Углы рук по позам (0 = рука висит вниз, отрицательные = вперёд/вверх по направлению взгляда).
  let front = { upper: -8 - 45 * gesture, fore: 6 - 40 * gesture };
  let back = { upper: 10, fore: 4 };
  if (pose === "point") front = { upper: -150, fore: -15 };
  if (pose === "walk") {
    const sw = Math.sin(t * 7);
    front = { upper: -25 * sw, fore: 10 };
    back = { upper: 25 * sw, fore: 10 };
  }
  if (pose === "knock") {
    let hit = 0;
    for (const k of knockAt) {
      const d = frame - k * fps;
      if (d >= 0 && d <= 9) hit = Math.max(hit, interpolate(d, [0, 3, 9], [0, 1, 0]));
    }
    front = { upper: -95, fore: -55 + 50 * hit };
  }
  if (sitK > 0) {
    const sf = { upper: -28 - 25 * gesture, fore: -30 - 30 * gesture };
    const sb = { upper: -22, fore: -30 };
    front = { upper: front.upper + (sf.upper - front.upper) * sitK, fore: front.fore + (sf.fore - front.fore) * sitK };
    back = { upper: back.upper + (sb.upper - back.upper) * sitK, fore: back.fore + (sb.fore - back.fore) * sitK };
  }

  const bodyY = 20 * sitK;
  // моргание: раз в ~3,3 с на 3 кадра
  const blinkPhase = (frame + 17) % Math.round(fps * 3.3);
  const blink = blinkPhase < 3;
  // лёгкий поворот головы на жест
  const headTilt = -3 * gesture;
  // шаг: ноги качаются
  const legSwing = pose === "walk" ? Math.sin(t * 7) * 22 : 0;

  return (
    <svg
      width={300 * scale}
      height={560 * scale}
      viewBox="0 0 300 560"
      style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}
    >
      <g transform={`translate(0 ${breathe + bodyY})`}>
        {/* задняя рука */}
        <Arm sx={118} sy={250} upper={back.upper} fore={back.fore} />
        {/* ноги: стоя / сидя (интерполяция положения) */}
        {sitting ? (
          <g>
            <rect x={110} y={385} width={190} height={48} rx={24} fill={colors.pants} />
            <rect x={262} y={400} width={44} height={110} rx={18} fill={colors.pants} />
            <rect x={254} y={496} width={66} height={30} rx={12} fill={colors.hair} />
            <rect x={150} y={400} width={44} height={110} rx={18} fill={colors.pants} opacity={0.85} />
            <rect x={142} y={496} width={66} height={30} rx={12} fill={colors.hair} opacity={0.85} />
          </g>
        ) : (
          <g>
            <g transform={`rotate(${legSwing} 138 400)`}>
              <rect x={116} y={400} width={44} height={140} rx={18} fill={colors.pants} />
              <rect x={108} y={522} width={62} height={30} rx={12} fill={colors.hair} />
            </g>
            <g transform={`rotate(${-legSwing} 182 400)`}>
              <rect x={160} y={400} width={44} height={140} rx={18} fill={colors.pants} />
              <rect x={156} y={522} width={62} height={30} rx={12} fill={colors.hair} />
            </g>
          </g>
        )}
        {/* тело: куртка */}
        <rect x={100} y={230} width={130} height={190} rx={40} fill={colors.jacket} />
        {/* воротник */}
        <polygon points="150,232 215,232 190,275" fill={colors.collar} />
        {/* голова: профиль вправо */}
        <g transform={`rotate(${headTilt} 160 200)`}>
          <ellipse cx={160} cy={160} rx={88} ry={92} fill={colors.skin} />
          <path d="M72 150 C70 70, 170 50, 240 95 C250 100, 240 120, 228 115 C205 100, 140 90, 110 150 Z" fill={colors.hair} />
          <polygon points="244,165 262,178 244,186" fill={colors.skin} />
          {blink ? <rect x={212} y={149} width={16} height={3} rx={1.5} fill={colors.hair} /> : <circle cx={220} cy={150} r={7} fill={colors.hair} />}
        </g>
        {/* передняя рука */}
        <Arm sx={200} sy={250} upper={front.upper} fore={front.fore} />
      </g>
    </svg>
  );
};

// Чёрный силуэт другого человека (как в референсе), с шагом.
export const Silhouette: React.FC<{ frame: number; fps: number; x: number; y: number; scale?: number; walking?: boolean; flip?: boolean }> = ({
  frame,
  fps,
  x,
  y,
  scale = 1,
  walking = true,
  flip = false,
}) => {
  const t = frame / fps;
  const sw = walking ? Math.sin(t * 7) : 0;
  const bob = walking ? Math.abs(Math.sin(t * 7)) * 4 : 0;
  return (
    <svg width={160 * scale} height={300 * scale} viewBox="0 0 160 300" style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}>
      <g transform={`translate(0 ${-bob})`} fill="#07090f">
        <ellipse cx={80} cy={60} rx={34} ry={38} />
        <rect x={50} y={95} width={60} height={110} rx={26} />
        <rect x={20} y={100} width={22} height={90} rx={11} transform={`rotate(${-20 * sw} 31 100)`} />
        <rect x={118} y={100} width={22} height={90} rx={11} transform={`rotate(${20 * sw} 129 100)`} />
        <rect x={56} y={200} width={22} height={90} rx={11} transform={`rotate(${18 * sw} 67 200)`} />
        <rect x={82} y={200} width={22} height={90} rx={11} transform={`rotate(${-18 * sw} 93 200)`} />
      </g>
    </svg>
  );
};
