import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Card = { label: string; value: string; at: number; tone?: "red" | "green" | "yellow" };
type Props = { heading: string; cards: Card[] };

// Схема кабины с размерами и карточки с цифрами, появляющиеся в темпе озвучки.
export const StatCallouts: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const box = pop(frame, fps, 4);

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: box.opacity, transform: `scale(${box.scale})`, transformOrigin: "540px 700px" }}>
        {/* кабина сверху: 2 × 1,5 м, масштаб 200 px/м */}
        <rect x={340} y={550} width={400} height={300} rx={8} fill={colors.panel} stroke={colors.white} strokeWidth={6} />
        {/* человек в кабине */}
        <circle cx={540} cy={690} r={26} fill={colors.skin} />
        <rect x={508} y={720} width={64} height={70} rx={20} fill={colors.jacket} />
        {/* размерные линии */}
        <line x1={340} y1={500} x2={740} y2={500} stroke={colors.yellow} strokeWidth={4} />
        <line x1={340} y1={486} x2={340} y2={514} stroke={colors.yellow} strokeWidth={4} />
        <line x1={740} y1={486} x2={740} y2={514} stroke={colors.yellow} strokeWidth={4} />
        <text x={540} y={470} textAnchor="middle" fontFamily={fonts.mono} fontSize={36} fill={colors.yellow}>2 М</text>
        <line x1={790} y1={550} x2={790} y2={850} stroke={colors.yellow} strokeWidth={4} />
        <line x1={776} y1={550} x2={804} y2={550} stroke={colors.yellow} strokeWidth={4} />
        <line x1={776} y1={850} x2={804} y2={850} stroke={colors.yellow} strokeWidth={4} />
        <text x={830} y={712} fontFamily={fonts.mono} fontSize={36} fill={colors.yellow}>1,5 М</text>
        {/* двери */}
        <line x1={440} y1={850} x2={640} y2={850} stroke={colors.door} strokeWidth={14} />
      </svg>

      {p.cards.map((c, i) => {
        const a = pop(frame, fps, sec(c.at, fps));
        const color = c.tone === "red" ? colors.red : c.tone === "green" ? colors.green : c.tone === "yellow" ? colors.yellow : colors.white;
        const x = 70 + i * 320;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: 940,
              width: 300,
              height: 190,
              borderRadius: 22,
              background: colors.panel,
              border: `4px solid ${color}`,
              opacity: a.opacity,
              transform: `scale(${a.scale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <div style={{ fontFamily: fonts.text, fontWeight: 600, fontSize: 28, letterSpacing: 3, color: colors.dim }}>{c.label}</div>
            <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 78, lineHeight: 1, color }}>{c.value}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
