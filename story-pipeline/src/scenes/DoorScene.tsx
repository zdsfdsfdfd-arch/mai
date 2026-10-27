import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Heart, Sheep } from "../components/Sheep";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

// Лестничная площадка 8-го этажа. Герой стучит, дверь открывается, в проёме сосед в халате,
// из-за его ног выглядывает Зина с бантиком. Вторая сцена: крупно Зина, бантик, прищур.
export const DoorScene: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const knocking = scene.character?.pose === "knock";
  const talkAt = scene.phrases.map((p) => p.start);

  // s05: стук → дверь → сосед → Зина → сердце. s06: всё уже открыто, крупно Зина.
  const knocks = knocking ? B.doorKnockTimes(scene) : [];
  const openAt = knocking ? B.doorOpenAt(scene) : -1;
  const zinaAt = knocking ? B.zinaPeekAt(scene) : -1;
  const heartAt = knocking ? B.halfYearAt(scene) : -1;
  const bowAt = knocking ? zinaAt : B.bowAt(scene);
  const squintAt = knocking ? Infinity : B.squintAt(scene);

  const openK = interpolate(t, [openAt, openAt + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const doorScale = 1 - 0.88 * openK; // дверь уходит в перспективу (поворот вокруг левого края)
  const neighborK = interpolate(t, [openAt + 0.3, openAt + 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zinaK = interpolate(t, [zinaAt, zinaAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const heart = pop(frame, fps, sec(heartAt, fps));
  const bow = pop(frame, fps, sec(bowAt, fps));
  let shake = 0;
  for (const k of knocks) {
    const d = frame - sec(k, fps);
    if (d >= 0 && d <= 5) shake = Math.max(shake, interpolate(d, [0, 5], [1, 0]));
  }
  const w = wiggle(frame, 4 * shake, 7);
  const sheepState = t >= squintAt ? "squint" : "idle";

  const keys = knocking
    ? [focusKey(0, 540, 820, 1.0), focusKey(scene.phrases[1]?.start ?? 2.4, 640, 820, 1.2), focusKey(openAt + 0.8, 640, 820, 1.2), focusKey(zinaAt + 0.4, 700, 1010, 1.7), focusKey(dur, 700, 1010, 1.75)]
    : [focusKey(0, 700, 1010, 1.6), focusKey(squintAt, 720, 1000, 2.1), focusKey(dur, 720, 1000, 2.25)];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${w.x}px, ${w.y}px)` }}>
          {/* стена площадки и пол */}
          <div style={{ position: "absolute", left: 0, top: 330, width: 1080, height: 850, background: colors.panel }} />
          <div style={{ position: "absolute", left: 0, top: 330, width: 1080, height: 40, background: colors.panelLight, opacity: 0.4 }} />
          <div style={{ position: "absolute", left: 0, top: 1180, width: 1080, height: 120, background: "#0a0e1a" }} />
          {/* лампочка */}
          <div style={{ position: "absolute", left: 520, top: 345, width: 40, height: 14, borderRadius: 7, background: colors.lightCone, opacity: 0.8 + 0.2 * Math.sin(t * 9), boxShadow: "0 0 60px 20px rgba(247,231,176,0.18)" }} />
          {/* проём и дверь */}
          <div style={{ position: "absolute", left: 560, top: 430, width: 300, height: 750, background: "#06080f" }} />
          {/* сосед в проёме */}
          {neighborK > 0 && (
            <div style={{ position: "absolute", left: 0, top: 0, opacity: neighborK }}>
              <Character pose="stand" outfit="robe" mustache frame={frame} fps={fps} x={600} y={600} scale={1.0} flip talkAt={t >= openAt ? talkAt : []} />
            </div>
          )}
          {/* Зина выглядывает из-за ног */}
          {(zinaK > 0 || !knocking) && (
            <Sheep frame={frame} fps={fps} x={640 + 60 * (knocking ? zinaK : 1)} y={1020} scale={0.75} bow bowOpacity={bow.opacity} state={sheepState} />
          )}
          {/* дверное полотно, уходит в перспективу при открытии */}
          <div style={{ position: "absolute", left: 560, top: 430, width: 300, height: 750, background: colors.door, transformOrigin: "left center", transform: `scaleX(${knocking ? doorScale : 0.12})`, boxShadow: "inset 0 0 0 10px rgba(0,0,0,0.25)" }}>
            <div style={{ position: "absolute", left: 110, top: 60, width: 80, height: 50, background: colors.beige, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 34, color: colors.beigeInk }}>8</div>
            <div style={{ position: "absolute", left: 40, top: 380, width: 24, height: 24, borderRadius: 12, background: colors.beige }} />
            <div style={{ position: "absolute", left: 120, top: 420, width: 60, height: 60, borderRadius: 30, background: "#2b1a0c", opacity: 0.6 }} />
          </div>
          {/* коврик */}
          <div style={{ position: "absolute", left: 600, top: 1150, width: 220, height: 40, borderRadius: 8, background: "#3b2a1a" }} />
          {/* герой */}
          {knocking && <Character pose="knock" frame={frame} fps={fps} knockAt={knocks} x={210} y={600} scale={1.05} />}
          {!knocking && <Character pose="stand" frame={frame} fps={fps} x={180} y={600} scale={1.05} talkAt={talkAt} />}
          {/* кольца от ударов */}
          {knocks.map((k, i) => {
            const d = frame - sec(k, fps);
            if (d < 0 || d > 12) return null;
            const r = interpolate(d, [0, 12], [12, 80]);
            const o = interpolate(d, [0, 12], [0.9, 0]);
            return (
              <svg key={i} width={1080} height={1920} style={{ position: "absolute" }}>
                <circle cx={600} cy={880} r={r} fill="none" stroke={colors.yellow} strokeWidth={8} opacity={o} />
              </svg>
            );
          })}
          {/* сердце над соседом */}
          {knocking && <Heart x={700} y={520 - heart.y} size={70} opacity={heart.opacity} />}
          {/* прищур: тонкие линии «взгляда» */}
          {t >= squintAt && (
            <svg width={1080} height={1920} style={{ position: "absolute" }}>
              <line x1={830} y1={1060} x2={520} y2={760} stroke={colors.red} strokeWidth={3} strokeDasharray="10 12" opacity={0.6 + 0.3 * Math.sin(t * 6)} />
            </svg>
          )}
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
