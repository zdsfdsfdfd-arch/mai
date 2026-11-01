import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, stamp } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Backdrop, Burst, Glow, Shake } from "../components/Fx";
import { DrawPath } from "../components/Motion";
import { Label } from "../components/Overlays";
import { colors, fonts, ink, stroke } from "../theme";
import type { SceneTimeline } from "../types";

// Закат, город в силуэте, гриб с обводкой и свечением у основания. Снизу поднимается кулак с большим пальцем,
// HUD-скобки сравнивают палец и облако, затем штамп «МИФ» впечатывается с тряской и красный крест.
export const ThumbMyth: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const upAt = B.thumbUpAt(scene);
  const outAt = B.outlineAt(scene);
  const mythAt = B.mythAt(scene);
  const crossAt = B.crossAt(scene);
  const up = interpolate(t, [upAt, upAt + 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (k) => 1 - Math.pow(1 - k, 3) });
  const cloudK = interpolate(t, [0, dur], [0.82, 1.12]);
  const myth = stamp(frame, fps, sec(mythAt, fps));
  const crossK = interpolate(t, [crossAt, crossAt + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mythBurst = interpolate(t, [mythAt + 0.08, mythAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const keys = [focusKey(0, 540, 760, 1.0), focusKey(upAt + 0.8, 540, 900, 1.12), focusKey(mythAt, 540, 900, 1.12), focusKey(crossAt + 0.4, 540, 940, 1.25), focusKey(dur, 540, 940, 1.28)];
  const ash = Array.from({ length: 40 }, (_, i) => ({ x: (i * 173) % 1080, y0: (i * 211) % 1400, s: 0.6 + (i % 4) * 0.3, r: 2 + (i % 3) * 1.5 }));

  return (
    <Backdrop variant="dusk" grid={false} particles={false}>
      <Camera keys={keys}>
        <Shake at={mythAt} amp={14} dur={0.45} seed={3}>
          <Shake at={crossAt} amp={10} dur={0.4} seed={7}>
            <Glow x={540} y={1000} r={420} color="#ff8a3a" opacity={0.55} />
            <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
              {/* солнце */}
              <circle cx={200} cy={520} r={70} fill="#ffb347" {...stroke} strokeWidth={5} opacity={0.9} />
              {/* гриб */}
              <g transform={`translate(540 780) scale(${cloudK})`}>
                <path d="M-46 300 C-46 120, -70 60, -40 -10 L40 -10 C70 60, 46 120, 46 300 Z" fill="#5a4648" {...stroke} />
                <ellipse cx={0} cy={40} rx={90} ry={22} fill="none" stroke="#8a7676" strokeWidth={6} opacity={0.7} />
                <ellipse cx={0} cy={110} rx={70} ry={18} fill="none" stroke="#8a7676" strokeWidth={5} opacity={0.5} />
                <ellipse cx={0} cy={-30} rx={225} ry={118} fill="#6f5c5c" {...stroke} />
                <ellipse cx={-80} cy={-80} rx={128} ry={86} fill="#86716f" {...stroke} />
                <ellipse cx={90} cy={-90} rx={140} ry={96} fill="#5e4c4d" {...stroke} />
                <ellipse cx={0} cy={-130} rx={160} ry={76} fill="#9a8484" {...stroke} />
                <ellipse cx={-30} cy={-160} rx={70} ry={34} fill="#b09a98" opacity={0.7} />
                <ellipse cx={0} cy={300} rx={270} ry={44} fill="#3a2a2a" opacity={0.7} />
                <ellipse cx={0} cy={292} rx={160} ry={26} fill="#ff9a4a" opacity={0.55} />
              </g>
              {/* город */}
              {Array.from({ length: 15 }, (_, i) => {
                const h = 190 + ((i * 53) % 140);
                const x = i * 76 - 20;
                return (
                  <g key={i}>
                    <rect x={x} y={1290 - h} width={64} height={h + 40} fill="#1a1230" {...stroke} strokeWidth={5} />
                    {[0, 1, 2, 3].map((r) =>
                      [0, 1].map((c) => (
                        <rect key={`${r}${c}`} x={x + 12 + c * 26} y={1290 - h + 18 + r * 40} width={14} height={18} fill={colors.yellow} opacity={(i * 7 + r * 3 + c) % 5 === 0 ? 0 : 0.5 + 0.4 * Math.abs(Math.sin(t * 2 + i + r))} />
                      )),
                    )}
                  </g>
                );
              })}
              <rect x={-100} y={1290} width={1280} height={800} fill="#120e18" />
              {/* пепел */}
              {ash.map((d, i) => (
                <circle key={i} cx={d.x + Math.sin(t * 1.5 + i) * 20} cy={(d.y0 + t * 60 * d.s) % 1400} r={d.r} fill="#cfc2b5" opacity={0.35} />
              ))}
              {/* рука */}
              <g transform={`translate(0 ${(1 - up) * 760 + (up >= 1 ? Math.sin(t * 2.4) * 5 : 0)}) rotate(${up >= 1 ? Math.sin(t * 1.6) * 1.2 : 0} 490 1500)`}>
                <rect x={400} y={1340} width={180} height={760} fill="#2f4a8f" {...stroke} />
                <path d="M372 1340 L372 1170 C372 1130, 400 1118, 430 1140 L444 1040 C448 996, 520 996, 522 1040 L530 1140 L580 1140 C612 1140, 616 1180, 596 1192 C616 1204, 616 1240, 596 1250 C614 1262, 612 1296, 592 1304 C608 1316, 600 1340, 576 1340 Z" fill={colors.skin} {...stroke} />
                <path d="M530 1140 L580 1140 C612 1140, 616 1180, 596 1192 L540 1192 Z" fill="#d3a984" opacity={0.5} />
                <rect x={462} y={1010} width={40} height={28} rx={12} fill="#f3dcc4" stroke={ink} strokeWidth={3} />
                <rect x={384} y={1330} width={212} height={44} rx={12} fill="#1e2c50" {...stroke} />
              </g>
              {/* сравнение */}
              <DrawPath d="M426 988 h122 v166 h-122 Z" at={outAt} dur={0.5} stroke={colors.yellow} width={6} />
              <DrawPath d="M290 560 h500 v320 h-500 Z" at={outAt + 0.25} dur={0.6} stroke={colors.yellow} width={6} />
              <DrawPath d="M548 996 L790 880" at={outAt + 0.7} dur={0.3} stroke={colors.yellow} width={4} dash="10 10" />
              {/* крест */}
              <g opacity={crossK > 0 ? 1 : 0} strokeLinecap="round">
                <line x1={360} y1={1000} x2={360 + 230 * Math.min(1, crossK * 2)} y2={1000 + 280 * Math.min(1, crossK * 2)} stroke={ink} strokeWidth={30} />
                <line x1={590} y1={1000} x2={590 - 230 * Math.max(0, crossK * 2 - 1)} y2={1000 + 280 * Math.max(0, crossK * 2 - 1)} stroke={ink} strokeWidth={30} />
                <line x1={360} y1={1000} x2={360 + 230 * Math.min(1, crossK * 2)} y2={1000 + 280 * Math.min(1, crossK * 2)} stroke={colors.red} strokeWidth={18} />
                <line x1={590} y1={1000} x2={590 - 230 * Math.max(0, crossK * 2 - 1)} y2={1000 + 280 * Math.max(0, crossK * 2 - 1)} stroke={colors.red} strokeWidth={18} />
              </g>
            </svg>
            <Label text="ПАЛЕЦ < ОБЛАКО" x={540} y={940} delay={sec(outAt, fps) + 6} tone="beige" />
            <Burst x={740} y={650} k={mythBurst} n={12} r0={120} r1={420} color={colors.red} width={8} />
            <div style={{ position: "absolute", left: 560, top: 570, padding: "8px 30px", border: `10px solid ${colors.red}`, outline: `5px solid ${ink}`, outlineOffset: 0, boxShadow: `inset 0 0 0 5px ${ink}, 8px 8px 0 ${ink}`, color: colors.red, fontFamily: fonts.display, fontWeight: 900, fontSize: 128, letterSpacing: 6, transform: `rotate(-12deg) scale(${myth.scale})`, opacity: myth.opacity, borderRadius: 14, background: "rgba(11,16,32,0.55)", WebkitTextStroke: `3px ${ink}`, paintOrder: "stroke fill" }}>
              МИФ
            </div>
          </Shake>
        </Shake>
      </Camera>
      <Label text="В ЖИЗНИ НЕ РАБОТАЕТ" x={540} y={1225} delay={sec(crossAt, fps) + 8} tone="red" />
    </Backdrop>
  );
};
