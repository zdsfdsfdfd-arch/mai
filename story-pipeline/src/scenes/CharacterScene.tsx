import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import { breatheAt, knockTimes, lightOffAt, sitAt } from "../beats";
import { Camera, type CamKey } from "../components/Camera";
import { Character } from "../components/Character";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { setting: "cabin"; light: "phone" | "dim"; lightOffAt?: number; knockAt?: number[]; batteryLabel?: string };

// Персонаж в кабине. Варианты: садится по команде и выключает фонарик (с мерцанием), дышит медленно
// (пульсирующий круг); стучит по стене (удары, кольца и волны звука вверх), камера от кулака отъезжает;
// сидит в темноте с мигающим «2 %». Аварийная лампа всё время слегка мерцает.
export const CharacterScene: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const pose = scene.character?.pose ?? "stand";
  const dur = scene.durationFrames / fps;
  const knocks = knockTimes(scene);
  const isSitScene = pose === "sit" && p.light === "phone";
  const sitT = isSitScene ? sitAt(scene) : undefined;
  const offT = isSitScene ? lightOffAt(scene) : undefined;
  const brT = isSitScene ? breatheAt(scene) : undefined;
  const talkAt = scene.phrases.map((ph) => ph.start);

  // свет телефона: мерцает перед выключением
  let phoneLight = p.light === "phone" ? 1 : 0;
  if (offT !== undefined && t >= offT) {
    const d = t - offT;
    phoneLight = d < 0.08 ? 0.3 : d < 0.16 ? 1 : d < 0.22 ? 0.2 : 0;
  }
  // тряска кадра на ударах
  let shake = 0;
  for (const k of knocks) {
    const d = frame - sec(k, fps);
    if (d >= 0 && d <= 5) shake = Math.max(shake, interpolate(d, [0, 5], [1, 0]));
  }
  const w = wiggle(frame, 4 * shake, 3);
  const sitting = pose === "sit";
  const emergency = 0.55 + 0.45 * Math.abs(Math.sin(t * 5.3)) * (Math.sin(t * 17) > -0.6 ? 1 : 0.4);

  const focus = (px: number, py: number, s: number): CamKey => ({ t: 0, x: (px - 540) * s, y: (py - 800) * s, scale: s });
  let keys: CamKey[];
  if (pose === "knock") {
    const p3 = scene.phrases[3]?.start ?? 3.4;
    keys = [
      { ...focus(700, 860, 1.5), t: 0 },
      { ...focus(700, 860, 1.5), t: p3 - 0.2 },
      { ...focus(540, 860, 1.05), t: p3 + 0.8 },
      { ...focus(540, 860, 1.0), t: dur },
    ];
  } else if (isSitScene) {
    keys = [
      { ...focus(540, 860, 1.0), t: 0 },
      { ...focus(540, 900, 1.15), t: sitT! + 0.8 },
      { ...focus(540, 900, 1.15), t: brT! - 0.2 },
      { ...focus(520, 880, 1.3), t: dur },
    ];
  } else {
    keys = [
      { ...focus(540, 880, 1.15), t: 0 },
      { ...focus(540, 880, 1.3), t: dur },
    ];
  }
  const breath = brT !== undefined && t >= brT ? 0.5 + 0.5 * Math.sin(((t - brT) / 4) * Math.PI * 2 - Math.PI / 2) : 0;
  const breathOpacity = brT !== undefined ? interpolate(t, [brT, brT + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const label = pop(frame, fps, sec(0.8, fps));
  const blink2 = Math.sin(t * 3) > -0.2;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${w.x}px, ${w.y}px)` }}>
          <div style={{ position: "absolute", left: 120, top: 330, width: 840, height: 930, background: colors.panel }} />
          <div style={{ position: "absolute", left: 760, top: 330, width: 200, height: 930, background: colors.panelLight, opacity: 0.5 }} />
          <div style={{ position: "absolute", left: 120, top: 1180, width: 840, height: 80, background: "#0a0e1a" }} />
          <div style={{ position: "absolute", left: 500, top: 350, width: 80, height: 18, borderRadius: 9, background: colors.red, opacity: emergency, boxShadow: `0 0 40px 10px rgba(229,57,47,${0.35 * emergency})` }} />
          {/* свет телефона */}
          <div
            style={{
              position: "absolute",
              left: 330,
              top: sitting ? 820 : 700,
              width: 620,
              height: 620,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(247,231,176,0.45) 0%, rgba(247,231,176,0) 62%)",
              opacity: phoneLight,
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(3,5,10,0.45)", opacity: 1 - phoneLight }} />

          {/* круг дыхания */}
          {brT !== undefined && (
            <div
              style={{
                position: "absolute",
                left: 505 - 90 - 60 * breath,
                top: 930 - 90 - 60 * breath,
                width: 180 + 120 * breath,
                height: 180 + 120 * breath,
                borderRadius: "50%",
                border: `4px solid ${colors.lightCone}`,
                opacity: breathOpacity * (0.25 + 0.35 * breath),
              }}
            />
          )}

          <Character pose={isSitScene ? "stand" : pose} sitAt={sitT} frame={frame} fps={fps} knockAt={knocks} talkAt={pose === "knock" ? [] : talkAt} x={sitting || isSitScene ? 330 : 300} y={sitting || isSitScene ? 600 : 580} scale={1.05} />

          {/* кольца и волны от ударов */}
          {knocks.map((k, i) => {
            const d = frame - sec(k, fps);
            if (d < 0 || d > 30) return null;
            const r = interpolate(d, [0, 12], [12, 90], { extrapolateRight: "clamp" });
            const o = interpolate(d, [0, 12], [0.9, 0], { extrapolateRight: "clamp" });
            const wy = interpolate(d, [0, 30], [0, -420]);
            const wo = interpolate(d, [0, 6, 30], [0, 0.6, 0]);
            return (
              <svg key={i} width={1080} height={1920} style={{ position: "absolute" }}>
                <circle cx={765} cy={865} r={r} fill="none" stroke={colors.yellow} strokeWidth={8} opacity={o} />
                <path d={`M 820 ${865 + wy} q 30 -20 60 0 t 60 0`} fill="none" stroke={colors.yellow} strokeWidth={5} opacity={wo} />
              </svg>
            );
          })}

          {/* мигающий процент батареи в тёмной сцене */}
          {p.batteryLabel && (
            <div style={{ position: "absolute", left: 640, top: 760, padding: "8px 20px", borderRadius: 12, background: colors.red, color: colors.white, fontFamily: fonts.mono, fontSize: 40, fontWeight: 700, opacity: label.opacity * (blink2 ? 1 : 0.35), transform: `translateY(${label.y}px) scale(${label.scale})` }}>
              {p.batteryLabel}
            </div>
          )}
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
