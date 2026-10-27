import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Line = { side: "me" | "him"; text: string };
type Props = { callTo: string; lines: Line[] };

// Звонок: экран вызова с таймером, реплики всплывают пузырями на каждую фразу. Крик трясёт телефон.
export const Dialogue: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const times = B.bubbleTimes(scene, p.lines.length);
  const callStart = scene.phrases[0]?.start ?? 0.4;
  const elapsed = Math.max(0, t - callStart);
  const timer = `00:${String(Math.floor(elapsed)).padStart(2, "0")}`;
  const phone = pop(frame, fps, 0);
  const shout = p.lines.findIndex((l) => /[!]/.test(l.text) || l.text === l.text.toUpperCase());
  const shoutAt = shout >= 0 ? times[shout] : Infinity;
  const sh = t >= shoutAt && t < shoutAt + 0.3 ? wiggle(frame, 6, 5) : { x: 0, y: 0 };
  const keys = [focusKey(0, 540, 780, 1.0), focusKey(dur, 540, 820, 1.12)];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <div style={{ position: "absolute", left: 240, top: 330, width: 600, height: 860, borderRadius: 70, background: "#111318", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", opacity: phone.opacity, transform: `translate(${sh.x}px, ${sh.y}px) scale(${phone.scale})` }}>
          <div style={{ position: "absolute", inset: 18, borderRadius: 56, background: "#0a0f1e", overflow: "hidden" }}>
            {/* шапка вызова */}
            <div style={{ position: "absolute", top: 40, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 90, height: 90, borderRadius: 45, background: colors.panelLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="54" height="54" viewBox="0 0 90 90">
                  <circle cx="45" cy="32" r="18" fill={colors.dim} />
                  <path d="M12 82 C12 55, 78 55, 78 82 Z" fill={colors.dim} />
                </svg>
              </div>
              <div style={{ fontFamily: fonts.text, fontWeight: 800, fontSize: 36, color: colors.white, marginTop: 12, letterSpacing: 2 }}>{p.callTo}</div>
              <div style={{ fontFamily: fonts.mono, fontSize: 28, color: colors.green, marginTop: 6, letterSpacing: 3 }}>{timer}</div>
            </div>
            {/* пузыри */}
            <div style={{ position: "absolute", top: 250, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {p.lines.map((l, i) => {
                const a = pop(frame, fps, sec(times[i], fps));
                const me = l.side === "me";
                return (
                  <div key={i} style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`, transformOrigin: me ? "right center" : "left center" }}>
                    <div
                      style={{
                        maxWidth: 400,
                        padding: "16px 24px",
                        borderRadius: me ? "24px 24px 6px 24px" : "24px 24px 24px 6px",
                        background: me ? colors.blue : colors.panelLight,
                        color: colors.white,
                        fontFamily: fonts.text,
                        fontWeight: 800,
                        fontSize: l.text.length > 18 ? 30 : 36,
                        lineHeight: 1.15,
                      }}
                    >
                      {l.text}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", width: 88, height: 88, borderRadius: 44, background: colors.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <path d="M8 36 C20 22, 40 22, 52 36 L46 44 C38 36, 22 36, 14 44 Z" fill={colors.white} />
              </svg>
            </div>
          </div>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
