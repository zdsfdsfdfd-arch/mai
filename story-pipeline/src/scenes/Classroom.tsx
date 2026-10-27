import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { mode: "flash" | "cover"; title?: string; subtitle?: string };

// Класс: доска с формулой, окна, парта, герой. Режим flash: окна белеют, кадр заливает вспышка,
// появляется название. Режим cover: герой падает под парту, окна вылетают осколками.
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

  // вспышка: белый кадр, затем долгое угасание, окна остаются белыми
  let white = 0;
  if (flash && t >= fAt) {
    const d = t - fAt;
    white = d < 0.15 ? 1 : interpolate(d, [0.15, 1.6], [0.75, 0], { extrapolateRight: "clamp" });
  }
  const windowsWhite = flash && t >= fAt ? 1 : 0;
  const title = pop(frame, fps, sec(tAt, fps));
  const sub = pop(frame, fps, sec(tAt + 0.4, fps));
  // падение под парту
  const dropK = flash ? 0 : interpolate(t, [dAt, dAt + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shatterK = flash ? 0 : interpolate(t, [sAt, sAt + 1.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shaking = (flash && t >= fAt && t < fAt + 0.5) || (!flash && t >= sAt && t < sAt + 0.6);
  const w = shaking ? wiggle(frame, 6, 4) : { x: 0, y: 0 };
  const keys = flash
    ? [focusKey(0, 540, 820, 1.0), focusKey(fAt - 0.1, 560, 820, 1.08), focusKey(fAt + 0.2, 560, 800, 1.2), focusKey(dur, 560, 800, 1.25)]
    : [focusKey(0, 520, 900, 1.15), focusKey(dAt + 0.6, 480, 1000, 1.35), focusKey(sAt - 0.2, 480, 1000, 1.35), focusKey(sAt + 0.8, 540, 860, 1.0), focusKey(dur, 540, 860, 1.0)];
  const shards = Array.from({ length: 22 }, (_, i) => ({ x0: 700 + ((i * 53) % 300), y0: 420 + ((i * 97) % 420), vx: -(400 + ((i * 37) % 500)), vy: 100 + ((i * 29) % 300), r: 10 + (i % 4) * 7, rot: (i * 131) % 360 }));

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${w.x}px, ${w.y}px)` }}>
          {/* стена, доска, часы */}
          <div style={{ position: "absolute", left: 0, top: 330, width: 1080, height: 860, background: "#2b3550" }} />
          <div style={{ position: "absolute", left: 90, top: 420, width: 520, height: 330, background: "#1f3b2e", border: "14px solid #5a3a1a", boxSizing: "border-box" }}>
            <div style={{ position: "absolute", left: 30, top: 30, fontFamily: fonts.mono, fontSize: 44, color: "#e9e2c9", opacity: 0.9 }}>y = kx + b</div>
            <div style={{ position: "absolute", left: 30, top: 110, fontFamily: fonts.mono, fontSize: 34, color: "#e9e2c9", opacity: 0.7 }}>k = tg α</div>
            <div style={{ position: "absolute", left: 30, top: 180, fontFamily: fonts.mono, fontSize: 34, color: "#e9e2c9", opacity: 0.5 }}>x₁ … x₂</div>
          </div>
          <div style={{ position: "absolute", left: 300, top: 340, width: 90, height: 90, borderRadius: 45, background: colors.white, border: "6px solid #1a1a1a", boxSizing: "border-box" }}>
            <div style={{ position: "absolute", left: 40, top: 12, width: 4, height: 34, background: "#1a1a1a", transformOrigin: "50% 100%", transform: "rotate(-30deg)" }} />
            <div style={{ position: "absolute", left: 40, top: 24, width: 4, height: 22, background: "#1a1a1a", transformOrigin: "50% 100%", transform: "rotate(120deg)" }} />
          </div>
          {/* окна */}
          {[660, 880].map((wx) => (
            <div key={wx} style={{ position: "absolute", left: wx, top: 400, width: 180, height: 420, background: shatterK > 0.05 ? "#05070d" : `rgb(${150 + 105 * windowsWhite}, ${200 + 55 * windowsWhite}, 255)`, border: "10px solid #3a4668", boxSizing: "border-box", boxShadow: windowsWhite ? "0 0 120px 40px rgba(255,255,255,0.8)" : "none" }}>
              <div style={{ position: "absolute", left: 76, top: 0, width: 8, height: 400, background: "#3a4668" }} />
              <div style={{ position: "absolute", left: 0, top: 196, width: 160, height: 8, background: "#3a4668" }} />
            </div>
          ))}
          {/* задние парты */}
          {[0, 1].map((i) => (
            <div key={i} style={{ position: "absolute", left: 640 + i * 60, top: 900 + i * 60, width: 300, height: 26, background: "#8a5a2a", borderRadius: 6, opacity: 0.8 }} />
          ))}
          {/* герой за партой */}
          <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${260 * dropK}px)` }}>
            <Character pose={dropK > 0.6 ? "cover" : "sit"} frame={frame} fps={fps} x={300} y={640} scale={0.95} talkAt={flash ? talkAt : []} />
          </div>
          {/* передняя парта */}
          <div style={{ position: "absolute", left: 250, top: 1000, width: 480, height: 36, background: "#a06a32", borderRadius: 8 }} />
          <div style={{ position: "absolute", left: 270, top: 1036, width: 24, height: 160, background: "#5a3a1a" }} />
          <div style={{ position: "absolute", left: 686, top: 1036, width: 24, height: 160, background: "#5a3a1a" }} />
          <div style={{ position: "absolute", left: 250, top: 1036, width: 480, height: 150, background: "#3a4668", opacity: dropK > 0.6 ? 0.0 : 0 }} />
          <div style={{ position: "absolute", left: 0, top: 1190, width: 1080, height: 110, background: "#1b1f2e" }} />
          {/* осколки */}
          {shatterK > 0 && (
            <svg width={1080} height={1920} style={{ position: "absolute" }}>
              {shards.map((s, i) => {
                const k = shatterK;
                const x = s.x0 + s.vx * k;
                const y = s.y0 + s.vy * k + 300 * k * k;
                return <polygon key={i} points={`${x},${y} ${x + s.r},${y + s.r * 0.6} ${x - s.r * 0.4},${y + s.r}`} fill="#cfe3ff" opacity={0.9 * (1 - k * 0.6)} transform={`rotate(${s.rot + k * 400} ${x} ${y})`} />;
              })}
            </svg>
          )}
        </div>
      </Camera>
      {/* заливка вспышки */}
      <AbsoluteFill style={{ background: "#fff8e6", opacity: white, pointerEvents: "none" }} />
      {flash && (
        <>
          <div style={{ position: "absolute", top: 600, left: 0, right: 0, textAlign: "center", fontFamily: fonts.display, fontWeight: 900, fontSize: 196, lineHeight: 1, letterSpacing: 4, color: colors.white, WebkitTextStroke: "5px #07090f", paintOrder: "stroke fill", textShadow: "0 16px 40px rgba(0,0,0,0.7)", opacity: title.opacity, transform: `scale(${title.scale})` }}>
            {p.title}
          </div>
          <div style={{ position: "absolute", top: 820, left: 0, right: 0, textAlign: "center", fontFamily: fonts.mono, fontSize: 36, letterSpacing: 8, color: colors.yellow, opacity: sub.opacity, transform: `scale(${sub.scale})` }}>
            {p.subtitle}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
