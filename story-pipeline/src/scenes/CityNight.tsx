import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop, sec } from "../anim";
import { cityLitAt, cityListenAt, cityPhoneAt } from "../beats";
import { Camera, type CamKey } from "../components/Camera";
import { Silhouette } from "../components/Character";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { litFloor: number; label: string };

// Ночной город: панорама по горизонту, окно загорается, силуэт жильца выходит на балкон,
// «слушает» (дуги у головы), над ним появляется телефон с «0 %».
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
  const t = frame / fps;
  const p = scene.props as Props;
  const dur = scene.durationFrames / fps;
  const litAt = cityLitAt(scene);
  const listenAt = cityListenAt(scene);
  const phoneAt = cityPhoneAt(scene);
  const lit = fade(frame, sec(litAt, fps), 10);
  const floors = 24;
  const top = 380;
  const bottom = 1260;
  const fh = (bottom - top) / floors;
  const litY = bottom - p.litFloor * fh;
  // силуэт выходит на балкон слева от окна за 1,4 с после включения света
  const walkK = interpolate(t, [litAt + 0.3, litAt + 1.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const silX = 300 + 60 * walkK;
  const walking = walkK > 0 && walkK < 1;
  const phoneLabel = pop(frame, fps, sec(phoneAt, fps));
  const focus = (px: number, py: number, s: number): CamKey => ({ t: 0, x: (px - 540) * s, y: (py - 800) * s, scale: s });
  const keys: CamKey[] = [
    { ...focus(640, 820, 1.05), t: 0 },
    { ...focus(480, 800, 1.1), t: litAt + 1.0 },
    { ...focus(400, litY + 10, 1.8), t: listenAt + 0.6 },
    { ...focus(400, litY, 1.9), t: dur },
  ];
  const flicker = 0.85 + 0.15 * (Math.sin(t * 23) > 0.7 ? 0.4 : 1);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #05070f 0%, ${colors.bg} 60%, #0d1328 100%)` }}>
      <Camera keys={keys}>
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
          <rect x={380} y={top} width={320} height={bottom - top} fill={colors.panel} />
          {Array.from({ length: floors }, (_, i) => (
            <g key={i}>
              {[410, 490, 570, 650].map((wx) => (
                <rect key={wx} x={wx} y={top + i * fh + fh * 0.28} width={40} height={fh * 0.46} fill="#0f1428" />
              ))}
            </g>
          ))}
          {/* балкон у окна */}
          <rect x={300} y={litY + fh * 0.75} width={80} height={6} fill={colors.line} />
          <line x1={300} y1={litY + fh * 0.75} x2={300} y2={litY + fh * 0.4} stroke={colors.line} strokeWidth={3} />
          {/* окно загорается */}
          <rect x={490} y={litY + fh * 0.28} width={40} height={fh * 0.46} fill={colors.yellow} opacity={lit * flicker} />
          <rect x={410} y={litY + fh * 0.28} width={40} height={fh * 0.46} fill={colors.yellow} opacity={lit * 0.8 * flicker} />
          <rect x={395} y={litY + fh * 0.1} width={150} height={fh * 0.8} rx={8} fill={colors.yellow} opacity={0.22 * lit} />
          <circle cx={470} cy={litY + fh * 0.5} r={80} fill={colors.yellow} opacity={0.1 * lit} />
          {/* дуги «слушает» */}
          {t >= listenAt &&
            [0, 1, 2].map((k) => {
              const ph = ((t - listenAt) * 0.8 + k / 3) % 1;
              const r = 14 + 34 * ph;
              return <path key={k} d={`M ${silX + 46 - r * 0.3} ${litY - 10 - r} A ${r} ${r} 0 0 0 ${silX + 46 - r * 0.3} ${litY - 10 + r}`} fill="none" stroke={colors.yellow} strokeWidth={3} opacity={(1 - ph) * 0.8} />;
            })}
          <rect x={0} y={bottom} width={1080} height={80} fill="#05070d" />
        </svg>
        {walkK > 0 && <Silhouette frame={frame} fps={fps} x={silX} y={litY - 36} scale={0.26} walking={walking} />}
        {/* телефон жильца: 0 % */}
        <div style={{ position: "absolute", left: silX - 10, top: litY - 100, padding: "6px 14px", borderRadius: 10, background: colors.red, color: colors.white, fontFamily: fonts.mono, fontSize: 26, fontWeight: 700, opacity: phoneLabel.opacity, transform: `translateY(${phoneLabel.y}px) scale(${phoneLabel.scale})` }}>
          0 %
        </div>
      </Camera>
      <Label text={p.label} x={540} y={1225} delay={sec(litAt, fps) + 10} tone="dark" />
    </AbsoluteFill>
  );
};
