import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Heart, Sheep } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// Заставка «Сосед снизу»: герой в своей комнате, под полом розовое свечение соседской квартиры,
// на «влюбился» снизу всплывает сердце, на «в кого» в свечении проступает силуэт овцы.
export const TitleNeighbor: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const { title: titleText, subtitle } = scene.props as { title: string; subtitle: string };
  const title = pop(frame, fps, 2);
  const sub = pop(frame, fps, 12);
  const heartAt = B.titleHeartAt(scene);
  const whoAt = B.titleWhoAt(scene);
  const heartK = interpolate(t, [heartAt, heartAt + 1.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = 0.5 + 0.5 * Math.abs(Math.sin(t * 2.4));
  const who = interpolate(t, [whoAt, whoAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const q = pop(frame, fps, sec(whoAt + 0.2, fps));
  const talkAt = scene.phrases.map((p) => p.start);
  const keys = [focusKey(0, 540, 900, 1.0), focusKey(heartAt, 540, 920, 1.08), focusKey(whoAt + 0.4, 540, 1120, 1.3), focusKey(dur, 540, 1120, 1.35)];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, ${colors.bg2} 0%, ${colors.bg} 70%)` }}>
      <Camera keys={keys}>
        {/* комната героя */}
        <div style={{ position: "absolute", left: 120, top: 640, width: 840, height: 560, background: colors.panel }} />
        <div style={{ position: "absolute", left: 120, top: 1200, width: 840, height: 30, background: "#0a0e1a" }} />
        {/* квартира снизу: розовое свечение */}
        <div style={{ position: "absolute", left: 120, top: 1230, width: 840, height: 170, background: `rgba(255,93,143,${0.12 + 0.18 * glow})`, boxShadow: `inset 0 0 80px 10px rgba(255,93,143,${0.25 * glow})` }} />
        <div style={{ position: "absolute", left: 140, top: 1240, fontFamily: fonts.mono, fontSize: 26, color: "#ff5d8f", letterSpacing: 4, opacity: 0.8 }}>8 ЭТАЖ</div>
        {/* силуэт овцы в свечении */}
        <Sheep frame={frame} fps={fps} x={600} y={1250} scale={0.6} color="black" bow bowOpacity={who} state="idle" opacity={who * 0.9} />
        <div style={{ position: "absolute", left: 790, top: 1200, fontFamily: fonts.display, fontWeight: 900, fontSize: 110, color: "#ff5d8f", opacity: q.opacity, transform: `translateY(${q.y}px) scale(${q.scale})` }}>?</div>
        {/* сердце поднимается снизу */}
        {heartK > 0 && <Heart x={700 + Math.sin(heartK * 6) * 30} y={1240 - 520 * heartK} size={60 + 20 * heartK} opacity={(1 - heartK) * 0.95} />}
        <Character pose="stand" frame={frame} fps={fps} x={380} y={650} scale={0.98} talkAt={talkAt} />
      </Camera>
      <div style={{ position: "absolute", top: 190, left: 0, right: 0, textAlign: "center", fontFamily: fonts.display, fontWeight: 900, fontSize: 170, lineHeight: 1, letterSpacing: 4, color: colors.white, WebkitTextStroke: "4px #07090f", paintOrder: "stroke fill", textShadow: "0 16px 40px rgba(0,0,0,0.7)", opacity: title.opacity, transform: `translateY(${-t * 3}px) scale(${title.scale})` }}>
        {titleText}
      </div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontFamily: fonts.mono, fontSize: 36, letterSpacing: 8, color: colors.yellow, opacity: sub.opacity, transform: `scale(${sub.scale})` }}>
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
