import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import { titleBlackoutAt, titlePhoneAt } from "../beats";
import { Camera } from "../components/Camera";
import { Character } from "../components/Character";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// Хук: лифт только что встал (кабина вздрагивает), на второй фразе гаснет свет с мерцанием,
// на третьей зажигается экран телефона с «8 %». Камера медленно наезжает на персонажа.
export const TitleCard: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const title = pop(frame, fps, 2);
  const sub = pop(frame, fps, 12);
  const { title: titleText, subtitle } = scene.props as { title: string; subtitle: string };
  const dur = scene.durationFrames / fps;

  const bo = titleBlackoutAt(scene);
  const phoneAt = titlePhoneAt(scene);
  // мерцание света перед отключением
  let lights = 1;
  if (t >= bo) {
    const d = t - bo;
    lights = d < 0.12 ? 0.2 : d < 0.2 ? 1 : d < 0.3 ? 0.1 : d < 0.38 ? 0.8 : 0;
  }
  const dark = 1 - lights;
  const phoneGlow = interpolate(t, [phoneAt, phoneAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const label = pop(frame, fps, sec(phoneAt + 0.2, fps));
  // толчок кабины в первые 0,6 с
  const jolt = t < 0.6 ? wiggle(frame, 6 * (1 - t / 0.6), 11) : { x: 0, y: 0 };
  const talkAt = scene.phrases.map((p) => p.start);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, ${colors.bg2} 0%, ${colors.bg} 70%)` }}>
      <Camera keys={[{ t: 0, scale: 1 }, { t: bo, scale: 1.06 }, { t: dur, scale: 1.18 }]} origin="540px 960px">
        <div style={{ position: "absolute", inset: 0, transform: `translate(${jolt.x}px, ${jolt.y}px)` }}>
          {/* кабина: задняя стена и две створки дверей с щелью */}
          <div style={{ position: "absolute", left: 140, top: 690, width: 800, height: 590, background: colors.panel }} />
          <div style={{ position: "absolute", left: 140, top: 690, width: 380, height: 590, background: colors.panelLight, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 560, top: 690, width: 380, height: 590, background: colors.panelLight, opacity: 0.55 }} />
          <div style={{ position: "absolute", left: 520, top: 690, width: 40, height: 590, background: "#05070d" }} />
          <div style={{ position: "absolute", left: 140, top: 1240, width: 800, height: 60, background: "#0a0e1a" }} />
          {/* потолочная лампа */}
          <div style={{ position: "absolute", left: 470, top: 700, width: 140, height: 16, borderRadius: 8, background: colors.lightCone, opacity: 0.2 + 0.8 * lights, boxShadow: `0 0 ${60 * lights}px ${20 * lights}px rgba(247,231,176,0.35)` }} />
          {/* аварийная лампа после отключения */}
          <div style={{ position: "absolute", left: 500, top: 730, width: 80, height: 14, borderRadius: 7, background: colors.red, opacity: dark * (0.6 + 0.4 * Math.abs(Math.sin(t * 6))), boxShadow: `0 0 40px 10px rgba(229,57,47,${0.3 * dark})` }} />
          {/* затемнение при отключении света */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(2,4,9,0.62)", opacity: dark }} />
          {/* свечение телефона */}
          <div
            style={{
              position: "absolute",
              left: 300,
              top: 760,
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(247,231,176,0.4) 0%, rgba(247,231,176,0) 65%)`,
              opacity: phoneGlow,
            }}
          />
          <Character pose="stand" frame={frame} fps={fps} x={400} y={720} scale={0.95} talkAt={talkAt} />
          {/* подпись «8 %» у телефона */}
          <div
            style={{
              position: "absolute",
              left: 690,
              top: 1010,
              padding: "10px 22px",
              borderRadius: 14,
              background: colors.red,
              color: colors.white,
              fontFamily: fonts.mono,
              fontSize: 44,
              fontWeight: 700,
              opacity: label.opacity,
              transform: `translateY(${label.y}px) scale(${label.scale})`,
            }}
          >
            8 %
          </div>
        </div>
      </Camera>

      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.display,
          fontWeight: 900,
          fontSize: 300,
          lineHeight: 1,
          letterSpacing: 6,
          color: colors.white,
          WebkitTextStroke: "4px #07090f",
          paintOrder: "stroke fill",
          textShadow: "0 16px 40px rgba(0,0,0,0.7)",
          opacity: title.opacity,
          transform: `translateY(${-t * 4}px) scale(${title.scale * (1 + t * 0.006)})`,
        }}
      >
        {titleText}
      </div>
      <div
        style={{
          position: "absolute",
          top: 610,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.mono,
          fontSize: 40,
          letterSpacing: 8,
          color: colors.yellow,
          opacity: sub.opacity,
          transform: `scale(${sub.scale})`,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
