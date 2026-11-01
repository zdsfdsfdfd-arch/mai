import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, stamp, wiggle } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, BigText, Burst, Glow, Puff } from "../components/Fx";
import { Enter } from "../components/Motion";
import { colors, fonts, ink, stroke } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { mode: "flash" | "cover"; title?: string; subtitle?: string };

// Класс: доска в раме, часы, окна с небом, парты, герой. Режим flash: окна белеют, лучи, длинные тени,
// заголовок впечатывается. Режим cover: герой падает под парту, окна вылетают осколками с тряской.
export const Classroom: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const flash = p.mode === "flash";
  const fAt = flash ? B.flashAt(scene) : -1;
  const tAt = flash ? B.titleAt(scene) : Infinity;
  const dAt = flash ? Infinity : B.dropAt(scene);
  const sAt = flash ? Infinity : B.shatterAt(scene);
  const talkAt = scene.phrases.map((x) => x.start);

  let white = 0;
  if (flash && t >= fAt) {
    const d = t - fAt;
    white = d < 0.1 ? 1 : interpolate(d, [0.1, 0.55], [0.75, 0], { extrapolateRight: "clamp", easing: (k) => k * k });
  }
  const lit = flash && t >= fAt ? interpolate(t - fAt, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const title = stamp(frame, fps, sec(tAt, fps));
  const dropK = flash ? 0 : interpolate(t, [dAt, dAt + 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (k) => k * k });
  const landK = flash ? 0 : interpolate(t, [dAt + 0.35, dAt + 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shatterK = flash ? 0 : interpolate(t, [sAt, sAt + 1.3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shaking = (flash && t >= fAt && t < fAt + 0.6) || (!flash && t >= sAt && t < sAt + 0.7);
  const shakeAmp = flash ? 7 : 14;
  const w = shaking ? wiggle(frame, shakeAmp, 4) : { x: 0, y: 0 };
  const keys = flash
    ? [focusKey(0, 540, 820, 1.0), focusKey(fAt - 0.1, 600, 760, 1.1), focusKey(fAt + 0.15, 600, 660, 1.22), focusKey(dur, 580, 650, 1.26)]
    : [focusKey(0, 520, 900, 1.15), focusKey(dAt + 0.5, 470, 1010, 1.4), focusKey(sAt - 0.2, 470, 1010, 1.4), focusKey(sAt + 0.7, 560, 860, 1.0), focusKey(dur, 560, 860, 1.02)];
  const shards = Array.from({ length: 26 }, (_, i) => ({ x0: 690 + ((i * 53) % 340), y0: 430 + ((i * 97) % 380), vx: -(420 + ((i * 37) % 560)), vy: 60 + ((i * 29) % 320), r: 12 + (i % 4) * 8, rot: (i * 131) % 360 }));
  const sky = flash ? `rgb(${127 + 128 * lit}, ${179 + 76 * lit}, 255)` : "#7fb3ff";
  const flashBurst = flash ? interpolate(t, [fAt, fAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  const shatterBurst = flash ? 0 : interpolate(t, [sAt, sAt + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Backdrop variant="room" grid={false} particles={false}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${w.x}px, ${w.y}px)` }}>
          <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
            {/* пол и плинтус */}
            <rect x={-200} y={1190} width={1480} height={800} fill="#1a1f36" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line key={i} x1={-200} y1={1230 + i * 70} x2={1280} y2={1230 + i * 70} stroke={colors.white} strokeWidth={2} opacity={0.07} />
            ))}
            <rect x={-200} y={1176} width={1480} height={22} fill="#141a2c" stroke={ink} strokeWidth={5} />
            {/* доска в раме */}
            <rect x={78} y={392} width={566} height={376} rx={10} fill="#6b4420" {...stroke} />
            <rect x={104} y={416} width={514} height={316} rx={6} fill="#1f3b2e" stroke={ink} strokeWidth={4} />
            <rect x={104} y={416} width={514} height={316} rx={6} fill="url(#boardShade)" opacity={0.25} />
            <defs>
              <linearGradient id="boardShade" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#000000" />
              </linearGradient>
              <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={sky} />
                <stop offset="1" stopColor="#cfe3ff" />
              </linearGradient>
            </defs>
            <g fontFamily={fonts.mono} fill="#e9e2c9" transform="rotate(-1 360 560)">
              <text x={134} y={486} fontSize={44} opacity={0.92}>y = kx + b</text>
              <text x={134} y={560} fontSize={34} opacity={0.7}>k = tg α</text>
              <text x={134} y={626} fontSize={34} opacity={0.5}>x₁ … x₂</text>
              <path d="M430 470 L560 560 L430 560 Z" fill="none" stroke="#e9e2c9" strokeWidth={3} opacity={0.5} />
              <text x={470} y={600} fontSize={26} opacity={0.5}>α</text>
            </g>
            <rect x={96} y={760} width={530} height={18} rx={6} fill="#8a5a2a" stroke={ink} strokeWidth={4} />
            <rect x={150} y={748} width={44} height={12} rx={4} fill={colors.white} stroke={ink} strokeWidth={3} />
            <rect x={210} y={748} width={30} height={12} rx={4} fill={colors.yellow} stroke={ink} strokeWidth={3} />
            {/* часы */}
            <g transform="translate(345 322)">
              <circle cx={0} cy={0} r={46} fill={colors.white} {...stroke} />
              {[0, 1, 2, 3].map((i) => (
                <circle key={i} cx={Math.cos((i * Math.PI) / 2) * 34} cy={Math.sin((i * Math.PI) / 2) * 34} r={3} fill={ink} />
              ))}
              <line x1={0} y1={0} x2={0} y2={-26} stroke={ink} strokeWidth={5} strokeLinecap="round" transform="rotate(-30)" />
              <line x1={0} y1={0} x2={0} y2={-18} stroke={ink} strokeWidth={5} strokeLinecap="round" transform="rotate(120)" />
              <line x1={0} y1={6} x2={0} y2={-36} stroke={colors.red} strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${(t * 6 + 40) % 360})`} />
              <circle cx={0} cy={0} r={4} fill={colors.red} />
            </g>
            {/* окна */}
            {[660, 880].map((wx, wi) => (
              <g key={wx}>
                <rect x={wx - 8} y={392} width={196} height={436} rx={8} fill="#3a4668" {...stroke} />
                <rect x={wx} y={400} width={180} height={420} fill={shatterK > 0.05 ? "#05070d" : "url(#skyG)"} stroke={ink} strokeWidth={4} />
                {shatterK <= 0.05 && (
                  <g>
                    <ellipse cx={wx + 50 + wi * 60} cy={470} rx={38} ry={16} fill={colors.white} opacity={0.8 - 0.8 * lit} />
                    <ellipse cx={wx + 72 + wi * 60} cy={462} rx={28} ry={18} fill={colors.white} opacity={0.8 - 0.8 * lit} />
                    <rect x={wx + 20 + wi * 30} y={660} width={60} height={160} fill="#5f79b8" opacity={0.7 - 0.7 * lit} />
                    <rect x={wx + 100 - wi * 20} y={700} width={46} height={120} fill="#4f67a0" opacity={0.7 - 0.7 * lit} />
                  </g>
                )}
                {shatterK > 0.05 && (
                  <g stroke="#cfe3ff" strokeWidth={3} opacity={0.6}>
                    <path d={`M${wx + 30} 400 L${wx + 90} 560 L${wx + 40} 700`} fill="none" />
                    <path d={`M${wx + 180} 480 L${wx + 110} 600 L${wx + 150} 820`} fill="none" />
                  </g>
                )}
                <rect x={wx + 84} y={400} width={12} height={420} fill="#3a4668" stroke={ink} strokeWidth={3} />
                <rect x={wx} y={602} width={180} height={12} fill="#3a4668" stroke={ink} strokeWidth={3} />
                <rect x={wx - 16} y={826} width={212} height={16} rx={4} fill="#4a567a" {...stroke} strokeWidth={4} />
              </g>
            ))}
            {/* задние парты */}
            {[0, 1].map((i) => (
              <g key={i}>
                <rect x={650 + i * 70} y={905 + i * 55} width={300} height={28} rx={8} fill="#9a6230" {...stroke} strokeWidth={5} />
                <rect x={670 + i * 70} y={933 + i * 55} width={16} height={120} fill="#5a3a1a" stroke={ink} strokeWidth={4} />
                <rect x={914 + i * 70} y={933 + i * 55} width={16} height={120} fill="#5a3a1a" stroke={ink} strokeWidth={4} />
              </g>
            ))}
            {/* пылинки в свете из окон */}
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={560 + ((i * 97) % 500) + Math.sin(t * 0.8 + i) * 14} cy={420 + ((i * 61) % 700) + Math.sin(t * 0.5 + i * 2) * 10} r={1.5 + (i % 3)} fill={colors.white} opacity={0.12 + 0.12 * Math.abs(Math.sin(t + i))} />
            ))}
            {/* длинные тени при вспышке */}
            {lit > 0 && (
              <g opacity={0.5 * lit}>
                <polygon points="250,1040 730,1040 480,1190 -100,1190" fill={ink} />
                <polygon points="320,1000 420,1000 240,1190 60,1190" fill={ink} />
              </g>
            )}
          </svg>
          {/* стул и герой */}
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <rect x={240} y={930} width={130} height={30} rx={8} fill="#3a4668" {...stroke} strokeWidth={5} />
            <rect x={246} y={960} width={14} height={230} fill="#2a3458" stroke={ink} strokeWidth={4} />
          </svg>
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${250 * dropK}px)` }}>
            <Character pose={dropK > 0.55 ? "cover" : "sit"} frame={frame} fps={fps} x={300} y={620} scale={0.96} talkAt={flash ? talkAt : []} mood={flash ? "neutral" : "scared"} shadow={false} flinchAt={flash ? [fAt] : [dAt - 0.1]} lookAt={flash && t >= fAt ? [1, -0.5] : [0.3, 0.1]} squash={landK > 0 && landK < 0.5 ? Math.sin(landK * 2 * Math.PI) * 0.6 : 0} />
          </div>
          <Puff x={360} y={1180} k={landK} r={60} />
          {/* передняя парта */}
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <rect x={250} y={996} width={480} height={40} rx={10} fill="#b4753a" {...stroke} />
            <rect x={250} y={1030} width={480} height={22} fill="#8a5a2a" stroke={ink} strokeWidth={4} />
            <rect x={272} y={1052} width={26} height={144} fill="#5a3a1a" {...stroke} strokeWidth={5} />
            <rect x={682} y={1052} width={26} height={144} fill="#5a3a1a" {...stroke} strokeWidth={5} />
            <rect x={300} y={1052} width={380} height={20} fill="#6b4420" stroke={ink} strokeWidth={4} />
            <g transform="rotate(-6 560 985)">
              <rect x={500} y={968} width={120} height={34} rx={5} fill={colors.red} {...stroke} strokeWidth={5} />
              <rect x={500} y={960} width={120} height={14} rx={4} fill={colors.white} stroke={ink} strokeWidth={4} />
            </g>
            <line x1={330} y1={990} x2={430} y2={978} stroke={colors.yellow} strokeWidth={9} strokeLinecap="round" />
            <line x1={330} y1={990} x2={430} y2={978} stroke={ink} strokeWidth={3} opacity={0.5} />
          </svg>
          {/* осколки */}
          {shatterK > 0 && (
            <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
              {shards.map((s, i) => {
                const k = shatterK;
                const x = s.x0 + s.vx * k;
                const y = s.y0 + s.vy * k + 420 * k * k;
                const tx = s.x0 + s.vx * Math.max(0, k - 0.08);
                const ty = s.y0 + s.vy * Math.max(0, k - 0.08) + 420 * Math.max(0, k - 0.08) ** 2;
                return (
                  <g key={i} opacity={0.95 * (1 - k * 0.5)}>
                    <line x1={tx} y1={ty} x2={x} y2={y} stroke="#cfe3ff" strokeWidth={4} opacity={0.5} />
                    <polygon points={`${x},${y} ${x + s.r},${y + s.r * 0.6} ${x - s.r * 0.4},${y + s.r}`} fill="#dbeeff" stroke={ink} strokeWidth={3} strokeLinejoin="round" transform={`rotate(${s.rot + k * 420} ${x} ${y})`} />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        {flash && <Glow x={850} y={610} r={520} opacity={lit * 0.9} />}
        {flash && <Burst x={850} y={610} k={flashBurst} n={18} r0={120} r1={900} color="#fff8e6" width={10} />}
        {!flash && <Burst x={750} y={600} k={shatterBurst} n={12} r0={60} r1={500} color="#cfe3ff" width={6} />}
      </Camera>
      <AbsoluteFill style={{ background: "#fff8e6", opacity: white, pointerEvents: "none" }} />
      {!flash && <AbsoluteFill style={{ background: colors.red, opacity: shatterBurst > 0 && shatterBurst < 1 ? 0.25 * (1 - shatterBurst) : 0, pointerEvents: "none" }} />}
      {flash && (
        <>
          <BigText text={p.title ?? ""} y={540} size={210} rotate={-3} opacity={title.opacity} scale={title.scale} />
          <Enter at={tAt + 0.35} from="up" dist={90} rotate={-6}>
            <div style={{ position: "absolute", top: 668, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 34, letterSpacing: 8, color: colors.white, background: colors.red, border: `4px solid ${ink}`, boxShadow: `6px 6px 0 ${ink}`, padding: "10px 28px", borderRadius: 10, transform: "rotate(-1.5deg)" }}>{p.subtitle}</div>
            </div>
          </Enter>
        </>
      )}
    </Backdrop>
  );
};
