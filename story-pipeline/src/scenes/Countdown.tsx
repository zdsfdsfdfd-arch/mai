import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Hud, Label } from "../components/Overlays";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// Свет и звук: вспышка слева достигает школы мгновенно, ударная волна ползёт по шкале километров,
// счётчик секунд, формула «3 с = 1 км», HUD «твоё время».
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
  const beam = interpolate(t, [lightAt, lightAt + 0.12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const waveK = interpolate(t, [soundAt, soundAt + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const seconds = t >= countAt ? Math.min(9, Math.floor((t - countAt) * 1.0) + 1) : 0;
  const formula = pop(frame, fps, sec(formulaAt, fps));
  const keys = [focusKey(0, 540, 760, 1.0), focusKey(lightAt, 540, 760, 1.05), focusKey(countAt, 540, 820, 1.1), focusKey(dur, 540, 840, 1.15)];
  const x0 = 180;
  const x1 = 900;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* земля и шкала километров */}
          <line x1={x0} y1={700} x2={x1} y2={700} stroke={colors.line} strokeWidth={4} />
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <line x1={x0 + ((x1 - x0) * k) / 3} y1={690} x2={x0 + ((x1 - x0) * k) / 3} y2={720} stroke={colors.dim} strokeWidth={4} />
              <text x={x0 + ((x1 - x0) * k) / 3} y={760} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fill={colors.dim}>
                {k} КМ
              </text>
            </g>
          ))}
          {/* вспышка слева */}
          <g opacity={light.opacity} transform={`translate(${x0} 560) scale(${light.scale})`}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <line key={i} x1={0} y1={0} x2={110 * Math.cos((i * Math.PI) / 4)} y2={110 * Math.sin((i * Math.PI) / 4)} stroke={colors.yellow} strokeWidth={10} strokeLinecap="round" opacity={0.5 + 0.5 * Math.abs(Math.sin(t * 9 + i))} />
            ))}
            <circle cx={0} cy={0} r={56} fill="#fff8e6" />
          </g>
          {/* школа справа */}
          <rect x={x1 - 90} y={500} width={180} height={200} fill="#3a4668" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={x1 - 70 + c * 50} y={520 + r * 55} width={30} height={34} fill="#cfe3ff" />),
          )}
          <rect x={x1 - 30} y={640} width={60} height={60} fill="#1c2440" />
          {/* луч света: мгновенно */}
          <line x1={x0 + 60} y1={560} x2={x0 + 60 + (x1 - x0 - 150) * beam} y2={560} stroke="#fff8e6" strokeWidth={8} opacity={beam > 0 ? 0.9 : 0} />
          <text x={540} y={530} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fill="#fff8e6" letterSpacing={4} opacity={beam}>
            СВЕТ · МГНОВЕННО
          </text>
          {/* ударная волна ползёт */}
          {waveK > 0 && (
            <g>
              <ellipse cx={x0 + (x1 - x0) * waveK} cy={640} rx={26} ry={90} fill="none" stroke={colors.red} strokeWidth={8} opacity={0.9} />
              <ellipse cx={x0 + (x1 - x0) * waveK - 30} cy={640} rx={20} ry={70} fill="none" stroke={colors.red} strokeWidth={5} opacity={0.5} />
              <text x={Math.min(760, Math.max(320, x0 + (x1 - x0) * waveK))} y={806} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fill={colors.red} letterSpacing={4}>
                ЗВУК · 340 М/С
              </text>
            </g>
          )}
        </svg>
        {/* счётчик секунд */}
        {seconds > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 836, textAlign: "center", fontFamily: fonts.mono, fontSize: 220, fontWeight: 700, color: t >= timeAt ? colors.yellow : colors.white, lineHeight: 1, transform: `scale(${1 + 0.08 * Math.max(0, 1 - ((t - countAt) % 1) * 4)})` }}>
            {seconds}
            <span style={{ fontSize: 70, marginLeft: 14 }}>С</span>
          </div>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, top: 1070, display: "flex", justifyContent: "center", opacity: formula.opacity, transform: `translateY(${formula.y}px) scale(${formula.scale})` }}>
          <div style={{ padding: "14px 36px", borderRadius: 18, background: colors.panel, border: `4px solid ${colors.yellow}`, fontFamily: fonts.display, fontWeight: 900, fontSize: 72, color: colors.yellow, letterSpacing: 2 }}>3 С = 1 КМ</div>
        </div>
      </Camera>
      {t >= timeAt && <Hud label="ТВОЁ ВРЕМЯ" value={`${seconds} С`} tone="yellow" delay={sec(timeAt, fps)} />}
      <Label text="СЧИТАЙ ОТ ВСПЫШКИ ДО УДАРА" x={540} y={1225} delay={sec(countAt, fps) + 10} tone="dark" size={30} />
    </AbsoluteFill>
  );
};
