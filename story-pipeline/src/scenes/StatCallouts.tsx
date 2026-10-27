import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import { airAt, calloutTimes, dimsAt } from "../beats";
import { Camera, type CamKey } from "../components/Camera";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Card = { label: string; value: string; at: number; tone?: "red" | "green" | "yellow" };
type Props = { heading: string; cards: Card[] };

// Схема кабины: контур рисуется сам, на слове «воздух» внутри появляются частицы, на размерах
// вытягиваются размерные линии, карточки выскакивают в темпе озвучки, «паника» ускоряет частицы и трясёт карточку.
export const StatCallouts: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const dur = scene.durationFrames / fps;
  const air = airAt(scene);
  const dims = dimsAt(scene);
  const cardTimes = calloutTimes(scene);
  const panicAt = cardTimes[2] ?? dur;
  const draw = interpolate(t, [0.1, 1.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dimK = interpolate(t, [dims, dims + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const speed = t >= panicAt ? 3 : 1;
  const focus = (px: number, py: number, s: number): CamKey => ({ t: 0, x: (px - 540) * s, y: (py - 800) * s, scale: s });
  const keys: CamKey[] = [
    { ...focus(540, 700, 1.35), t: 0 },
    { ...focus(540, 700, 1.35), t: dims - 0.2 },
    { ...focus(540, 760, 1.15), t: dims + 0.5 },
    { ...focus(540, 820, 1.0), t: (cardTimes[0] ?? dims + 1.5) - 0.1 },
    { ...focus(540, 820, 1.0), t: dur },
  ];
  const perim = 2 * (400 + 300);
  const shakeCard = t >= panicAt && t < panicAt + 0.5 ? wiggle(frame, 4, 9) : { x: 0, y: 0 };

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <rect x={340} y={550} width={400} height={300} rx={8} fill={colors.panel} opacity={draw} />
          <rect x={340} y={550} width={400} height={300} rx={8} fill="none" stroke={colors.white} strokeWidth={6} strokeDasharray={perim} strokeDashoffset={perim * (1 - draw)} />
          {/* человек в кабине */}
          <g opacity={interpolate(t, [0.9, 1.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
            <circle cx={540} cy={690 + Math.sin(t * 2) * 2} r={26} fill={colors.skin} />
            <rect x={508} y={720 + Math.sin(t * 2) * 2} width={64} height={70} rx={20} fill={colors.jacket} />
          </g>
          {/* частицы воздуха */}
          {t >= air &&
            Array.from({ length: 26 }, (_, i) => {
              const ph = (t - air) * speed * (0.5 + (i % 5) * 0.12) + i * 0.37;
              const cx = 360 + ((i * 53) % 360) + Math.sin(ph * 1.7 + i) * 16;
              const cy = 570 + ((i * 97) % 260) + Math.cos(ph * 1.3 + i) * 14;
              const o = Math.min(1, (t - air) * 2) * (0.35 + 0.35 * Math.abs(Math.sin(ph)));
              return <circle key={i} cx={cx} cy={cy} r={3 + (i % 3)} fill={t >= panicAt ? colors.red : colors.lightCone} opacity={o} />;
            })}
          {/* размерные линии вытягиваются */}
          <g opacity={dimK > 0 ? 1 : 0}>
            <line x1={340} y1={500} x2={340 + 400 * dimK} y2={500} stroke={colors.yellow} strokeWidth={4} />
            <line x1={340} y1={486} x2={340} y2={514} stroke={colors.yellow} strokeWidth={4} />
            <line x1={340 + 400 * dimK} y1={486} x2={340 + 400 * dimK} y2={514} stroke={colors.yellow} strokeWidth={4} />
            <text x={540} y={470} textAnchor="middle" fontFamily={fonts.mono} fontSize={36} fill={colors.yellow} opacity={dimK}>2 М</text>
            <line x1={790} y1={550} x2={790} y2={550 + 300 * dimK} stroke={colors.yellow} strokeWidth={4} />
            <line x1={776} y1={550} x2={804} y2={550} stroke={colors.yellow} strokeWidth={4} />
            <line x1={776} y1={550 + 300 * dimK} x2={804} y2={550 + 300 * dimK} stroke={colors.yellow} strokeWidth={4} />
            <text x={830} y={712} fontFamily={fonts.mono} fontSize={36} fill={colors.yellow} opacity={dimK}>1,5 М</text>
          </g>
          <line x1={440} y1={850} x2={640} y2={850} stroke={colors.door} strokeWidth={14} opacity={draw} />
        </svg>

        {p.cards.map((c, i) => {
          const a = pop(frame, fps, sec(cardTimes[i] ?? c.at, fps));
          const color = c.tone === "red" ? colors.red : c.tone === "green" ? colors.green : c.tone === "yellow" ? colors.yellow : colors.white;
          const x = 70 + i * 320;
          const sh = i === 2 ? shakeCard : { x: 0, y: 0 };
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
                transform: `translate(${sh.x}px, ${a.y + sh.y}px) scale(${a.scale})`,
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
      </Camera>
    </AbsoluteFill>
  );
};
