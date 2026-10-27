import React from "react";
import { interpolate } from "remotion";
import { colors } from "../theme";

// Барашек: облако-тело из кругов, тёмная мордочка, ножки, хвостик. Бантик, пижама, состояния:
// idle (дышит), walk/run (шаг), chew (жуёт, листик у рта), squint (прищур «как на свекровь»).
export type SheepState = "idle" | "walk" | "run" | "chew" | "squint";

type Props = {
  frame: number;
  fps: number;
  x: number;
  y: number;
  scale?: number;
  color?: "white" | "black";
  bow?: boolean;
  bowOpacity?: number;
  pajama?: boolean;
  state?: SheepState;
  flip?: boolean;
  opacity?: number;
};

export const Sheep: React.FC<Props> = ({ frame, fps, x, y, scale = 1, color = "white", bow = false, bowOpacity = 1, pajama = false, state = "idle", flip = false, opacity = 1 }) => {
  const t = frame / fps;
  const wool = color === "white" ? "#f1efe6" : "#2b2b36";
  const woolShade = color === "white" ? "#d9d6cc" : "#1c1c25";
  const face = color === "white" ? "#3a3a46" : "#15151c";
  const muzzle = color === "white" ? "#4a4a58" : "#2a2a36";
  const legs = "#2a2a36";
  const speed = state === "run" ? 16 : state === "walk" ? 9 : 0;
  const sw = speed ? Math.sin(t * speed) : 0;
  const bob = speed ? Math.abs(Math.sin(t * speed)) * 5 : Math.sin(t * 2) * 2;
  const chewK = state === "chew" ? Math.abs(Math.sin(t * 7)) : 0;
  const headDrop = state === "chew" ? 14 + 6 * chewK : 0;
  const squint = state === "squint";

  return (
    <svg width={220 * scale} height={170 * scale} viewBox="0 0 220 170" style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : undefined, overflow: "visible", opacity }}>
      <g transform={`translate(0 ${-bob})`}>
        {/* ножки */}
        <rect x={60} y={110} width={14} height={48} rx={6} fill={legs} transform={`rotate(${18 * sw} 67 110)`} />
        <rect x={120} y={110} width={14} height={48} rx={6} fill={legs} transform={`rotate(${-18 * sw} 127 110)`} />
        <rect x={82} y={112} width={14} height={46} rx={6} fill={legs} transform={`rotate(${-14 * sw} 89 112)`} opacity={0.85} />
        <rect x={142} y={112} width={14} height={46} rx={6} fill={legs} transform={`rotate(${14 * sw} 149 112)`} opacity={0.85} />
        {/* тело-облако */}
        <g>
          <circle cx={70} cy={90} r={38} fill={woolShade} />
          <circle cx={140} cy={92} r={36} fill={woolShade} />
          <circle cx={105} cy={70} r={44} fill={wool} />
          <circle cx={62} cy={75} r={34} fill={wool} />
          <circle cx={150} cy={78} r={34} fill={wool} />
          <circle cx={105} cy={100} r={40} fill={wool} />
          <circle cx={40} cy={95} r={22} fill={wool} />
          {/* хвостик */}
          <circle cx={22} cy={78} r={12} fill={wool} />
        </g>
        {/* пижама: полоски и колпак */}
        {pajama && (
          <g opacity={0.75}>
            {[52, 76, 100, 124, 148].map((px) => (
              <rect key={px} x={px} y={40} width={10} height={90} rx={5} fill="#5f8de0" opacity={0.6} />
            ))}
          </g>
        )}
        {/* голова справа */}
        <g transform={`translate(0 ${headDrop}) rotate(${state === "chew" ? 8 : 0} 170 60)`}>
          <ellipse cx={178} cy={66} rx={30} ry={26} fill={face} />
          <ellipse cx={196} cy={72} rx={14} ry={11} fill={muzzle} />
          {/* ухо */}
          <ellipse cx={156} cy={52} rx={16} ry={8} fill={face} transform="rotate(-25 156 52)" />
          {/* чёлка */}
          <circle cx={170} cy={42} r={14} fill={wool} />
          <circle cx={185} cy={46} r={10} fill={wool} />
          {/* глаз */}
          {squint ? (
            <rect x={178} y={58} width={14} height={3} rx={1.5} fill={colors.white} transform="rotate(12 185 60)" />
          ) : (
            <>
              <circle cx={185} cy={60} r={6} fill={colors.white} />
              <circle cx={187} cy={61} r={3} fill="#0b0b10" />
            </>
          )}
          {squint && <path d="M172 50 L196 54" stroke={colors.white} strokeWidth={2} opacity={0.6} />}
          {/* листик при жевании */}
          {state === "chew" && <ellipse cx={206} cy={78} rx={9} ry={4} fill={colors.green} transform={`rotate(${-30 + 20 * chewK} 206 78)`} />}
          {/* бантик */}
          {bow && (
            <g opacity={bowOpacity} transform="translate(178 32)">
              <polygon points="0,0 -22,-14 -22,12" fill={colors.red} />
              <polygon points="0,0 22,-14 22,12" fill={colors.red} />
              <circle cx={0} cy={0} r={6} fill="#b9241c" />
            </g>
          )}
          {pajama && (
            <g transform="translate(176 30)">
              <polygon points="-18,8 18,8 6,-26" fill="#5f8de0" />
              <circle cx={6} cy={-26} r={6} fill={colors.white} />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
};

// Барашек на плане квартиры (вид сверху): овал тела и кружок головы.
export const SheepTop: React.FC<{ x: number; y: number; scale?: number; frame: number; fps: number; opacity?: number }> = ({ x, y, scale = 1, frame, fps, opacity = 1 }) => {
  const t = frame / fps;
  const chew = Math.sin(t * 7) * 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <ellipse cx={0} cy={0} rx={34} ry={22} fill="#f1efe6" />
      <circle cx={34 + chew} cy={0} r={13} fill="#3a3a46" />
      <circle cx={-32} cy={0} r={7} fill="#f1efe6" />
    </g>
  );
};

// Сердечко для романтических моментов.
export const Heart: React.FC<{ x: number; y: number; size?: number; opacity?: number; color?: string }> = ({ x, y, size = 40, opacity = 1, color = "#ff5d8f" }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: "absolute", left: x, top: y, opacity }}>
    <path d="M20 36 C6 26, 2 16, 8 9 C13 4, 19 7, 20 12 C21 7, 27 4, 32 9 C38 16, 34 26, 20 36 Z" fill={color} />
  </svg>
);

export const interpolateClamp = (v: number, a: number, b: number, c: number, d: number) =>
  interpolate(v, [a, b], [c, d], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
