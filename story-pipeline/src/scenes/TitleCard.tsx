import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Character } from "../components/Character";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// Хук: название серии крупно, персонаж в тёмной кабине лифта.
export const TitleCard: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = pop(frame, fps, 2);
  const sub = pop(frame, fps, 12);
  const { title: titleText, subtitle } = scene.props as { title: string; subtitle: string };

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, ${colors.bg2} 0%, ${colors.bg} 70%)` }}>
      {/* кабина: задняя стена и две створки дверей с щелью */}
      <div style={{ position: "absolute", left: 140, top: 690, width: 800, height: 590, background: colors.panel }} />
      <div style={{ position: "absolute", left: 140, top: 690, width: 380, height: 590, background: colors.panelLight, opacity: 0.55 }} />
      <div style={{ position: "absolute", left: 560, top: 690, width: 380, height: 590, background: colors.panelLight, opacity: 0.55 }} />
      <div style={{ position: "absolute", left: 520, top: 690, width: 40, height: 590, background: "#05070d" }} />
      <div style={{ position: "absolute", left: 140, top: 1240, width: 800, height: 60, background: "#0a0e1a" }} />
      {/* слабое свечение телефона у персонажа */}
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 760,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(247,231,176,0.35) 0%, rgba(247,231,176,0) 65%)`,
        }}
      />
      <Character pose="stand" frame={frame} fps={fps} x={400} y={720} scale={0.95} />

      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.display,
          fontWeight: 900,
          fontSize: 300,
          lineHeight: 1,
          letterSpacing: 6,
          color: colors.white,
          WebkitTextStroke: "4px #07090f",
          paintOrder: "stroke fill",
          textShadow: "0 16px 40px rgba(0,0,0,0.7)",
          opacity: title.opacity,
          transform: `scale(${title.scale})`,
        }}
      >
        {titleText}
      </div>
      <div
        style={{
          position: "absolute",
          top: 610,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.mono,
          fontSize: 40,
          letterSpacing: 8,
          color: colors.yellow,
          opacity: sub.opacity,
          transform: `scale(${sub.scale})`,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
