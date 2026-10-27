import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Hud } from "../components/Overlays";
import { Heart, Sheep } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { floors: number; hud?: { label: string; value: string; tone?: "red" | "green" | "yellow" } };

// Дом ночью: 9-й этаж героя горит белым, камера спускается на 8-й, там окна розовеют и пульсируют,
// из них поднимаются сердечки, в окне пробегает силуэт овцы.
export const BuildingNeighbor: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const left = 200;
  const right = 820;
  const top = 340;
  const bottom = 1260;
  const fh = (bottom - top) / p.floors;
  const floorTop = (n: number) => bottom - n * fh;
  const y9 = floorTop(9) + fh / 2;
  const y8 = floorTop(8) + fh / 2;
  const downAt = B.floorDownAt(scene);
  const lifeAt = B.lifeAt(scene);
  const bleatAt = B.bleatAt(scene);
  const pink = interpolate(t, [lifeAt, lifeAt + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (0.6 + 0.4 * Math.abs(Math.sin(t * 3)));
  const sheepK = interpolate(t, [bleatAt, bleatAt + 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hud = pop(frame, fps, sec(lifeAt, fps) + 6);
  const keys = [focusKey(0, 540, y9, 1.5), focusKey(downAt, 540, y9, 1.5), focusKey(downAt + 0.8, 540, y8, 1.5), focusKey(lifeAt + 0.6, 540, y8, 1.9), focusKey(dur, 540, y8, 2.0)];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 211) % 1080} cy={100 + ((i * 97) % 220)} r={1.5 + (i % 2)} fill={colors.white} opacity={0.3 + 0.5 * Math.abs(Math.sin(t * 1.3 + i))} />
          ))}
          <rect x={0} y={bottom} width={1080} height={60} fill="#070a14" />
          <rect x={left} y={top} width={right - left} height={bottom - top} fill={colors.panel} />
          {Array.from({ length: p.floors }, (_, i) => i + 1).map((n) => {
            const y = floorTop(n);
            const hero = n === 9;
            const nb = n === 8;
            return (
              <g key={n}>
                {hero && <rect x={left} y={y} width={right - left} height={fh} fill={colors.white} opacity={0.08} />}
                {nb && <rect x={left} y={y} width={right - left} height={fh} fill="#ff5d8f" opacity={0.25 * pink} />}
                <line x1={left} y1={y} x2={right} y2={y} stroke={colors.line} strokeWidth={2} />
                <text x={left - 16} y={y + fh * 0.72} textAnchor="end" fontFamily={fonts.mono} fontSize={26} fill={hero ? colors.yellow : nb ? "#ff5d8f" : colors.dim}>
                  {n}
                </text>
                {[250, 330, 410, 530, 610, 700].map((wx) => (
                  <rect key={wx} x={wx} y={y + fh * 0.22} width={56} height={fh * 0.56} rx={4} fill={hero ? "#e9e2c9" : nb ? `rgba(255,93,143,${0.25 + 0.75 * pink})` : "#0f1428"} />
                ))}
                {hero && <text x={760} y={y + fh * 0.65} fontFamily={fonts.mono} fontSize={22} fill={colors.yellow}>Я</text>}
                {nb && <text x={760} y={y + fh * 0.65} fontFamily={fonts.mono} fontSize={22} fill="#ff5d8f" opacity={pink}>ОН</text>}
              </g>
            );
          })}
        </svg>
        {/* сердечки из окон 8-го */}
        {t >= lifeAt &&
          [0, 1, 2, 3].map((i) => {
            const k = ((t - lifeAt) * 0.45 + i * 0.25) % 1;
            return <Heart key={i} x={280 + i * 130 + Math.sin(k * 8 + i) * 12} y={y8 - 10 - k * 160} size={26 + 10 * (1 - k)} opacity={(1 - k) * 0.9 * pink} />;
          })}
        {/* силуэт овцы пробегает по окнам 8-го */}
        {sheepK > 0 && sheepK < 1 && <Sheep frame={frame} fps={fps} x={230 + 480 * sheepK} y={y8 - 24} scale={0.22} color="black" state="run" opacity={0.9} />}
      </Camera>
      {p.hud && t >= lifeAt && <Hud label={p.hud.label} value={p.hud.value} tone={p.hud.tone} delay={sec(lifeAt, fps) + 6} />}
      <div style={{ position: "absolute", top: 330, left: 60, fontFamily: fonts.mono, fontSize: 30, color: "#ff5d8f", letterSpacing: 4, opacity: hud.opacity }}>03:00</div>
    </AbsoluteFill>
  );
};
