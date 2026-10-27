import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// Гриб на горизонте, снизу поднимается рука с большим пальцем, сравнение «палец меньше облака»,
// штамп «МИФ» и красный крест: в жизни так не работает.
export const ThumbMyth: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const upAt = B.thumbUpAt(scene);
  const outAt = B.outlineAt(scene);
  const mythAt = B.mythAt(scene);
  const crossAt = B.crossAt(scene);
  const up = interpolate(t, [upAt, upAt + 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cloudK = interpolate(t, [0, dur], [0.8, 1.15]);
  const outline = pop(frame, fps, sec(outAt, fps));
  const myth = pop(frame, fps, sec(mythAt, fps));
  const crossK = interpolate(t, [crossAt, crossAt + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const keys = [focusKey(0, 540, 760, 1.0), focusKey(upAt + 0.8, 540, 900, 1.12), focusKey(mythAt, 540, 900, 1.12), focusKey(crossAt + 0.4, 540, 940, 1.25), focusKey(dur, 540, 940, 1.28)];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2a1d3a 0%, #7a3a2a 55%, #d8783a 100%)" }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* гриб на горизонте */}
          <g transform={`translate(540 760) scale(${cloudK})`}>
            <rect x={-40} y={-10} width={80} height={320} fill="#4a3a3a" opacity={0.9} />
            <ellipse cx={0} cy={-30} rx={210} ry={110} fill="#6a5a5a" />
            <ellipse cx={-70} cy={-70} rx={120} ry={80} fill="#7a6a6a" />
            <ellipse cx={80} cy={-80} rx={130} ry={90} fill="#5a4a4a" />
            <ellipse cx={0} cy={-120} rx={150} ry={70} fill="#8a7a7a" opacity={0.9} />
            <ellipse cx={0} cy={300} rx={260} ry={40} fill="#3a2a2a" opacity={0.6} />
          </g>
          {/* город на горизонте */}
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={i * 80} y={1080 - ((i * 53) % 120)} width={60} height={200 + ((i * 53) % 120)} fill="#1a1422" />
          ))}
          <rect x={0} y={1280} width={1080} height={700} fill="#120e18" />
          {/* рука с большим пальцем снизу */}
          <g transform={`translate(0 ${(1 - up) * 700})`}>
            <rect x={400} y={1340} width={180} height={700} fill="#2a3a66" />
            <path d="M372 1340 L372 1170 C372 1130, 400 1118, 430 1140 L444 1040 C448 996, 520 996, 522 1040 L530 1140 L580 1140 C612 1140, 616 1180, 596 1192 C616 1204, 616 1240, 596 1250 C614 1262, 612 1296, 592 1304 C608 1316, 600 1340, 576 1340 Z" fill="#e8c9a8" />
            <rect x={462} y={1010} width={40} height={28} rx={12} fill="#f3dcc4" />
            <rect x={384} y={1330} width={212} height={44} rx={12} fill="#1e2c50" />
          </g>
          {/* сравнение: рамка по пальцу и по облаку */}
          <g opacity={outline.opacity}>
            <rect x={434} y={994} width={106} height={154} fill="none" stroke={colors.yellow} strokeWidth={5} strokeDasharray="14 10" />
            <rect x={300} y={560} width={480} height={300} fill="none" stroke={colors.yellow} strokeWidth={5} strokeDasharray="14 10" />
            <line x1={540} y1={1000} x2={780} y2={860} stroke={colors.yellow} strokeWidth={3} strokeDasharray="8 8" />
          </g>
          {/* крест */}
          <g opacity={crossK > 0 ? 1 : 0}>
            <line x1={360} y1={1000} x2={360 + 230 * Math.min(1, crossK * 2)} y2={1000 + 280 * Math.min(1, crossK * 2)} stroke={colors.red} strokeWidth={18} strokeLinecap="round" />
            <line x1={590} y1={1000} x2={590 - 230 * Math.max(0, crossK * 2 - 1)} y2={1000 + 280 * Math.max(0, crossK * 2 - 1)} stroke={colors.red} strokeWidth={18} strokeLinecap="round" />
          </g>
        </svg>
        <Label text="ПАЛЕЦ < ОБЛАКО" x={540} y={940} delay={sec(outAt, fps) + 6} tone="beige" />
        <div style={{ position: "absolute", left: 620, top: 420, padding: "10px 30px", border: `8px solid ${colors.red}`, color: colors.red, fontFamily: fonts.display, fontWeight: 900, fontSize: 120, letterSpacing: 6, transform: `rotate(-12deg) scale(${myth.scale})`, opacity: myth.opacity, borderRadius: 14, background: "rgba(11,16,32,0.35)" }}>
          МИФ
        </div>
      </Camera>
      <Label text="В ЖИЗНИ НЕ РАБОТАЕТ" x={540} y={1225} delay={sec(crossAt, fps) + 8} tone="red" />
    </AbsoluteFill>
  );
};
