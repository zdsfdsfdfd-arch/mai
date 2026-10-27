import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Sheep } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type SheepSpec = { at?: number; color?: "white" | "black"; idle?: boolean; fromLeft?: boolean };
type Props = { sheep?: SheepSpec[] };

// Комната героя утром: кровать, окно, фикус. s08: овца жуёт фикус, бантик, штамп «ПРОПИСАНА», листья.
// s10: камера к коридору, выходит вторая (чёрная), они переглядываются.
export const RoomScene: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const sheep = p.sheep ?? [];
  const second = sheep.find((s) => s.fromLeft);
  const isSecondScene = !!second;
  const talkAt = scene.phrases.map((x) => x.start);

  // s08
  const bowAt = isSecondScene ? -1 : B.bowAt(scene);
  const stampAt = isSecondScene ? Infinity : B.stampAt(scene);
  const leavesAt = isSecondScene ? Infinity : B.leavesAt(scene);
  // s10
  const panAt = isSecondScene ? B.panAt(scene) : Infinity;
  const secondAt = isSecondScene ? B.secondSheepAt(scene) : Infinity;
  const glanceAt = isSecondScene ? B.glanceAt(scene) : Infinity;
  const discussedAt = isSecondScene ? B.discussedAt(scene) : Infinity;

  const bow = pop(frame, fps, sec(bowAt, fps));
  const stamp = pop(frame, fps, sec(stampAt, fps));
  const walkK = isSecondScene ? interpolate(t, [secondAt, secondAt + 1.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const secondX = -200 + 620 * walkK;
  const walking = walkK > 0 && walkK < 1;
  const dots = pop(frame, fps, sec(glanceAt, fps));
  const squint = t >= discussedAt;

  const keys = isSecondScene
    ? [focusKey(0, 540, 860, 1.1), focusKey(panAt + 0.9, 260, 860, 1.3), focusKey(secondAt + 1.2, 420, 920, 1.3), focusKey(glanceAt + 0.3, 560, 960, 1.5), focusKey(dur, 560, 960, 1.55)]
    : [focusKey(0, 540, 860, 1.05), focusKey(bowAt + 0.4, 760, 980, 1.5), focusKey(stampAt, 760, 980, 1.5), focusKey(leavesAt + 0.3, 700, 950, 1.3), focusKey(dur, 700, 950, 1.35)];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        {/* стены, пол, утреннее окно */}
        <div style={{ position: "absolute", left: 0, top: 330, width: 1080, height: 850, background: "#1e2a4a" }} />
        <div style={{ position: "absolute", left: 0, top: 1180, width: 1080, height: 140, background: "#2a2118" }} />
        <div style={{ position: "absolute", left: 420, top: 420, width: 260, height: 320, background: "#cfe3ff", borderRadius: 8, boxShadow: "0 0 80px 30px rgba(207,227,255,0.18)" }} />
        <div style={{ position: "absolute", left: 545, top: 420, width: 10, height: 320, background: "#1e2a4a" }} />
        <div style={{ position: "absolute", left: 420, top: 575, width: 260, height: 10, background: "#1e2a4a" }} />
        {/* проём в коридор слева */}
        <div style={{ position: "absolute", left: 40, top: 430, width: 180, height: 750, background: "#0a0e1a" }} />
        {/* кровать */}
        <div style={{ position: "absolute", left: 120, top: 940, width: 420, height: 60, background: "#3b4a7a", borderRadius: 12 }} />
        <div style={{ position: "absolute", left: 120, top: 1000, width: 420, height: 180, background: "#2c3860", borderRadius: "0 0 12px 12px" }} />
        <div style={{ position: "absolute", left: 140, top: 900, width: 140, height: 60, background: colors.white, borderRadius: 14, opacity: 0.9 }} />
        {/* фикус */}
        <div style={{ position: "absolute", left: 760, top: 1060, width: 120, height: 120, background: "#8a4b2a", borderRadius: "10px 10px 30px 30px" }} />
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <line x1={820} y1={1060} x2={820} y2={860} stroke="#2f6b3a" strokeWidth={10} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const eaten = t >= leavesAt && i < 3;
            const fall = eaten ? interpolate(t, [leavesAt + i * 0.15, leavesAt + 0.9 + i * 0.15], [0, 260], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
            const ang = eaten ? fall * 0.8 : Math.sin(t * 1.5 + i) * 4;
            return <ellipse key={i} cx={820 + (i % 2 ? 46 : -46)} cy={880 + i * 32 + fall} rx={44} ry={18} fill={colors.green} transform={`rotate(${(i % 2 ? -20 : 20) + ang} ${820 + (i % 2 ? 46 : -46)} ${880 + i * 32 + fall})`} opacity={0.95} />;
          })}
        </svg>
        {/* герой сидит на кровати */}
        <Character pose="sit" frame={frame} fps={fps} x={200} y={700} scale={0.95} talkAt={talkAt} />
        {/* белая овца у фикуса */}
        <Sheep frame={frame} fps={fps} x={560} y={1010} scale={0.85} bow bowOpacity={isSecondScene ? 1 : bow.opacity} state={squint ? "squint" : "chew"} />
        {/* чёрная выходит из коридора */}
        {isSecondScene && walkK > 0 && <Sheep frame={frame} fps={fps} x={secondX} y={1020} scale={0.85} color="black" bow state={walking ? "walk" : squint ? "squint" : "idle"} />}
        {/* переглянулись: многоточие между ними */}
        {isSecondScene && (
          <div style={{ position: "absolute", left: 470, top: 930, fontFamily: fonts.display, fontWeight: 900, fontSize: 70, color: colors.white, opacity: dots.opacity * (squint ? 0 : 1), transform: `translateY(${dots.y}px)` }}>
            • • •
          </div>
        )}
        {/* штамп «ПРОПИСАНА» */}
        {!isSecondScene && (
          <div style={{ position: "absolute", left: 600, top: 900, padding: "8px 22px", border: `6px solid ${colors.red}`, color: colors.red, fontFamily: fonts.display, fontWeight: 900, fontSize: 56, letterSpacing: 3, transform: `rotate(-12deg) scale(${stamp.scale * 1.1})`, opacity: stamp.opacity, borderRadius: 10 }}>
            ПРОПИСАНА
          </div>
        )}
      </Camera>
    </AbsoluteFill>
  );
};
