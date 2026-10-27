import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Heart } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { title: string; subtitle: string };

// Финал: герой у дома смотрит вверх, стрелка «проблема сверху», сверху сыплются сердечки,
// резкая чёрная заставка с «БЕ‑Е‑Е», затем карточка следующей части.
export const EndNeighbor: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const arrowAt = B.arrowAt(scene);
  const heartsAt = B.heartsAt(scene);
  const blackAt = B.blackoutAt(scene);
  const arrow = pop(frame, fps, sec(arrowAt, fps));
  const black = t >= blackAt;
  const be = pop(frame, fps, sec(blackAt, fps) + 2);
  const next = pop(frame, fps, sec(blackAt + 1.2, fps));
  const nextSub = pop(frame, fps, sec(blackAt + 1.5, fps));
  const talkAt = scene.phrases.map((x) => x.start);
  const keys = [focusKey(0, 540, 880, 1.05), focusKey(arrowAt, 540, 760, 1.15), focusKey(blackAt, 540, 700, 1.25)];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #4b6aa5 0%, #8fb0d8 60%, #a9c3e3 100%)` }}>
      {!black && (
        <Camera keys={keys}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1180, background: "#3a4668" }} />
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            {Array.from({ length: 5 }, (_, r) => [120, 300, 760, 920].map((wx) => <rect key={`${r}-${wx}`} x={wx} y={60 + r * 200} width={90} height={120} rx={6} fill="#1c2440" />))}
            <rect x={440} y={560} width={240} height={620} fill="#0f1428" />
          </svg>
          <div style={{ position: "absolute", left: 0, top: 1180, width: 1080, height: 140, background: "#4b4b55" }} />
          <Character pose="stand" frame={frame} fps={fps} x={360} y={600} scale={1.0} talkAt={talkAt} />
          {/* стрелка вверх */}
          <svg width={1080} height={1920} style={{ position: "absolute", opacity: arrow.opacity, transform: `translateY(${arrow.y - 6 * Math.abs(Math.sin(t * 4))}px)` }}>
            <polygon points="700,420 760,520 725,520 725,640 675,640 675,520 640,520" fill={colors.red} stroke="#07090f" strokeWidth={6} />
          </svg>
          {t >= heartsAt &&
            Array.from({ length: 10 }, (_, i) => {
              const k = ((t - heartsAt) * 0.35 + i / 10) % 1;
              return <Heart key={i} x={120 + i * 90 + Math.sin(k * 9 + i) * 20} y={-60 + k * 1300} size={26 + (i % 3) * 10} opacity={0.85 * (1 - Math.pow(k, 4))} />;
            })}
        </Camera>
      )}
      {black && (
        <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 220, color: colors.white, letterSpacing: 6, opacity: be.opacity * (t < blackAt + 1.1 ? 1 : interpolate(t, [blackAt + 1.1, blackAt + 1.3], [1, 0], { extrapolateRight: "clamp" })), transform: `scale(${be.scale})` }}>
            БЕ‑Е‑Е
          </div>
          <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", fontFamily: fonts.display, fontWeight: 900, fontSize: 240, color: colors.white, letterSpacing: 4, opacity: next.opacity, transform: `scale(${next.scale})` }}>
            {p.title}
          </div>
          <div style={{ position: "absolute", top: 920, left: 0, right: 0, textAlign: "center", fontFamily: fonts.mono, fontSize: 42, letterSpacing: 8, color: colors.yellow, opacity: nextSub.opacity, transform: `scale(${nextSub.scale})` }}>
            {p.subtitle}
          </div>
        </AbsoluteFill>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 0 }}>{String(dur).slice(0, 0)}</div>
    </AbsoluteFill>
  );
};
