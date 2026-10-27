import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Label } from "../components/Overlays";
import { Sheep } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { floors: number; sheepCount: number; label: string };

// Дом целиком: камера от подъезда едет вверх по всем этажам до крыши, там стадо с бантиками,
// подпись и красный штамп «ГАРЕМ».
export const Roof: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const revealAt = B.roofRevealAt(scene);
  const bowsAt = B.roofBowsAt(scene);
  const labelAt = B.roofLabelAt(scene);
  const haremAt = B.haremAt(scene);
  const top = 260;
  const bottom = 1760;
  const fh = (bottom - top) / p.floors;
  const stamp = pop(frame, fps, sec(haremAt, fps));
  const keys = [focusKey(0, 540, bottom - 120, 1.3), focusKey(scene.phrases[0]?.start ?? 0.4, 540, bottom - 160, 1.3), focusKey(revealAt + 1.2, 540, top - 40, 1.25), focusKey(labelAt, 540, top - 60, 1.35), focusKey(dur, 540, top - 60, 1.4)];
  const sheepRows = 4;
  const perRow = Math.ceil(p.sheepCount / sheepRows);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #3f5f9c 0%, #8fb0d8 55%, #a9c3e3 100%)` }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* облака */}
          {[0, 1, 2].map((i) => (
            <g key={i} opacity={0.5} transform={`translate(${((t * 12 + i * 400) % 1300) - 200} ${80 + i * 60})`}>
              <ellipse cx={0} cy={0} rx={90} ry={28} fill={colors.white} />
              <ellipse cx={50} cy={-12} rx={60} ry={30} fill={colors.white} />
            </g>
          ))}
          {/* дом */}
          <rect x={240} y={top} width={600} height={bottom - top} fill="#3a4668" />
          {Array.from({ length: p.floors }, (_, i) => (
            <g key={i}>
              {[280, 380, 480, 640, 740].map((wx) => (
                <rect key={wx} x={wx} y={top + i * fh + fh * 0.25} width={60} height={fh * 0.45} rx={4} fill={i === p.floors - 1 ? "#1c2440" : "#1c2440"} />
              ))}
              <text x={225} y={top + i * fh + fh * 0.7} textAnchor="end" fontFamily={fonts.mono} fontSize={26} fill={colors.white} opacity={0.6}>
                {p.floors - i}
              </text>
            </g>
          ))}
          {/* крыша и парапет */}
          <rect x={230} y={top - 30} width={620} height={30} fill="#2a3458" />
          {/* подъезд */}
          <rect x={470} y={bottom - 150} width={140} height={150} fill="#0f1428" />
          <rect x={440} y={bottom - 170} width={200} height={24} fill="#2a3458" />
          <rect x={0} y={bottom} width={1080} height={160} fill="#4b4b55" />
        </svg>
        {/* герой и сосед у подъезда, сосед показывает наверх */}
        <Character pose="stand" frame={frame} fps={fps} x={300} y={bottom - 420} scale={0.7} />
        <Character pose="point" outfit="suit" mustache frame={frame} fps={fps} x={600} y={bottom - 420} scale={0.7} flip />
        {/* стадо на крыше */}
        {Array.from({ length: p.sheepCount }, (_, i) => {
          const row = i % sheepRows;
          const col = Math.floor(i / sheepRows);
          const x = 250 + col * (580 / perRow) + (row % 2) * 20;
          const y = top - 150 - row * 34;
          const bowK = interpolate(t, [bowsAt + i * 0.03, bowsAt + 0.3 + i * 0.03], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return <Sheep key={i} frame={frame + i * 7} fps={fps} x={x} y={y} scale={0.34 - row * 0.03} color={i % 7 === 3 ? "black" : "white"} bow bowOpacity={bowK} state="idle" flip={i % 3 === 0} />;
        })}
        {/* штамп ГАРЕМ */}
        <div style={{ position: "absolute", left: 330, top: top - 330, padding: "10px 30px", border: `8px solid ${colors.red}`, color: colors.red, fontFamily: fonts.display, fontWeight: 900, fontSize: 120, letterSpacing: 6, transform: `rotate(-10deg) scale(${stamp.scale})`, opacity: stamp.opacity, borderRadius: 14, background: "rgba(11,16,32,0.35)" }}>
          ГАРЕМ
        </div>
      </Camera>
      <Label text={p.label} x={540} y={1225} delay={sec(labelAt, fps)} tone="beige" />
    </AbsoluteFill>
  );
};
