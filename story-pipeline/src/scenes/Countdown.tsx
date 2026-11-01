import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, Burst, Card, Glow, Puff, Shake } from "../components/Fx";
import { DrawPath, Enter } from "../components/Motion";
import { Hud, Label } from "../components/Overlays";
import { colors, fonts, ink, stroke } from "../theme";
import type { SceneTimeline } from "../types";

// Свет и звук: вспышка слева достигает школы мгновенно (луч со свечением), ударная волна ползёт
// по шкале километров с пылью, крупный счётчик секунд бьёт каждую секунду, формула «3 с = 1 км».
export const Countdown: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const lightAt = B.lightAt(scene);
  const soundAt = B.soundAt(scene);
  const countAt = B.countAt(scene);
  const formulaAt = B.formulaAt(scene);
  const timeAt = B.yourTimeAt(scene);
  const light = pop(frame, fps, sec(lightAt, fps));
  const beam = interpolate(t, [lightAt, lightAt + 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lightBurst = interpolate(t, [lightAt, lightAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const waveK = interpolate(t, [soundAt, soundAt + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const seconds = t >= countAt ? Math.min(9, Math.floor(t - countAt) + 1) : 0;
  const tick = t >= countAt ? (t - countAt) % 1 : 1;
  const keys = [focusKey(0, 540, 760, 1.0), focusKey(lightAt, 540, 760, 1.05), focusKey(countAt, 540, 830, 1.1), focusKey(dur, 540, 850, 1.15)];
  const x0 = 180;
  const x1 = 900;
  const wx = x0 + (x1 - x0) * waveK;

  return (
    <Backdrop variant="navy" spot={{ x: x0, y: 560, color: "#f3c03a", opacity: 0.3 }}>
      <Camera keys={keys}>
        <Shake at={lightAt} amp={8} dur={0.35}>
          <Glow x={x0} y={560} r={300} opacity={0.6 + 0.4 * light.opacity} />
          <Burst x={x0} y={560} k={lightBurst} n={16} r0={90} r1={620} color="#fff8e6" width={9} />
          <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
            {/* земля, дорога, деревья */}
            <rect x={-100} y={700} width={1280} height={700} fill="#0d1226" />
            <rect x={-100} y={790} width={1280} height={70} fill="#151b33" stroke={ink} strokeWidth={4} />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={-80 + i * 110} y={822} width={50} height={6} rx={3} fill={colors.dim} opacity={0.6} />
            ))}
            {[330, 470, 620, 760].map((tx, i) => (
              <g key={i} transform={`translate(${tx} 700) rotate(${Math.sin(t * 1.1 + i) * 2} 0 0)`}>
                <rect x={-4} y={-34} width={8} height={34} fill="#4a3220" stroke={ink} strokeWidth={3} />
                <circle cx={0} cy={-50} r={20 + (i % 2) * 4} fill="#2a6a4a" {...stroke} strokeWidth={4} />
                <circle cx={-6} cy={-56} r={8} fill="#3ec66d" opacity={0.35} />
              </g>
            ))}
            <DrawPath d={`M${x0 - 40} 700 L${x1 + 60} 700`} at={0.15} dur={0.6} stroke={colors.white} width={5} outline />
            {[0, 1, 2, 3].map((k) => {
              const x = x0 + ((x1 - x0) * k) / 3;
              const reached = wx >= x - 4;
              return (
                <g key={k}>
                  <DrawPath d={`M${x} 684 L${x} 722`} at={0.35 + k * 0.12} dur={0.25} stroke={reached && k > 0 ? colors.red : colors.white} width={4} outline />
                  <text x={x} y={764} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fontWeight={700} fill={reached && k > 0 ? colors.red : colors.dim} letterSpacing={2}>
                    {k} КМ
                  </text>
                </g>
              );
            })}
            {/* вспышка слева */}
            <g opacity={light.opacity} transform={`translate(${x0} 560) scale(${light.scale * (1 + 0.05 * Math.sin(t * 7))})`}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <line key={i} x1={70 * Math.cos((i * Math.PI) / 4 + t * 0.5)} y1={70 * Math.sin((i * Math.PI) / 4 + t * 0.5)} x2={(110 + 14 * Math.sin(t * 9 + i)) * Math.cos((i * Math.PI) / 4 + t * 0.5)} y2={(110 + 14 * Math.sin(t * 9 + i)) * Math.sin((i * Math.PI) / 4 + t * 0.5)} stroke={colors.yellow} strokeWidth={11} strokeLinecap="round" />
              ))}
              <circle cx={0} cy={0} r={58} fill="#fff8e6" {...stroke} strokeWidth={5} />
            </g>
            {/* школа справа */}
            <rect x={x1 - 96} y={496} width={192} height={204} fill="#3a4668" {...stroke} />
            <rect x={x1 - 110} y={480} width={220} height={24} rx={6} fill="#4a567a" {...stroke} strokeWidth={5} />
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={x1 - 72 + c * 52} y={520 + r * 54} width={32} height={34} rx={4} fill="#cfe3ff" stroke={ink} strokeWidth={3} />),
            )}
            <rect x={x1 - 30} y={640} width={60} height={60} rx={4} fill="#1c2440" stroke={ink} strokeWidth={4} />
            <text x={x1} y={466} textAnchor="middle" fontFamily={fonts.mono} fontSize={22} fill={colors.dim} letterSpacing={4}>ШКОЛА</text>
            {/* луч света */}
            {beam > 0 && (
              <g>
                <line x1={x0 + 60} y1={560} x2={x0 + 60 + (x1 - x0 - 160) * beam} y2={560} stroke="#fff8e6" strokeWidth={22} opacity={0.35} strokeLinecap="round" />
                <line x1={x0 + 60} y1={560} x2={x0 + 60 + (x1 - x0 - 160) * beam} y2={560} stroke="#fff8e6" strokeWidth={8} strokeLinecap="round" />
              </g>
            )}
            <text x={540} y={524} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fontWeight={700} fill="#fff8e6" letterSpacing={4} opacity={beam}>
              СВЕТ · МГНОВЕННО
            </text>
            {/* ударная волна */}
            {waveK > 0 && (
              <g>
                <ellipse cx={wx} cy={640} rx={28} ry={96} fill="none" stroke={ink} strokeWidth={16} />
                <ellipse cx={wx} cy={640} rx={28} ry={96} fill="none" stroke={colors.red} strokeWidth={9} />
                <ellipse cx={wx - 34} cy={640} rx={20} ry={74} fill="none" stroke={colors.red} strokeWidth={5} opacity={0.5} />
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle key={i} cx={wx - 40 - i * 22 - ((t * 60) % 22)} cy={690 - (i % 3) * 14} r={6 + (i % 2) * 3} fill="#9a8f7a" stroke={ink} strokeWidth={2} opacity={0.6 - i * 0.1} />
                ))}
                <text x={Math.min(760, Math.max(320, wx))} y={812} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fontWeight={700} fill={colors.red} letterSpacing={4}>
                  ЗВУК · 340 М/С
                </text>
              </g>
            )}
          </svg>
          {/* герой у школы смотрит на вспышку и считает */}
          <Character pose="stand" frame={frame} fps={fps} x={720} y={700 - 554 * 0.42} scale={0.42} flip lookAt={[-1, -0.3]} mood={t >= countAt ? "scared" : "neutral"} flinchAt={[lightAt]} talkAt={t >= countAt ? [countAt, countAt + 1, countAt + 2] : []} />
          {/* счётчик секунд */}
          {seconds > 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 846, textAlign: "center", fontFamily: fonts.mono, fontSize: 230, fontWeight: 700, color: t >= timeAt ? colors.yellow : colors.white, lineHeight: 1, WebkitTextStroke: `6px ${ink}`, paintOrder: "stroke fill", textShadow: `10px 10px 0 ${ink}`, transform: `scale(${1 + 0.12 * Math.max(0, 1 - tick * 5)})` }}>
              {seconds}
              <span style={{ fontSize: 76, marginLeft: 16 }}>С</span>
            </div>
          )}
          <Puff x={540} y={1000} k={seconds > 0 && tick < 0.3 ? tick / 0.3 : 0} r={40} color="#3a4668" />
          <Enter at={formulaAt} from="up" dist={160} rotate={8} origin="540px 1130px">
          <div style={{ position: "absolute", left: 0, right: 0, top: 1072, display: "flex", justifyContent: "center", transform: "rotate(-2deg)" }}>
            <div style={{ position: "relative" }}>
              <Card x={0} y={0} w={420} h={118} color={colors.yellow} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
                <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 74, color: colors.yellow, letterSpacing: 2, WebkitTextStroke: `3px ${ink}`, paintOrder: "stroke fill" }}>3 С = 1 КМ</div>
              </Card>
            </div>
          </div>
          </Enter>
        </Shake>
      </Camera>
      {t >= timeAt && <Hud label="ТВОЁ ВРЕМЯ" value={`${seconds} С`} tone="yellow" delay={sec(timeAt, fps)} />}
      <Label text="СЧИТАЙ ОТ ВСПЫШКИ ДО УДАРА" x={540} y={1225} delay={sec(countAt, fps) + 10} tone="dark" size={30} />
    </Backdrop>
  );
};
