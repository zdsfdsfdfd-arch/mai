import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import { cardPhraseTimes } from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Card = { label: string; value: string; tone?: "red" | "green" | "yellow" };
type Props = { icon: "eye" | "decon" | "iodine" | "radio"; cards: Card[]; cardPhrases?: number[] };

// Факт-карточки с большой иконкой по теме: глаз (закрывается), дезактивация (герой снимает куртку,
// пыль слетает), йод (щит с перечёркнутым «I»), радио (телефон без сети и приёмник с волнами).
export const FactCards: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const times = cardPhraseTimes(scene);
  const first = times[0] ?? 1.5;
  const icon = pop(frame, fps, 4);
  const n = p.cards.length;
  const cw = n > 3 ? 236 : 300;
  const gap = n > 3 ? 16 : 20;
  const x0 = (1080 - (n * cw + (n - 1) * gap)) / 2;
  const keys = [focusKey(0, 540, 680, 1.25), focusKey(first - 0.3, 540, 700, 1.25), focusKey(first + 0.4, 540, 820, 1.0), focusKey(dur, 540, 840, 1.0)];
  const talkAt = scene.phrases.map((x) => x.start);

  const renderIcon = () => {
    switch (p.icon) {
      case "eye": {
        const closeK = interpolate(t, [first, first + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            {/* вспышка слева */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <line key={i} x1={200} y1={620} x2={200 + 90 * Math.cos((i * Math.PI) / 4)} y2={620 + 90 * Math.sin((i * Math.PI) / 4)} stroke={colors.yellow} strokeWidth={8} strokeLinecap="round" opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 9 + i))} />
            ))}
            <circle cx={200} cy={620} r={44} fill="#fff8e6" />
            {/* глаз справа */}
            <path d="M560 620 Q700 480 840 620 Q700 760 560 620 Z" fill={colors.white} />
            <circle cx={700} cy={620} r={50} fill="#3a7bd5" />
            <circle cx={700} cy={620} r={24} fill="#0b0b10" />
            <circle cx={682} cy={602} r={8} fill={colors.white} />
            {/* веко закрывается */}
            <path d={`M560 620 Q700 ${480 + 280 * closeK} 840 620 Q700 480 560 620 Z`} fill={colors.skin} />
            <path d="M560 620 Q700 480 840 620" fill="none" stroke="#2a1f1f" strokeWidth={8} />
            {/* лучи к глазу */}
            <line x1={250} y1={620} x2={540} y2={620} stroke={colors.yellow} strokeWidth={6} strokeDasharray="14 12" strokeDashoffset={-frame * 2} opacity={0.8} />
          </svg>
        );
      }
      case "decon": {
        const off = t >= first;
        const dustK = interpolate(t, [first, first + 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <>
            <Character pose="stand" outfit={off ? "shirt" : "jacket"} frame={frame} fps={fps} x={390} y={400} scale={0.95} talkAt={talkAt} />
            {dustK > 0 && dustK < 1 && (
              <svg width={1080} height={1920} style={{ position: "absolute" }}>
                {Array.from({ length: 30 }, (_, i) => {
                  const ang = ((i * 37) % 360) * (Math.PI / 180);
                  const r = 60 + 420 * dustK * (0.5 + ((i * 13) % 10) / 20);
                  return <circle key={i} cx={540 + Math.cos(ang) * r} cy={700 + Math.sin(ang) * r * 0.7} r={4 + (i % 3) * 2} fill="#9a8f7a" opacity={1 - dustK} />;
                })}
              </svg>
            )}
            {off && (
              <div style={{ position: "absolute", left: 640, top: 1040, width: 110, height: 130, background: "#2a3458", borderRadius: "10px 10px 20px 20px", border: "4px solid #4a5478" }}>
                <div style={{ position: "absolute", left: 14, top: 30, width: 70, height: 50, background: colors.jacket, borderRadius: 8 }} />
              </div>
            )}
          </>
        );
      }
      case "iodine": {
        const slashK = interpolate(t, [first + 0.3, first + 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <path d="M540 420 L740 500 L740 700 Q740 860 540 940 Q340 860 340 700 L340 500 Z" fill={colors.panelLight} stroke={colors.white} strokeWidth={8} />
            <text x={540} y={760} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={260} fill={colors.white}>I</text>
            <line x1={370} y1={470} x2={370 + 340 * slashK} y2={470 + 440 * slashK} stroke={colors.red} strokeWidth={22} strokeLinecap="round" />
            {/* таблетка и щитовидка */}
            <rect x={120} y={820} width={120} height={60} rx={30} fill={colors.white} />
            <rect x={120} y={820} width={60} height={60} rx={30} fill={colors.yellow} />
            <path d="M860 760 C900 720, 960 740, 950 800 C945 830, 900 850, 880 860 C860 850, 815 830, 810 800 C800 740, 860 720, 860 760 Z" fill="#e08aa0" opacity={0.9} />
          </svg>
        );
      }
      case "radio": {
        const second = times[1] ?? first + 1.5;
        const radioOn = t >= second;
        return (
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            {/* телефон без сети */}
            <rect x={150} y={480} width={220} height={400} rx={30} fill="#111318" />
            <rect x={164} y={500} width={192} height={360} rx={22} fill="#0a0f1e" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={200 + i * 32} y={640 - i * 18} width={22} height={20 + i * 18} rx={4} fill={colors.dim} opacity={0.5} />
            ))}
            <line x1={190} y1={690} x2={340} y2={560} stroke={colors.red} strokeWidth={10} strokeLinecap="round" />
            {/* приёмник */}
            <rect x={560} y={560} width={380} height={300} rx={26} fill={radioOn ? "#3a4668" : "#232a44"} stroke={colors.line} strokeWidth={6} />
            <circle cx={660} cy={710} r={70} fill="#0a0d1a" />
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={i} cx={660 + Math.cos((i * Math.PI) / 6) * 40} cy={710 + Math.sin((i * Math.PI) / 6) * 40} r={6} fill={colors.dim} />
            ))}
            <rect x={760} y={640} width={150} height={40} rx={8} fill="#0a0d1a" />
            <rect x={770} y={650} width={130 * (radioOn ? 0.3 + 0.7 * Math.abs(Math.sin(t * 3)) : 0.2)} height={20} rx={4} fill={radioOn ? colors.green : colors.dim} />
            <rect x={760} y={720} width={60} height={60} rx={30} fill={colors.red} />
            <line x1={880} y1={560} x2={980} y2={380} stroke={colors.white} strokeWidth={8} strokeLinecap="round" />
            {radioOn &&
              [0, 1, 2].map((k) => {
                const ph = ((t - second) * 0.8 + k / 3) % 1;
                const r = 30 + 160 * ph;
                return <path key={k} d={`M ${980 - r} 380 A ${r} ${r} 0 0 1 ${980 + r} 380`} fill="none" stroke={colors.green} strokeWidth={6} opacity={(1 - ph) * 0.8} />;
              })}
          </svg>
        );
      }
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", inset: 0, opacity: icon.opacity, transform: `scale(${icon.scale})`, transformOrigin: "540px 700px" }}>{renderIcon()}</div>
        {p.cards.map((c, i) => {
          const a = pop(frame, fps, sec(times[i] ?? first + i * 1.2, fps));
          const color = c.tone === "red" ? colors.red : c.tone === "green" ? colors.green : c.tone === "yellow" ? colors.yellow : colors.white;
          return (
            <div key={i} style={{ position: "absolute", left: x0 + i * (cw + gap), top: 1020, width: cw, height: 170, borderRadius: 22, background: colors.panel, border: `4px solid ${color}`, opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 8px", boxSizing: "border-box" }}>
              <div style={{ fontFamily: fonts.text, fontWeight: 600, fontSize: 24, letterSpacing: 2, color: colors.dim, textAlign: "center" }}>{c.label}</div>
              <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: Math.min(60, Math.floor((cw - 24) / (0.64 * c.value.length))), lineHeight: 1, color, textAlign: "center" }}>{c.value}</div>
            </div>
          );
        })}
      </Camera>
    </AbsoluteFill>
  );
};
