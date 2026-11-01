import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, stamp } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Backdrop, Glow, Shake } from "../components/Fx";
import { Enter } from "../components/Motion";
import { Label } from "../components/Overlays";
import { colors, fonts, ink, stroke } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { minutes: number };

// После удара: дымка, далёкий гриб, школа с выбитыми окнами, большой таймер бежит к 15:00,
// с неба сыплется пыль, знак радиации впечатывается и пульсирует.
export const FalloutTimer: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const startAt = B.timerStartAt(scene);
  const dustAt = B.dustAt(scene);
  const dangerAt = B.dangerAt(scene);
  const timerK = interpolate(t, [startAt, dustAt], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const minutes = Math.floor(timerK * p.minutes);
  const secs = Math.floor((timerK * p.minutes * 60) % 60);
  const dustK = interpolate(t, [dustAt, dustAt + 1.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tre = stamp(frame, fps, sec(dustAt, fps) + 6);
  const keys = [focusKey(0, 540, 760, 1.0), focusKey(startAt + 0.5, 540, 800, 1.1), focusKey(dustAt + 0.5, 540, 780, 1.0), focusKey(dur, 540, 760, 1.05)];
  const dust = Array.from({ length: 90 }, (_, i) => ({ x: (i * 157) % 1080, y0: (i * 211) % 1300, s: 1.2 + (i % 4) * 0.4, r: 2.5 + (i % 3) * 2 }));
  const blink = Math.floor(t * 2) % 2 === 0;

  return (
    <Backdrop variant="haze" grid={false} particles={false}>
      <Camera keys={keys}>
        <Shake at={dustAt + 0.2} amp={9} dur={0.4}>
          <Glow x={820} y={560} r={300} color="#ff9a4a" opacity={0.35} />
          <Glow x={755} y={710} r={110} color={colors.yellow} opacity={Math.sin(t * 17) > 0.3 ? 0.5 : 0.05} />
          <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
            {/* далёкий гриб */}
            <g transform="translate(820 520) scale(0.6)" opacity={0.8}>
              <path d="M-40 320 C-40 140, -60 60, -34 -10 L34 -10 C60 60, 40 140, 40 320 Z" fill="#5a4648" {...stroke} />
              <ellipse cx={0} cy={-30} rx={210} ry={110} fill="#6f5c5c" {...stroke} />
              <ellipse cx={-70} cy={-80} rx={120} ry={80} fill="#86716f" {...stroke} />
              <ellipse cx={0} cy={-120} rx={150} ry={70} fill="#9a8484" {...stroke} />
            </g>
            {/* дымка */}
            {[0, 1, 2].map((i) => (
              <ellipse key={i} cx={300 + i * 300 + Math.sin(t * 0.3 + i) * 40} cy={880 + i * 20} rx={360} ry={40} fill="#c9a07a" opacity={0.12} />
            ))}
            {/* школа */}
            <rect x={120} y={596} width={424} height={368} fill="#3a4668" {...stroke} />
            <rect x={104} y={580} width={456} height={26} rx={6} fill="#4a567a" {...stroke} strokeWidth={5} />
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <g key={`${r}-${c}`}>
                  <rect x={150 + c * 100} y={628 + r * 100} width={64} height={74} rx={4} fill="#05070d" stroke={ink} strokeWidth={4} />
                  <path d={`M${160 + c * 100} ${640 + r * 100} L${190 + c * 100} ${670 + r * 100} L${175 + c * 100} ${696 + r * 100}`} fill="none" stroke="#cfe3ff" strokeWidth={3} opacity={0.5} />
                </g>
              )),
            )}
            <g transform={`rotate(${-8 + Math.sin(t * 1.2) * 2} 332 560)`}>
              <rect x={250} y={540} width={164} height={44} rx={8} fill={colors.beige} {...stroke} strokeWidth={5} />
              <text x={332} y={572} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fontWeight={700} fill={ink} letterSpacing={4}>ШКОЛА</text>
            </g>
            {/* столбы дыма над городом */}
            {[700, 860, 1000].map((sx, i) =>
              [0, 1, 2, 3].map((k) => {
                const ph = ((t * 0.25 + k / 4 + i * 0.13) % 1);
                return <circle key={`${i}${k}`} cx={sx + Math.sin(ph * 6 + i) * 24} cy={900 - ph * 420} r={22 + ph * 34} fill="#3a3038" stroke={ink} strokeWidth={4} opacity={0.75 * (1 - ph)} />;
              }),
            )}
            <rect x={-100} y={964} width={1280} height={500} fill="#2b2b33" />
            <line x1={-100} y1={964} x2={1180} y2={964} stroke={ink} strokeWidth={8} />
            <path d="M200 1000 L260 1040 L240 1090 M300 1120 L380 1100 L420 1150" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
            {/* погнутый фонарь с мигающей лампой */}
            <path d="M640 964 L646 760 Q650 700 700 690 L740 686" fill="none" stroke={ink} strokeWidth={22} strokeLinecap="round" />
            <path d="M640 964 L646 760 Q650 700 700 690 L740 686" fill="none" stroke="#5a5a66" strokeWidth={12} strokeLinecap="round" />
            <rect x={730} y={676} width={50} height={26} rx={8} fill="#4a4a55" stroke={ink} strokeWidth={5} />
            <ellipse cx={755} cy={706} rx={18} ry={9} fill={colors.yellow} opacity={Math.sin(t * 17) > 0.3 ? 0.9 : 0.15} />
            {/* обломки */}
            <polygon points="620,964 680,920 740,964" fill="#4a4a55" {...stroke} strokeWidth={5} />
            <polygon points="780,964 830,940 900,964" fill="#3f3f4a" {...stroke} strokeWidth={5} />
            {/* пыль */}
            {dustK > 0 &&
              dust.map((d, i) => {
                const y = (d.y0 + (t - dustAt) * 110 * d.s) % 1400;
                return <circle key={i} cx={d.x + Math.sin(t * 2 + i) * 14} cy={y} r={d.r} fill="#d9cfb8" stroke={ink} strokeWidth={1.5} opacity={0.8 * dustK} />;
              })}
          </svg>
          {/* таймер */}
          <Enter at={startAt} from="down" dist={160} origin="540px 400px">
          <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center" }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, letterSpacing: 8, color: colors.beige, textShadow: `3px 3px 0 ${ink}` }}>ДО ПЫЛИ</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 180, fontWeight: 700, color: timerK >= 1 ? colors.red : colors.white, lineHeight: 1.05, WebkitTextStroke: `6px ${ink}`, paintOrder: "stroke fill", textShadow: `10px 10px 0 ${ink}` }}>
              {String(minutes).padStart(2, "0")}
              <span style={{ opacity: blink || timerK >= 1 ? 1 : 0.25 }}>:</span>
              {String(secs).padStart(2, "0")}
            </div>
          </div>
          </Enter>
          {/* знак радиации */}
          {tre.opacity > 0 && <Glow x={540} y={1040} r={200} color={colors.yellow} opacity={0.35 + 0.25 * Math.abs(Math.sin(t * 5))} />}
          <svg width={1080} height={1920} style={{ position: "absolute", opacity: tre.opacity, transform: `scale(${tre.scale}) rotate(${-8 + Math.sin(t * 1.5) * 2}deg)`, transformOrigin: "540px 1040px", overflow: "visible" }}>
            <circle cx={540} cy={1040} r={116} fill={colors.yellow} {...stroke} strokeWidth={9} />
            {[0, 1, 2].map((i) => (
              <path key={i} d="M540 1040 L540 924 A116 116 0 0 1 640 982 Z" fill={ink} transform={`rotate(${i * 120 + t * 20} 540 1040)`} />
            ))}
            <circle cx={540} cy={1040} r={26} fill={ink} />
            <circle cx={540} cy={1040} r={13} fill={colors.yellow} />
          </svg>
        </Shake>
      </Camera>
      <Label text="РАДИОАКТИВНАЯ ПЫЛЬ · ГЛАВНАЯ ОПАСНОСТЬ" x={540} y={1225} delay={sec(dangerAt, fps)} tone="red" size={28} />
    </Backdrop>
  );
};
