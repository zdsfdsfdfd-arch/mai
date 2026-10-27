import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fade, pop, sec, wiggle } from "../anim";
import { blackoutAt, hudAt } from "../beats";
import { Camera, type CamKey } from "../components/Camera";
import { Hud } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = {
  floors: number;
  cabinBetween: [number, number];
  highlight?: number[];
  litWindows?: number[];
  litAt?: number;
  hud?: { label: string; value: string; tone?: "red" | "green" | "yellow" };
};

// Дом в разрезе. Режим «вступление»: ночь, часть окон горит, камера идёт к крыше (луна и время),
// затем весь район гаснет окно за окном, камера наезжает на застрявшую кабину.
// Режим «окно»: камера от кабины поднимается к загоревшемуся окну.
export const BuildingCutaway: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const left = 200;
  const right = 820;
  const top = 340;
  const bottom = 1260;
  const fh = (bottom - top) / p.floors;
  const dur = scene.durationFrames / fps;
  const windowMode = !!p.litWindows?.length;

  const floorTop = (n: number) => bottom - n * fh;
  const cabinY = floorTop(p.cabinBetween[0]) - fh / 2;
  const litFloor = p.litWindows?.[0] ?? p.cabinBetween[1];
  const litY = floorTop(litFloor) + fh / 2;
  const litAt = p.litAt ?? 1.4;
  const litOpacity = windowMode ? fade(frame, sec(litAt, fps), 10) : 0;

  const bo = blackoutAt(scene);
  const p1 = scene.phrases[1]?.start ?? 2.6;

  // камера: координаты так, чтобы точка (px, py) оказалась в центре (540, 800) при масштабе s
  const focus = (px: number, py: number, s: number): CamKey => ({ t: 0, x: (px - 540) * s, y: (py - 800) * s, scale: s });
  const keys: CamKey[] = windowMode
    ? [
        { ...focus(540, cabinY, 1.45), t: 0 },
        { ...focus(540, cabinY, 1.45), t: litAt - 0.3 },
        { ...focus(380, litY, 1.9), t: litAt + 0.9 },
        { ...focus(380, litY, 2.0), t: dur },
      ]
    : [
        { t: 0, scale: 1.0 },
        { ...focus(540, top + 60, 1.15), t: p1 + 0.4 },
        { ...focus(540, top + 60, 1.15), t: bo - 0.2 },
        { t: bo + 0.6, scale: 1.0 },
        { ...focus(540, cabinY, 1.5), t: bo + 2.2 },
        { ...focus(540, cabinY, 1.55), t: dur },
      ];

  // окна: детерминированная «случайность» по номеру этажа и окна
  const rnd = (n: number, w: number) => ((n * 7919 + w * 104729) % 1000) / 1000;
  const windowColor = (n: number, w: number) => {
    if (windowMode) return p.litWindows!.includes(n) ? colors.yellow : "#0f1428";
    const litBefore = rnd(n, w) < 0.35;
    if (!litBefore) return "#0f1428";
    const offAt = bo + 0.1 + rnd(w, n) * 1.4;
    return t >= offAt ? "#0f1428" : "#6b5a2d";
  };
  const jolt = t < 0.5 && !windowMode ? wiggle(frame, 3 * (1 - t / 0.5), 5) : { x: 0, y: 0 };
  const moon = pop(frame, fps, sec(p1 + 0.5, fps));
  const hudFrame = sec(hudAt(scene), fps) + 8;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute", transform: `translate(${jolt.x}px, ${jolt.y}px)` }}>
          {/* звёзды */}
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 211) % 1080} cy={120 + ((i * 97) % 200)} r={1.5 + (i % 2)} fill={colors.white} opacity={0.3 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))} />
          ))}
          {/* луна и время */}
          {!windowMode && (
            <g opacity={moon.opacity} transform={`translate(0 ${moon.y})`}>
              <circle cx={850} cy={200} r={46} fill={colors.beige} />
              <circle cx={868} cy={188} r={40} fill={colors.bg} />
              <text x={850} y={300} textAnchor="middle" fontFamily={fonts.mono} fontSize={40} fill={colors.yellow} letterSpacing={4}>
                01:30
              </text>
            </g>
          )}
          <rect x={0} y={bottom} width={1080} height={60} fill="#070a14" />
          <rect x={left} y={top} width={right - left} height={bottom - top} fill={colors.panel} />
          <rect x={500} y={top} width={80} height={bottom - top} fill="#0a0d1a" />
          {Array.from({ length: p.floors }, (_, i) => i + 1).map((n) => {
            const y = floorTop(n);
            const hl = p.highlight?.includes(n);
            const lit = windowMode && p.litWindows?.includes(n);
            return (
              <g key={n}>
                {hl && <rect x={left} y={y} width={right - left} height={fh} fill={colors.red} opacity={0.22} />}
                <line x1={left} y1={y} x2={right} y2={y} stroke={colors.line} strokeWidth={2} />
                <text x={left - 16} y={y + fh * 0.72} textAnchor="end" fontFamily={fonts.mono} fontSize={fh > 40 ? 26 : 22} fill={hl ? colors.red : colors.dim}>
                  {n}
                </text>
                {[250, 330, 410, 620, 700].map((wx, wi) => (
                  <rect key={wx} x={wx} y={y + fh * 0.25} width={52} height={fh * 0.5} rx={3} fill={windowColor(n, wi)} opacity={lit ? litOpacity : 1} />
                ))}
                {lit && <rect x={240} y={y + fh * 0.1} width={230} height={fh * 0.8} rx={10} fill={colors.yellow} opacity={0.18 * litOpacity} />}
              </g>
            );
          })}
          {/* кабина между этажами, слегка дрожит */}
          <g transform={`translate(${Math.sin(t * 9) * 0.8} ${Math.cos(t * 7) * 0.8})`}>
            <rect x={506} y={cabinY - fh * 0.45} width={68} height={fh * 0.9} rx={4} fill={colors.panelLight} stroke={colors.yellow} strokeWidth={4} />
            <circle cx={540} cy={cabinY} r={fh * 0.16} fill={colors.skin} />
          </g>
          {/* трос чуть качается */}
          <line x1={540 + Math.sin(t * 1.1) * 3} y1={top} x2={540} y2={cabinY - fh * 0.45} stroke={colors.dim} strokeWidth={3} strokeDasharray="8 8" strokeDashoffset={-frame * 0.6} />
        </svg>
      </Camera>
      {p.hud && frame >= hudFrame && <Hud label={p.hud.label} value={p.hud.value} tone={p.hud.tone} delay={hudFrame} />}
    </AbsoluteFill>
  );
};
