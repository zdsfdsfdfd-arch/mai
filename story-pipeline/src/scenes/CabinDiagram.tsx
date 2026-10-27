import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import { cabinTimes } from "../beats";
import { Camera, type CamKey } from "../components/Camera";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { hatchLabel: string; doorsLabel: string; shaftLabel: string };

// План кабины сверху. Контур рисуется, камера идёт к люку (пунктир «бежит»), затем к дверям
// (красный крест рисуется), затем вниз по шахте (гравировка этажей −1…−12 уходит вниз).
export const CabinDiagram: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const dur = scene.durationFrames / fps;
  const { hatchAt, doorsAt, shaftAt } = cabinTimes(scene);
  const draw = interpolate(t, [0.1, 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hatch = pop(frame, fps, sec(hatchAt, fps));
  const xK = interpolate(t, [doorsAt, doorsAt + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shaftK = interpolate(t, [shaftAt, shaftAt + 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const focus = (px: number, py: number, s: number): CamKey => ({ t: 0, x: (px - 540) * s, y: (py - 800) * s, scale: s });
  const keys: CamKey[] = [
    { ...focus(540, 760, 1.0), t: 0 },
    { ...focus(540, 760, 1.0), t: hatchAt - 0.3 },
    { ...focus(540, 600, 1.5), t: hatchAt + 0.5 },
    { ...focus(540, 600, 1.5), t: doorsAt - 0.3 },
    { ...focus(540, 930, 1.4), t: doorsAt + 0.5 },
    { ...focus(540, 930, 1.4), t: shaftAt - 0.3 },
    { ...focus(540, 1060, 1.05), t: shaftAt + 0.8 },
    { ...focus(540, 1100, 1.0), t: dur },
  ];
  const perim = 2 * (520 + 400);

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={colors.panelLight} stopOpacity="0.9" />
              <stop offset="1" stopColor="#05070d" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* шахта вниз: растёт по высоте, этажи уходят вниз */}
          <g opacity={shaftK > 0 ? 1 : 0}>
            <rect x={300} y={930} width={480} height={320 * shaftK} fill="url(#shaftGrad)" />
            {Array.from({ length: 12 }, (_, i) => {
              const y = 960 + i * 26 * shaftK + ((t - shaftAt) * 40) % 26;
              return (
                <g key={i} opacity={shaftK * 0.7}>
                  <line x1={330} y1={y} x2={360} y2={y} stroke={colors.dim} strokeWidth={2} />
                  <text x={372} y={y + 7} fontFamily={fonts.mono} fontSize={20} fill={colors.dim}>
                    −{i + 1}
                  </text>
                </g>
              );
            })}
            <line x1={540} y1={960} x2={540} y2={960 + 240 * shaftK} stroke={colors.red} strokeWidth={6} strokeDasharray="16 14" strokeDashoffset={-frame * 1.5} />
            <polygon points={`540,${1230 * shaftK + 0 * (1 - shaftK)} 518,${1196 * shaftK} 562,${1196 * shaftK}`} fill={colors.red} opacity={shaftK} />
          </g>
          {/* кабина: контур рисуется */}
          <rect x={280} y={530} width={520} height={400} rx={10} fill={colors.panel} opacity={draw} />
          <rect x={280} y={530} width={520} height={400} rx={10} fill="none" stroke={colors.white} strokeWidth={7} strokeDasharray={perim} strokeDashoffset={perim * (1 - draw)} />
          <g opacity={interpolate(t, [0.7, 1.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
            <circle cx={540} cy={760 + Math.sin(t * 2) * 2} r={28} fill={colors.skin} />
            <rect x={506} y={792 + Math.sin(t * 2) * 2} width={68} height={74} rx={22} fill={colors.jacket} />
            <text x={540} y={700} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fill={colors.dim}>ВЫ</text>
          </g>
          {/* люк: «бегущий» пунктир */}
          <g opacity={hatch.opacity} transform={`translate(0 ${hatch.y})`}>
            <rect x={480} y={560} width={120} height={90} rx={8} fill="none" stroke={colors.yellow} strokeWidth={5} strokeDasharray="14 10" strokeDashoffset={-frame * 1.2} />
            <line x1={480} y1={560} x2={600} y2={650} stroke={colors.yellow} strokeWidth={4} opacity={0.6} />
          </g>
          {/* двери и крест, который рисуется */}
          <line x1={400} y1={930} x2={680} y2={930} stroke={colors.door} strokeWidth={18} opacity={draw} />
          <line x1={500} y1={890} x2={500 + 80 * Math.min(1, xK * 2)} y2={890 + 80 * Math.min(1, xK * 2)} stroke={colors.red} strokeWidth={12} strokeLinecap="round" opacity={xK > 0 ? 1 : 0} />
          <line x1={580} y1={890} x2={580 - 80 * Math.max(0, xK * 2 - 1)} y2={890 + 80 * Math.max(0, xK * 2 - 1)} stroke={colors.red} strokeWidth={12} strokeLinecap="round" opacity={xK > 0.5 ? 1 : 0} />
        </svg>
        <div style={{ position: "absolute", inset: 0, opacity: interpolate(t, [doorsAt + 0.1, doorsAt + 0.5], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <Label text={p.hatchLabel} x={540} y={440} delay={sec(hatchAt, fps)} tone="beige" />
        </div>
        <Label text={p.doorsLabel} x={540} y={1010} delay={sec(doorsAt, fps)} tone="red" />
        <Label text={p.shaftLabel} x={540} y={1160} delay={sec(shaftAt, fps)} tone="dark" />
      </Camera>
    </AbsoluteFill>
  );
};
