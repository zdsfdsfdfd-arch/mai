import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { items: string[] };

// Итоговый чек-лист: пункты появляются по фразам, галочки рисуются, герой кивает рядом.
export const Checklist: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const times = B.checkTimes(scene, p.items.length);
  const keys = [focusKey(0, 540, 800, 1.0), focusKey(dur, 540, 820, 1.06)];
  const done = times.filter((x) => t >= x).length;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <Character pose="stand" frame={frame} fps={fps} x={760} y={560} scale={0.9} mood={done === p.items.length ? "smile" : "neutral"} talkAt={times} />
        {p.items.map((item, i) => {
          const a = pop(frame, fps, sec(times[i], fps));
          const checkK = interpolate(t, [times[i] + 0.1, times[i] + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = 400 + i * 130;
          return (
            <div key={i} style={{ position: "absolute", left: 100, top: y, display: "flex", alignItems: "center", gap: 26, opacity: a.opacity, transform: `translateX(${-a.y * 2}px) scale(${a.scale})`, transformOrigin: "left center" }}>
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="38" fill={checkK >= 1 ? colors.green : colors.panel} stroke={colors.green} strokeWidth="6" />
                <polyline points="22,44 36,58 62,28" fill="none" stroke={colors.white} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset={80 * (1 - checkK)} />
              </svg>
              <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 76, color: colors.white, letterSpacing: 2 }}>
                <span style={{ color: colors.dim, fontSize: 40, marginRight: 18 }}>{i + 1}</span>
                {item}
              </div>
            </div>
          );
        })}
      </Camera>
    </AbsoluteFill>
  );
};
