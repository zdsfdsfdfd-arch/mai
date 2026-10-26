import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { sec, wiggle } from "../anim";
import { Character } from "../components/Character";
import { colors } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { setting: "cabin"; light: "phone" | "dim"; lightOffAt?: number; knockAt?: number[] };

// Персонаж в кабине: свет от телефона (гаснет по сценарию), аварийная лампа, удары по стене.
export const CharacterScene: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const pose = scene.character?.pose ?? "stand";
  const knockAt = p.knockAt ?? [];

  const phoneLight =
    p.light === "phone"
      ? p.lightOffAt !== undefined
        ? interpolate(frame, [sec(p.lightOffAt, fps), sec(p.lightOffAt, fps) + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : 1
      : 0;

  // тряска кадра на ударах
  let shake = 0;
  for (const k of knockAt) {
    const d = frame - sec(k, fps);
    if (d >= 0 && d <= 5) shake = Math.max(shake, interpolate(d, [0, 5], [1, 0]));
  }
  const w = wiggle(frame, 4 * shake, 3);

  const sitting = pose === "sit";

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${w.x}px, ${w.y}px)` }}>
        {/* стены и пол кабины */}
        <div style={{ position: "absolute", left: 120, top: 330, width: 840, height: 930, background: colors.panel }} />
        <div style={{ position: "absolute", left: 760, top: 330, width: 200, height: 930, background: colors.panelLight, opacity: 0.5 }} />
        <div style={{ position: "absolute", left: 120, top: 1180, width: 840, height: 80, background: "#0a0e1a" }} />
        {/* аварийная лампа */}
        <div style={{ position: "absolute", left: 500, top: 350, width: 80, height: 18, borderRadius: 9, background: colors.red, boxShadow: `0 0 40px 10px rgba(229,57,47,0.35)` }} />
        {/* свет телефона */}
        <div
          style={{
            position: "absolute",
            left: 330,
            top: sitting ? 820 : 700,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(247,231,176,0.45) 0%, rgba(247,231,176,0) 62%)",
            opacity: phoneLight,
          }}
        />
        {/* затемнение, когда свет выключен */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(3,5,10,0.45)", opacity: 1 - phoneLight }} />

        <Character pose={pose} frame={frame} fps={fps} knockAt={knockAt} x={sitting ? 330 : 300} y={sitting ? 600 : 580} scale={1.05} />

        {/* круги от ударов по стене */}
        {knockAt.map((k, i) => {
          const d = frame - sec(k, fps);
          if (d < 0 || d > 12) return null;
          const r = interpolate(d, [0, 12], [12, 90]);
          const o = interpolate(d, [0, 12], [0.9, 0]);
          return (
            <svg key={i} width={1080} height={1920} style={{ position: "absolute" }}>
              <circle cx={765} cy={865} r={r} fill="none" stroke={colors.yellow} strokeWidth={8} opacity={o} />
            </svg>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
