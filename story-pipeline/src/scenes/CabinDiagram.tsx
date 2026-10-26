import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { hatchLabel: string; doorsLabel: string; shaftLabel: string; hatchAt: number; doorsAt: number; shaftAt: number };

// План кабины сверху: люк, двери, шахта под кабиной. Подписи появляются в темпе озвучки.
export const CabinDiagram: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const box = pop(frame, fps, 3);
  const doorsX = pop(frame, fps, sec(p.doorsAt, fps));
  const shaft = pop(frame, fps, sec(p.shaftAt, fps));
  const hatch = pop(frame, fps, sec(p.hatchAt, fps));

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {/* шахта вниз */}
        <defs>
          <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colors.panelLight} stopOpacity="0.9" />
            <stop offset="1" stopColor="#05070d" stopOpacity="1" />
          </linearGradient>
        </defs>
        <g opacity={shaft.opacity}>
          <rect x={300} y={930} width={480} height={320} fill="url(#shaftGrad)" />
          <line x1={540} y1={960} x2={540} y2={1200} stroke={colors.red} strokeWidth={6} strokeDasharray="16 14" />
          <polygon points="540,1230 518,1196 562,1196" fill={colors.red} />
        </g>
        <g opacity={box.opacity} transform={`translate(540 740) scale(${box.scale}) translate(-540 -740)`}>
          {/* кабина */}
          <rect x={280} y={530} width={520} height={400} rx={10} fill={colors.panel} stroke={colors.white} strokeWidth={7} />
          {/* человек */}
          <circle cx={540} cy={760} r={28} fill={colors.skin} />
          <rect x={506} y={792} width={68} height={74} rx={22} fill={colors.jacket} />
          <text x={540} y={700} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fill={colors.dim}>ВЫ</text>
          {/* люк */}
          <g opacity={hatch.opacity}>
            <rect x={480} y={560} width={120} height={90} rx={8} fill="none" stroke={colors.yellow} strokeWidth={5} strokeDasharray="14 10" />
            <line x1={480} y1={560} x2={600} y2={650} stroke={colors.yellow} strokeWidth={4} opacity={0.6} />
          </g>
          {/* двери */}
          <line x1={400} y1={930} x2={680} y2={930} stroke={colors.door} strokeWidth={18} />
          <g opacity={doorsX.opacity}>
            <line x1={500} y1={890} x2={580} y2={970} stroke={colors.red} strokeWidth={12} strokeLinecap="round" />
            <line x1={580} y1={890} x2={500} y2={970} stroke={colors.red} strokeWidth={12} strokeLinecap="round" />
          </g>
        </g>
      </svg>
      <Label text={p.hatchLabel} x={540} y={440} delay={sec(p.hatchAt, fps)} tone="beige" />
      <Label text={p.doorsLabel} x={540} y={1010} delay={sec(p.doorsAt, fps)} tone="red" />
      <Label text={p.shaftLabel} x={540} y={1160} delay={sec(p.shaftAt, fps)} tone="dark" />
    </AbsoluteFill>
  );
};
