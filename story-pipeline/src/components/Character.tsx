import React from "react";
import { interpolate } from "remotion";
import { colors } from "../theme";

// Персонаж в духе референса: плоский вектор без контуров, большая голова без шеи, профиль с одной
// точкой-глазом, тёмно-синяя куртка со светлым воротником, руки из двух сегментов (плечо и предплечье),
// которые поворачиваются вокруг суставов. Покадровой рисовки нет, только риг.

type Pose = "stand" | "point" | "sit" | "knock";

type Props = {
  pose: Pose;
  frame: number;
  fps: number;
  knockAt?: number[]; // секунды ударов для позы knock
  scale?: number;
  x?: number;
  y?: number;
  flip?: boolean;
};

const Arm: React.FC<{ sx: number; sy: number; upper: number; fore: number; z?: number }> = ({ sx, sy, upper, fore }) => (
  <g transform={`translate(${sx} ${sy}) rotate(${upper})`}>
    <rect x={-16} y={-16} width={32} height={100} rx={16} fill={colors.jacket} />
    <g transform={`translate(0 84) rotate(${fore})`}>
      <rect x={-14} y={-14} width={28} height={92} rx={14} fill={colors.jacket} />
      <circle cx={0} cy={82} r={17} fill={colors.skin} />
    </g>
  </g>
);

export const Character: React.FC<Props> = ({ pose, frame, fps, knockAt = [], scale = 1, x = 0, y = 0, flip = false }) => {
  const t = frame / fps;
  const breathe = Math.sin(t * 2.2) * 3;

  // Углы рук по позам (градусы, 0 = рука висит вниз, отрицательные = вперёд/вверх по направлению взгляда).
  let front = { upper: -8, fore: 6 };
  let back = { upper: 10, fore: 4 };
  if (pose === "point") front = { upper: -150, fore: -15 };
  if (pose === "sit") {
    // руки лежат на коленях
    front = { upper: -28, fore: -30 };
    back = { upper: -22, fore: -30 };
  }
  if (pose === "knock") {
    // Основа: рука горизонтально вперёд, предплечье согнуто; на ударе предплечье резко распрямляется.
    let hit = 0;
    for (const k of knockAt) {
      const kf = k * fps;
      const d = frame - kf;
      if (d >= 0 && d <= 9) hit = Math.max(hit, interpolate(d, [0, 3, 9], [0, 1, 0]));
    }
    front = { upper: -95, fore: -55 + 50 * hit };
  }

  const sitting = pose === "sit";
  const bodyY = sitting ? 20 : 0;

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
        {/* ноги */}
        {sitting ? (
          <g>
            {/* бёдра вперёд, голени вниз, ботинки */}
            <rect x={110} y={385} width={190} height={48} rx={24} fill={colors.pants} />
            <rect x={262} y={400} width={44} height={110} rx={18} fill={colors.pants} />
            <rect x={254} y={496} width={66} height={30} rx={12} fill={colors.hair} />
            <rect x={150} y={400} width={44} height={110} rx={18} fill={colors.pants} opacity={0.85} />
            <rect x={142} y={496} width={66} height={30} rx={12} fill={colors.hair} opacity={0.85} />
          </g>
        ) : (
          <g>
            <rect x={116} y={400} width={44} height={140} rx={18} fill={colors.pants} />
            <rect x={160} y={400} width={44} height={140} rx={18} fill={colors.pants} />
            <rect x={108} y={522} width={62} height={30} rx={12} fill={colors.hair} />
            <rect x={156} y={522} width={62} height={30} rx={12} fill={colors.hair} />
          </g>
        )}
        {/* тело: куртка */}
        <rect x={100} y={230} width={130} height={190} rx={40} fill={colors.jacket} />
        {/* воротник */}
        <polygon points="150,232 215,232 190,275" fill={colors.collar} />
        {/* голова: профиль вправо */}
        <ellipse cx={160} cy={160} rx={88} ry={92} fill={colors.skin} />
        {/* волосы */}
        <path d="M72 150 C70 70, 170 50, 240 95 C250 100, 240 120, 228 115 C205 100, 140 90, 110 150 Z" fill={colors.hair} />
        {/* нос и глаз */}
        <polygon points="244,165 262,178 244,186" fill={colors.skin} />
        <circle cx={220} cy={150} r={7} fill={colors.hair} />
        {/* передняя рука */}
        <Arm sx={200} sy={250} upper={front.upper} fore={front.fore} />
      </g>
    </svg>
  );
};
