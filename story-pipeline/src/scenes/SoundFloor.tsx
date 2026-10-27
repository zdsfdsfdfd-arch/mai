import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Label } from "../components/Overlays";
import { Heart, Sheep } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { floors: number[]; label: string };

// Разрез двух квартир: внизу сосед с овцой и сердечком, вверху герой в кровати. Топот копыт
// идёт волнами сквозь перекрытие, блеяние, затем реплика соседа пузырём.
export const SoundFloor: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const top = 380;
  const bottom = 1240;
  const fh = (bottom - top) / p.floors.length;
  const floorTop = (f: number) => bottom - (p.floors.indexOf(f) + 1) * fh;
  const y8 = floorTop(8);
  const y9 = floorTop(9);
  const trotAt = B.trotAt(scene);
  const bleatAt = B.bleat2At(scene);
  const quoteAt = B.quoteAt(scene);
  const trotOn = t >= trotAt;
  const shake = t >= trotAt && t < trotAt + 1.0 ? wiggle(frame, 3, 2) : { x: 0, y: 0 };
  const be = pop(frame, fps, sec(bleatAt, fps));
  const bubble = pop(frame, fps, sec(quoteAt, fps));
  const heroShake = trotOn ? Math.sin(t * 20) * 2 : 0;
  const keys = [focusKey(0, 540, y8 + fh / 2, 1.5), focusKey(trotAt, 540, y8 + fh / 2, 1.5), focusKey(trotAt + 0.8, 540, y9 + fh * 0.6, 1.5), focusKey(quoteAt, 540, (y8 + y9 + fh) / 2, 1.15), focusKey(dur, 540, (y8 + y9 + fh) / 2, 1.2)];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${shake.x}px, ${shake.y}px)` }}>
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            {p.floors.map((f) => {
              const y = floorTop(f);
              const hero = f === 9;
              const nb = f === 8;
              return (
                <g key={f}>
                  <rect x={240} y={y} width={600} height={fh} fill={hero ? "#1c2744" : nb ? "#2a1c33" : colors.panel} stroke={colors.line} strokeWidth={3} />
                  <text x={200} y={y + fh * 0.6} textAnchor="end" fontFamily={fonts.mono} fontSize={40} fill={hero ? colors.yellow : nb ? "#ff5d8f" : colors.dim}>
                    {f}
                  </text>
                  {/* перекрытие */}
                  <rect x={240} y={y - 8} width={600} height={16} fill={colors.line} />
                </g>
              );
            })}
            {/* герой в кровати на 9-м */}
            <rect x={300} y={y9 + fh * 0.55} width={260} height={fh * 0.3} rx={10} fill="#3b4a7a" transform={`translate(0 ${heroShake})`} />
            <circle cx={330} cy={y9 + fh * 0.52} r={22} fill={colors.skin} transform={`translate(0 ${heroShake})`} />
            <rect x={300} y={y9 + fh * 0.35} width={60} height={fh * 0.2} rx={8} fill={colors.white} opacity={0.8} transform={`translate(0 ${heroShake})`} />
            {/* волны сквозь перекрытие */}
            {trotOn &&
              [0, 1, 2].map((k) => {
                const ph = ((t - trotAt) * 0.9 + k / 3) % 1;
                const r = 30 + 260 * ph;
                return <path key={k} d={`M ${560 - r} ${y9 + fh} A ${r} ${r} 0 0 1 ${560 + r} ${y9 + fh}`} fill="none" stroke={colors.yellow} strokeWidth={8} strokeDasharray="22 16" opacity={(1 - ph) * 0.9} />;
              })}
          </svg>
          {/* сосед и овца на 8-м */}
          <Sheep frame={frame} fps={fps} x={420} y={y8 + fh * 0.25} scale={0.62} bow state={trotOn ? "walk" : "idle"} />
          <Heart x={640} y={y8 + fh * 0.15 + Math.sin(t * 3) * 6} size={48} opacity={0.9} />
          {/* БЕ-Е-Е */}
          <div style={{ position: "absolute", left: 600, top: y8 + fh * 0.1, fontFamily: fonts.display, fontWeight: 900, fontSize: 80, color: "#ff5d8f", opacity: be.opacity, transform: `translateY(${be.y}px) scale(${be.scale})`, WebkitTextStroke: "3px #07090f", paintOrder: "stroke fill" }}>
            БЕ‑Е‑Е
          </div>
          {/* пузырь с репликой соседа */}
          <div style={{ position: "absolute", left: 270, top: y8 + fh * 0.62, padding: "14px 24px", background: colors.white, color: colors.beigeInk, borderRadius: "22px 22px 22px 6px", fontFamily: fonts.text, fontWeight: 800, fontSize: 34, opacity: bubble.opacity, transform: `translateY(${bubble.y}px) scale(${bubble.scale})`, transformOrigin: "left bottom" }}>
            Зиночка, ну не упрямься
          </div>
        </div>
      </Camera>
      <Label text={p.label} x={540} y={1225} delay={sec(trotAt, fps) + 8} tone="dark" size={30} />
    </AbsoluteFill>
  );
};
