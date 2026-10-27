import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Heart } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Card = { label: string; value: string; tone?: "red" | "green" | "yellow" };
type Props = { cards: Card[] };

// Приглашение на свадьбу выезжает из-под двери, строки появляются по фразам, затем карточка «решение».
export const Invitation: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const ph = (i: number, fb: number) => scene.phrases[i]?.start ?? fb;
  const slideAt = ph(1, 2.0);
  const weddingAt = ph(2, 3.6);
  const brideAt = ph(3, 4.6);
  const brideName = ph(4, 5.4);
  const witnessAt = ph(5, 6.2);
  const witnessName = ph(6, 7.3);
  const cardTimes = B.cardPhraseTimes(scene);
  const decisionAt = cardTimes[0] ?? ph(8, 10.9);
  const slide = interpolate(t, [slideAt, slideAt + 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = (at: number) => pop(frame, fps, sec(at, fps));
  const w = line(weddingAt);
  const b1 = line(brideAt);
  const b2 = line(brideName);
  const w1 = line(witnessAt);
  const w2 = line(witnessName);
  const keys = [focusKey(0, 540, 900, 1.05), focusKey(slideAt + 0.8, 540, 760, 1.3), focusKey(witnessName, 540, 760, 1.3), focusKey(decisionAt, 540, 900, 1.05), focusKey(dur, 540, 900, 1.05)];
  const cardY = 1180 - 520 * slide;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        {/* низ двери героя: полотно, щель, коврик */}
        <div style={{ position: "absolute", left: 330, top: 1130, width: 420, height: 160, background: colors.door, borderLeft: "14px solid #5a3419", borderRight: "14px solid #5a3419" }} />
        <div style={{ position: "absolute", left: 330, top: 1118, width: 420, height: 14, background: "#05070d" }} />
        <div style={{ position: "absolute", left: 380, top: 1290, width: 320, height: 26, borderRadius: 6, background: "#3b2a1a" }} />
        {/* приглашение */}
        <div style={{ position: "absolute", left: 250, top: cardY, width: 580, padding: "34px 36px", background: colors.white, color: colors.beigeInk, borderRadius: 10, transform: `rotate(${-5 + 5 * slide}deg)`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", opacity: slide > 0 ? 1 : 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 26, letterSpacing: 6, color: "#7a7a7a" }}>ПРИГЛАШЕНИЕ</div>
          <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 110, lineHeight: 1, color: colors.red, opacity: w.opacity, transform: `translateY(${w.y}px) scale(${w.scale})` }}>СВАДЬБА</div>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline", fontFamily: fonts.text, fontWeight: 800, fontSize: 36 }}>
            <span style={{ opacity: b1.opacity, color: "#7a7a7a" }}>НЕВЕСТА:</span>
            <span style={{ opacity: b2.opacity, transform: `scale(${b2.scale})`, display: "inline-block" }}>ЗИНА</span>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline", fontFamily: fonts.text, fontWeight: 800, fontSize: 36 }}>
            <span style={{ opacity: w1.opacity, color: "#7a7a7a" }}>СВИДЕТЕЛЬНИЦА:</span>
            <span style={{ opacity: w2.opacity, transform: `scale(${w2.scale})`, display: "inline-block" }}>КЛАВА</span>
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 22, letterSpacing: 3, color: "#7a7a7a", marginTop: 6 }}>8 ЭТАЖ · 19:00 · БЕЗ ДЕТЕЙ</div>
        </div>
        {t >= weddingAt && [0, 1, 2].map((i) => {
          const k = ((t - weddingAt) * 0.4 + i / 3) % 1;
          return <Heart key={i} x={300 + i * 200 + Math.sin(k * 7 + i) * 14} y={cardY - 40 - k * 200} size={30} opacity={(1 - k) * 0.8} />;
        })}
        {p.cards.map((c, i) => {
          const a = pop(frame, fps, sec(cardTimes[i] ?? decisionAt, fps));
          const color = c.tone === "red" ? colors.red : c.tone === "green" ? colors.green : c.tone === "yellow" ? colors.yellow : colors.white;
          return (
            <div key={i} style={{ position: "absolute", left: 300, top: 1060, width: 480, height: 150, borderRadius: 22, background: colors.panel, border: `4px solid ${color}`, opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <svg width="70" height="70" viewBox="0 0 70 70">
                <rect x="8" y="22" width="54" height="42" rx="8" fill="#8a5a2a" stroke="#5a3a1a" strokeWidth="4" />
                <rect x="24" y="12" width="22" height="14" rx="4" fill="none" stroke="#5a3a1a" strokeWidth="4" />
              </svg>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: fonts.text, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: colors.dim }}>{c.label}</div>
                <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 68, lineHeight: 1, color }}>{c.value}</div>
              </div>
            </div>
          );
        })}
      </Camera>
    </AbsoluteFill>
  );
};
