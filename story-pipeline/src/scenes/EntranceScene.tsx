import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// Подъезд утром: герой выходит с чемоданами, у двери сосед в костюме, на «Куда?» показывает вверх.
export const EntranceScene: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const suitAt = B.suitAt(scene);
  const expandAt = B.expandAt(scene);
  const congratsAt = B.congratsAt(scene);
  const pointAt = B.pointUpAt(scene);
  const walkK = interpolate(t, [0.1, 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const heroX = -60 + 300 * walkK;
  const walking = walkK > 0 && walkK < 1;
  const tie = pop(frame, fps, sec(suitAt, fps));
  const neighborPose = t >= pointAt ? "point" : "stand";
  const keys = [focusKey(0, 500, 860, 1.05), focusKey(suitAt + 0.5, 700, 820, 1.35), focusKey(congratsAt, 540, 860, 1.1), focusKey(pointAt + 0.6, 700, 700, 1.2), focusKey(dur, 700, 680, 1.25)];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #4b6aa5 0%, #8fb0d8 60%, #a9c3e3 100%)` }}>
      <Camera keys={keys}>
        {/* фасад с окнами, козырёк и дверь подъезда */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1180, background: "#3a4668" }} />
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {Array.from({ length: 4 }, (_, r) =>
            [120, 300, 760, 920].map((wx) => <rect key={`${r}-${wx}`} x={wx} y={120 + r * 190} width={90} height={120} rx={6} fill="#1c2440" />),
          )}
          <rect x={440} y={560} width={240} height={620} fill="#0f1428" />
          <rect x={400} y={520} width={320} height={40} rx={8} fill="#2a3458" />
          <rect x={456} y={600} width={100} height={580} fill={colors.door} />
          <rect x={564} y={600} width={100} height={580} fill={colors.door} />
          <text x={560} y={590} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fill={colors.beige}>ПОДЪЕЗД 2</text>
        </svg>
        <div style={{ position: "absolute", left: 0, top: 1180, width: 1080, height: 140, background: "#4b4b55" }} />
        {/* сосед в костюме у двери */}
        <Character pose={neighborPose} outfit="suit" mustache frame={frame} fps={fps} x={620} y={600} scale={1.0} flip talkAt={[expandAt, pointAt]} />
        {/* подпись «КОСТЮМ» на «в костюме» */}
        <div style={{ position: "absolute", left: 600, top: 540, padding: "6px 16px", borderRadius: 10, background: colors.yellow, color: colors.beigeInk, fontFamily: fonts.text, fontWeight: 800, fontSize: 26, letterSpacing: 3, opacity: tie.opacity, transform: `translateY(${tie.y}px) scale(${tie.scale})` }}>
          КОСТЮМ
        </div>
        {/* герой с чемоданами */}
        <Character pose={walking ? "walk" : "stand"} frame={frame} fps={fps} x={heroX} y={600} scale={1.0} talkAt={[congratsAt, pointAt]} />
        <div style={{ position: "absolute", left: heroX + 40, top: 1040, width: 110, height: 140, background: "#8a5a2a", borderRadius: 12, border: "4px solid #5a3a1a" }} />
        <div style={{ position: "absolute", left: heroX + 70, top: 1020, width: 50, height: 24, borderRadius: 8, border: "4px solid #5a3a1a" }} />
        <div style={{ position: "absolute", left: heroX - 50, top: 1060, width: 90, height: 120, background: "#3b4a7a", borderRadius: 12, border: "4px solid #2a3458" }} />
      </Camera>
    </AbsoluteFill>
  );
};
