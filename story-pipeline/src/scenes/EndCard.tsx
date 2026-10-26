import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { Character } from "../components/Character";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { title: string; subtitle: string };

// Финальная карточка с клиффхэнгером и призывом подписаться.
export const EndCard: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const title = pop(frame, fps, 4);
  const sub = pop(frame, fps, 14);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${colors.bg2} 0%, ${colors.bg} 70%)` }}>
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.display,
          fontWeight: 900,
          fontSize: 260,
          lineHeight: 1,
          letterSpacing: 4,
          color: colors.white,
          WebkitTextStroke: "4px #07090f",
          paintOrder: "stroke fill",
          opacity: title.opacity,
          transform: `scale(${title.scale})`,
        }}
      >
        {p.title}
      </div>
      <div style={{ position: "absolute", top: 720, left: 0, right: 0, textAlign: "center", fontFamily: fonts.mono, fontSize: 44, letterSpacing: 8, color: colors.yellow, opacity: sub.opacity, transform: `scale(${sub.scale})` }}>
        {p.subtitle}
      </div>
      <Character pose="stand" frame={frame} fps={fps} x={430} y={820} scale={0.72} />
      <Label text="ПОДПИШИСЬ, ЧТОБЫ НЕ ПРОПУСТИТЬ" x={540} y={1225} delay={24} tone="red" size={32} />
    </AbsoluteFill>
  );
};
