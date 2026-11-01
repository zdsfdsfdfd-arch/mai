import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import { cardPhraseTimes } from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, Burst, Card, Glow, Puff, Shake } from "../components/Fx";
import { Enter, Float } from "../components/Motion";
import { colors, fonts, ink, stroke } from "../theme";
import type { SceneTimeline } from "../types";

type CardSpec = { label: string; value: string; tone?: "red" | "green" | "yellow" };
type Props = { icon: "eye" | "decon" | "iodine" | "radio"; cards: CardSpec[]; cardPhrases?: number[] };

const spotColor: Record<Props["icon"], string> = { eye: "#f3c03a", decon: "#3f8cff", iodine: "#e5392f", radio: "#3ec66d" };

// Факт-карточки с крупной иконкой: глаз и вспышка, дезактивация (куртка улетает в пакет),
// йод (щит с перечёркнутым I), радио (телефон без сети, приёмник с волнами). Карточки-стикеры по фразам.
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
  const gap = n > 3 ? 18 : 24;
  const x0 = (1080 - (n * cw + (n - 1) * gap)) / 2;
  const keys = [focusKey(0, 540, 680, 1.22), focusKey(first - 0.3, 540, 700, 1.22), focusKey(first + 0.4, 540, 830, 1.0), focusKey(dur, 540, 850, 1.0)];
  const talkAt = scene.phrases.map((x) => x.start);

  const renderIcon = () => {
    switch (p.icon) {
      case "eye": {
        const closeK = interpolate(t, [first, first + 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const burst = interpolate(t, [first - 0.3, first + 0.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <>
            <Glow x={200} y={620} r={260} opacity={0.9} />
            <Burst x={200} y={620} k={burst} n={14} r0={70} r1={420} color="#fff8e6" width={8} />
            <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <line key={i} x1={200 + 60 * Math.cos((i * Math.PI) / 4 + t)} y1={620 + 60 * Math.sin((i * Math.PI) / 4 + t)} x2={200 + 100 * Math.cos((i * Math.PI) / 4 + t)} y2={620 + 100 * Math.sin((i * Math.PI) / 4 + t)} stroke={colors.yellow} strokeWidth={10} strokeLinecap="round" />
              ))}
              <circle cx={200} cy={620} r={48} fill="#fff8e6" {...stroke} strokeWidth={5} />
              {/* лучи к глазу */}
              <line x1={260} y1={620} x2={530} y2={620} stroke={colors.yellow} strokeWidth={7} strokeDasharray="16 14" strokeDashoffset={-frame * 3} opacity={0.85} />
              {/* глаз */}
              <path d="M550 620 Q700 470 850 620 Q700 770 550 620 Z" fill={colors.white} {...stroke} />
              <circle cx={700} cy={620} r={56} fill="#3a7bd5" stroke={ink} strokeWidth={5} />
              <circle cx={700} cy={620} r={40} fill="#2a5aa8" />
              <circle cx={700} cy={620} r={26} fill={ink} />
              <circle cx={684} cy={602} r={9} fill={colors.white} />
              {/* веко */}
              <path d={`M550 620 Q700 ${470 + 300 * closeK} 850 620 Q700 470 550 620 Z`} fill={colors.skin} stroke={ink} strokeWidth={closeK > 0 ? 5 : 0} />
              <path d="M550 620 Q700 470 850 620" fill="none" stroke={ink} strokeWidth={9} strokeLinecap="round" />
              {[0, 1, 2].map((i) => (
                <line key={i} x1={600 + i * 100} y1={505 + Math.abs(i - 1) * 30} x2={590 + i * 100} y2={470 + Math.abs(i - 1) * 30} stroke={ink} strokeWidth={6} strokeLinecap="round" />
              ))}
            </svg>
          </>
        );
      }
      case "decon": {
        const off = t >= first;
        const flyK = interpolate(t, [first, first + 0.7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (k) => 1 - Math.pow(1 - k, 2) });
        const dustK = interpolate(t, [first, first + 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const jx = 470 + (640 - 470) * flyK;
        const jy = 560 - 260 * Math.sin(flyK * Math.PI) + (1070 - 560) * flyK;
        return (
          <>
            <Character pose="stand" outfit={off ? "shirt" : "jacket"} frame={frame} fps={fps} x={390} y={400} scale={0.95} talkAt={talkAt} />
            {dustK > 0 && dustK < 1 && (
              <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
                {Array.from({ length: 34 }, (_, i) => {
                  const ang = ((i * 37) % 360) * (Math.PI / 180);
                  const r = 60 + 460 * dustK * (0.5 + ((i * 13) % 10) / 20);
                  return <circle key={i} cx={540 + Math.cos(ang) * r} cy={700 + Math.sin(ang) * r * 0.7} r={5 + (i % 3) * 2} fill="#9a8f7a" stroke={ink} strokeWidth={2} opacity={1 - dustK} />;
                })}
              </svg>
            )}
            {/* пакет */}
            {off && (
              <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
                <path d="M640 1060 L760 1060 L772 1190 Q772 1204 758 1204 L642 1204 Q628 1204 628 1190 Z" fill="#2a3458" {...stroke} />
                <path d="M672 1060 Q700 1010 728 1060" fill="none" stroke={ink} strokeWidth={6} />
                <path d="M690 1100 L710 1100" stroke={colors.white} strokeWidth={4} opacity={0.4} />
              </svg>
            )}
            {/* куртка летит */}
            {flyK > 0 && flyK < 1 && (
              <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
                <g transform={`translate(${jx} ${jy}) rotate(${flyK * 520}) scale(${1 - flyK * 0.5})`}>
                  <rect x={-60} y={-70} width={120} height={140} rx={30} fill="#2f4a8f" {...stroke} />
                  <polygon points="-20,-70 20,-70 0,-30" fill="#e3dfd4" stroke={ink} strokeWidth={4} />
                  <rect x={-100} y={-62} width={44} height={110} rx={22} fill="#2f4a8f" {...stroke} transform="rotate(20 -78 -62)" />
                  <rect x={56} y={-62} width={44} height={110} rx={22} fill="#2f4a8f" {...stroke} transform="rotate(-20 78 -62)" />
                </g>
              </svg>
            )}
            {flyK >= 0.96 && <Puff x={700} y={1080} k={interpolate(t, [first + 0.68, first + 1.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} r={44} />}
          </>
        );
      }
      case "iodine": {
        const slashK = interpolate(t, [first + 0.3, first + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <Shake at={first + 0.3} amp={10} dur={0.4}>
            <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
              <path d="M540 410 L750 495 L750 700 Q750 870 540 950 Q330 870 330 700 L330 495 Z" fill="#2a3458" {...stroke} strokeWidth={9} />
              <path d="M540 450 L710 520 L710 700 Q710 830 540 905 L540 450 Z" fill="#3a4a78" opacity={0.6} />
              <text x={540} y={770} textAnchor="middle" fontFamily={fonts.display} fontWeight={900} fontSize={270} fill={colors.white} stroke={ink} strokeWidth={8} paintOrder="stroke">I</text>
              <line x1={370} y1={470} x2={370 + 340 * slashK} y2={470 + 440 * slashK} stroke={ink} strokeWidth={34} strokeLinecap="round" />
              <line x1={370} y1={470} x2={370 + 340 * slashK} y2={470 + 440 * slashK} stroke={colors.red} strokeWidth={22} strokeLinecap="round" />
              {/* таблетка */}
              <g transform="rotate(-20 180 850)">
                <rect x={110} y={820} width={140} height={64} rx={32} fill={colors.white} {...stroke} />
                <path d="M142 820 L180 820 L180 884 L142 884 Q110 884 110 852 Q110 820 142 820 Z" fill={colors.yellow} />
                <rect x={110} y={820} width={140} height={64} rx={32} fill="none" {...stroke} />
              </g>
              {/* щитовидка */}
              <path d="M860 760 C900 715, 965 740, 955 800 C950 835, 905 855, 882 866 C860 855, 812 835, 808 800 C800 740, 860 715, 860 760 Z" fill="#e58aa0" {...stroke} />
              <path d="M882 740 L882 866" stroke={ink} strokeWidth={4} opacity={0.5} />
            </svg>
          </Shake>
        );
      }
      case "radio": {
        const second = times[1] ?? first + 1.5;
        const radioOn = t >= second;
        return (
          <>
            {radioOn && <Glow x={830} y={660} r={120} color={colors.green} opacity={0.5 + 0.3 * Math.abs(Math.sin(t * 4))} />}
            <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
              {/* телефон */}
              <g transform="rotate(-6 260 680)">
                <rect x={150} y={470} width={230} height={420} rx={34} fill="#1a1d28" {...stroke} />
                <rect x={166} y={496} width={198} height={368} rx={22} fill="#0a0f1e" stroke={ink} strokeWidth={4} />
                <rect x={230} y={480} width={70} height={10} rx={5} fill="#2a2f3c" />
                {[0, 1, 2, 3].map((i) => (
                  <rect key={i} x={205 + i * 34} y={660 - i * 20} width={24} height={22 + i * 20} rx={4} fill={colors.dim} opacity={0.45} />
                ))}
                <line x1={200} y1={700} x2={350} y2={560} stroke={colors.red} strokeWidth={12} strokeLinecap="round" />
                <text x={265} y={790} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fill={colors.red} letterSpacing={3}>НЕТ СЕТИ</text>
              </g>
              {/* приёмник */}
              <rect x={560} y={560} width={390} height={300} rx={28} fill={radioOn ? "#3e4b78" : "#262d4a"} {...stroke} />
              <rect x={580} y={580} width={350} height={30} rx={8} fill="#1a1f33" stroke={ink} strokeWidth={3} />
              <circle cx={660} cy={720} r={74} fill="#0a0d1a" {...stroke} strokeWidth={5} />
              {Array.from({ length: 12 }, (_, i) => (
                <circle key={i} cx={660 + Math.cos((i * Math.PI) / 6) * 44} cy={720 + Math.sin((i * Math.PI) / 6) * 44} r={7} fill={colors.dim} opacity={radioOn ? 0.5 + 0.5 * Math.abs(Math.sin(t * 9 + i)) : 0.5} />
              ))}
              <circle cx={660} cy={720} r={14} fill={colors.dim} />
              <rect x={760} y={640} width={160} height={44} rx={10} fill="#0a0d1a" stroke={ink} strokeWidth={4} />
              <rect x={770} y={650} width={140 * (radioOn ? 0.3 + 0.7 * Math.abs(Math.sin(t * 3)) : 0.15)} height={24} rx={5} fill={radioOn ? colors.green : colors.dim} />
              <circle cx={800} cy={760} r={30} fill={colors.red} {...stroke} strokeWidth={5} />
              <circle cx={880} cy={760} r={30} fill={colors.yellow} {...stroke} strokeWidth={5} />
              <line x1={820} y1={720} x2={820 + 16 * Math.cos(-0.5 + (radioOn ? 0.5 : 0))} y2={720 + 16 * Math.sin(-0.5)} stroke={ink} strokeWidth={4} />
              <line x1={890} y1={560} x2={990} y2={380} stroke={ink} strokeWidth={14} strokeLinecap="round" />
              <line x1={890} y1={560} x2={990} y2={380} stroke={colors.white} strokeWidth={7} strokeLinecap="round" />
              <circle cx={990} cy={380} r={10} fill={colors.white} stroke={ink} strokeWidth={4} />
              {radioOn &&
                [0, 1, 2].map((k) => {
                  const ph = ((t - second) * 0.8 + k / 3) % 1;
                  const r = 34 + 170 * ph;
                  return <path key={k} d={`M ${990 - r} 380 A ${r} ${r} 0 0 1 ${990 + r} 380`} fill="none" stroke={colors.green} strokeWidth={8} strokeLinecap="round" opacity={(1 - ph) * 0.9} />;
                })}
            </svg>
          </>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Backdrop variant="navy" spot={{ x: 540, y: 660, color: spotColor[p.icon], opacity: 0.28 }}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", inset: 0, opacity: icon.opacity, transform: `scale(${icon.scale})`, transformOrigin: "540px 700px" }}>
          <Float amp={p.icon === "decon" ? 0 : 6} rot={p.icon === "decon" ? 0 : 1} origin="540px 700px">{renderIcon()}</Float>
        </div>
        {p.cards.map((c, i) => {
          const color = c.tone === "red" ? colors.red : c.tone === "green" ? colors.green : c.tone === "yellow" ? colors.yellow : colors.white;
          const rot = (i % 2 === 0 ? -1.5 : 1.5) * (n > 3 ? 1 : 1.4);
          return (
            <Enter key={i} at={times[i] ?? first + i * 1.2} from="up" dist={220} rotate={i % 2 ? 10 : -10} origin={`${x0 + i * (cw + gap) + cw / 2}px 1100px`}>
            <div style={{ position: "absolute", left: x0 + i * (cw + gap), top: 1020, width: cw, height: 176, transform: `rotate(${rot}deg)` }}>
              <Card x={0} y={0} w={cw} h={176} color={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 8px 0" }}>
                <div style={{ fontFamily: fonts.text, fontWeight: 700, fontSize: 23, letterSpacing: 2, color: colors.dim, textAlign: "center" }}>{c.label}</div>
                <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: Math.min(62, Math.floor((cw - 28) / (0.64 * c.value.length))), lineHeight: 1, color, textAlign: "center", WebkitTextStroke: `2px ${ink}`, paintOrder: "stroke fill" }}>{c.value}</div>
              </Card>
            </div>
            </Enter>
          );
        })}
      </Camera>
    </Backdrop>
  );
};
