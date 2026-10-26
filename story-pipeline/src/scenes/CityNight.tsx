import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, sec } from "../anim";
import { Label } from "../components/Overlays";
import { colors } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { litFloor: number; label: string; litAt?: number };

// Ночной город: силуэты домов, звёзды, одно загоревшееся окно.
const buildings = [
  { x: 40, w: 150, h: 420 },
  { x: 210, w: 120, h: 560 },
  { x: 760, w: 140, h: 500 },
  { x: 920, w: 130, h: 380 },
];

const stars = Array.from({ length: 60 }, (_, i) => ({ x: (i * 173) % 1080, y: 330 + ((i * 97) % 520), r: 1.5 + (i % 3) }));

export const CityNight: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const litAt = sec(p.litAt ?? 1.0, fps);
  const lit = fade(frame, litAt, 10);
  const floors = 24;
  const top = 380;
  const bottom = 1260;
  const fh = (bottom - top) / floors;
  const litY = bottom - p.litFloor * fh;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #05070f 0%, ${colors.bg} 60%, #0d1328 100%)` }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={colors.white} opacity={0.4 + 0.4 * Math.abs(Math.sin(frame / 17 + i))} />
        ))}
        {buildings.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={bottom - b.h} width={b.w} height={b.h} fill="#0f1530" />
            {Array.from({ length: Math.floor(b.h / 48) }, (_, r) =>
              Array.from({ length: Math.floor(b.w / 48) }, (_, c) => (
                <rect key={`${r}-${c}`} x={b.x + 14 + c * 48} y={bottom - b.h + 16 + r * 48} width={22} height={26} fill={(r * 7 + c * 3 + i) % 9 === 0 ? "#2b2f48" : "#141a33"} />
              )),
            )}
          </g>
        ))}
        {/* главный дом */}
        <rect x={380} y={top} width={320} height={bottom - top} fill={colors.panel} />
        {Array.from({ length: floors }, (_, i) => (
          <g key={i}>
            {[410, 490, 570, 650].map((wx) => (
              <rect key={wx} x={wx} y={top + i * fh + fh * 0.28} width={40} height={fh * 0.46} fill="#0f1428" />
            ))}
          </g>
        ))}
        {/* окно загорается */}
        <rect x={490} y={litY + fh * 0.28} width={40} height={fh * 0.46} fill={colors.yellow} opacity={lit} />
        <rect x={470} y={litY + fh * 0.1} width={80} height={fh * 0.8} rx={8} fill={colors.yellow} opacity={0.25 * lit} />
        <circle cx={510} cy={litY + fh * 0.5} r={70} fill={colors.yellow} opacity={0.12 * lit} />
        <rect x={0} y={bottom} width={1080} height={80} fill="#05070d" />
      </svg>
      <Label text={p.label} x={540} y={1225} delay={litAt + 10} tone="dark" />
    </AbsoluteFill>
  );
};
