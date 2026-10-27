import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Label } from "../components/Overlays";
import { SheepTop } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { time?: string };

// План квартиры сверху: контур рисуется, солнце и время, точка «Я» в кровати, фикус, у фикуса появляется барашек.
export const FloorPlan: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const sunAt = B.sunAt(scene);
  const sheepAt = B.planSheepAt(scene);
  const draw = interpolate(t, [0.1, 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sun = pop(frame, fps, sec(sunAt, fps));
  const sheepK = interpolate(t, [sheepAt, sheepAt + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const perim = 2 * (480 + 700);
  const keys = [focusKey(0, 540, 830, 1.0), focusKey(sunAt, 540, 830, 1.0), focusKey(sheepAt + 0.6, 660, 640, 1.6), focusKey(dur, 660, 640, 1.7)];
  const crumbs = sheepK > 0 ? Array.from({ length: 6 }, (_, i) => ({ x: 650 + ((i * 37) % 70), y: 620 + ((i * 53) % 60), o: 0.5 + 0.5 * Math.sin(t * 5 + i) })) : [];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* контур квартиры */}
          <rect x={300} y={480} width={480} height={700} fill={colors.panel} opacity={draw} />
          <rect x={300} y={480} width={480} height={700} fill="none" stroke={colors.white} strokeWidth={6} strokeDasharray={perim} strokeDashoffset={perim * (1 - draw)} />
          <g opacity={interpolate(draw, [0.6, 1], [0, 1])}>
            {/* перегородки: комната слева сверху, коридор справа, кухня снизу */}
            <line x1={620} y1={480} x2={620} y2={900} stroke={colors.line} strokeWidth={5} />
            <line x1={300} y1={900} x2={780} y2={900} stroke={colors.line} strokeWidth={5} />
            <text x={460} y={520} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fill={colors.dim} letterSpacing={3}>КОМНАТА</text>
            <text x={700} y={520} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fill={colors.dim} letterSpacing={3}>КОРИДОР</text>
            <text x={540} y={940} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fill={colors.dim} letterSpacing={3}>КУХНЯ</text>
            {/* кровать и «Я» */}
            <rect x={330} y={700} width={150} height={170} rx={12} fill={colors.panelLight} />
            <rect x={340} y={710} width={130} height={40} rx={8} fill={colors.white} opacity={0.8} />
            <circle cx={405} cy={800} r={18} fill={colors.skin} />
            <text x={405} y={850} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fill={colors.yellow}>Я</text>
            {/* окно */}
            <rect x={340} y={474} width={180} height={12} fill="#cfe3ff" />
            {/* фикус */}
            <circle cx={570} cy={620} r={30} fill={colors.green} />
            <circle cx={560} cy={600} r={16} fill="#2f6b3a" />
            <text x={570} y={680} textAnchor="middle" fontFamily={fonts.mono} fontSize={22} fill={colors.dim}>ФИКУС</text>
          </g>
          {/* барашек у фикуса */}
          <SheepTop x={650} y={630} scale={0.9 * sheepK} frame={frame} fps={fps} opacity={sheepK} />
          {crumbs.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={3} fill={colors.green} opacity={c.o * sheepK} />
          ))}
        </svg>
        {/* солнце и время */}
        <div style={{ position: "absolute", left: 820, top: 420, display: "flex", flexDirection: "column", alignItems: "center", opacity: sun.opacity, transform: `translateY(${sun.y}px) scale(${sun.scale})` }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: colors.yellow, boxShadow: "0 0 40px 10px rgba(243,192,58,0.35)" }} />
          <div style={{ fontFamily: fonts.mono, fontSize: 34, color: colors.yellow, letterSpacing: 4, marginTop: 10 }}>{p.time ?? "06:40"}</div>
        </div>
      </Camera>
      <Label text="ХРУМ · ХРУМ" x={540} y={1225} delay={sec(sheepAt, fps) + 6} tone="red" />
    </AbsoluteFill>
  );
};
