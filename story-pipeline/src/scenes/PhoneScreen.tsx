import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec, wiggle } from "../anim";
import { phoneBatteryDropAt, phoneStatusAt } from "../beats";
import { Camera } from "../components/Camera";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { time: string; battery: number; signal: boolean; callTo: string; callStatus: string; statusAt?: number };

// Экран смартфона: полоски сети мигают и перечёркиваются, вызов с расходящимися кольцами,
// «не отвечает» с тряской телефона, затем процент батареи падает. Камера медленно наезжает.
export const PhoneScreen: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = scene.props as Props;
  const dur = scene.durationFrames / fps;
  const statusAt = phoneStatusAt(scene);
  const callAt = scene.phrases[1]?.start ?? 1.5;
  const dropAt = phoneBatteryDropAt(scene);
  const failed = t >= statusAt;
  const phone = pop(frame, fps, 0);
  const net = pop(frame, fps, 8);
  const call = pop(frame, fps, sec(callAt, fps));
  const st = pop(frame, fps, sec(statusAt, fps));
  const dots = ".".repeat(1 + (Math.floor(frame / 10) % 3));
  const battery = t >= dropAt ? p.battery - 1 : p.battery;
  const low = battery <= 20;
  const shake = t >= statusAt && t < statusAt + 0.25 ? wiggle(frame, 5, 2) : { x: 0, y: 0 };
  const batteryFlash = t >= dropAt && t < dropAt + 0.3 ? 1 : 0;
  // полоски сети мигают, пока не перечёркнуты
  const slashK = interpolate(t, [0.6, 0.9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const barOn = (i: number) => (slashK >= 1 ? 0.35 : 0.3 + 0.7 * (Math.sin(t * 10 + i) > 0 ? 1 : 0));
  const [hh, mm] = p.time.split(":").map(Number);
  const minute = mm + (t >= dropAt ? 1 : 0);
  const timeStr = `${String(hh).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={[{ t: 0, scale: 1 }, { t: statusAt, scale: 1.06, y: -20 }, { t: dur, scale: 1.12, y: -40 }]} origin="540px 740px">
        <div
          style={{
            position: "absolute",
            left: 240,
            top: 330,
            width: 600,
            height: 820,
            borderRadius: 70,
            background: "#111318",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            opacity: phone.opacity,
            transform: `translate(${shake.x}px, ${shake.y}px) scale(${phone.scale})`,
          }}
        >
          <div style={{ position: "absolute", inset: 18, borderRadius: 56, background: "#0a0f1e", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 26, left: 40, fontFamily: fonts.text, fontWeight: 600, fontSize: 34, color: colors.white }}>{timeStr}</div>
            <div style={{ position: "absolute", top: 26, right: 40, display: "flex", alignItems: "center", gap: 12, fontFamily: fonts.text, fontWeight: 800, fontSize: 34, color: low ? colors.red : colors.white, transform: `scale(${1 + 0.25 * batteryFlash})`, transformOrigin: "right center" }}>
              {battery} %
              <svg width="64" height="32" viewBox="0 0 64 32">
                <rect x="2" y="4" width="52" height="24" rx="6" fill="none" stroke={low ? colors.red : colors.white} strokeWidth="4" />
                <rect x="57" y="11" width="5" height="10" rx="2" fill={low ? colors.red : colors.white} />
                <rect x="6" y="8" width={Math.max(4, (44 * battery) / 100)} height="16" rx="3" fill={low ? colors.red : colors.green} />
              </svg>
            </div>
            {/* нет сети */}
            <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: net.opacity, transform: `scale(${net.scale})` }}>
              <svg width="140" height="110" viewBox="0 0 140 110">
                {[0, 1, 2, 3].map((i) => (
                  <rect key={i} x={10 + i * 32} y={80 - i * 22} width={22} height={20 + i * 22} rx={4} fill={colors.dim} opacity={barOn(i)} />
                ))}
                <line x1="8" y1="104" x2={8 + 124 * slashK} y2={104 - 98 * slashK} stroke={colors.red} strokeWidth="10" strokeLinecap="round" />
              </svg>
              <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 96, color: colors.white, letterSpacing: 2, marginTop: 10, opacity: slashK }}>НЕТ СЕТИ</div>
            </div>
            {/* вызов */}
            <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: call.opacity, transform: `translateY(${call.y}px) scale(${call.scale})` }}>
              <div style={{ position: "relative", width: 120, height: 120 }}>
                {!failed &&
                  [0, 1, 2].map((k) => {
                    const ph = ((t - callAt) * 0.9 + k / 3) % 1;
                    return (
                      <div
                        key={k}
                        style={{
                          position: "absolute",
                          left: 60 - 60 * (1 + ph * 1.2),
                          top: 60 - 60 * (1 + ph * 1.2),
                          width: 120 * (1 + ph * 1.2),
                          height: 120 * (1 + ph * 1.2),
                          borderRadius: "50%",
                          border: `3px solid ${colors.green}`,
                          opacity: (1 - ph) * 0.7,
                        }}
                      />
                    );
                  })}
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: colors.panelLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="72" height="72" viewBox="0 0 90 90">
                    <circle cx="45" cy="32" r="18" fill={colors.dim} />
                    <path d="M12 82 C12 55, 78 55, 78 82 Z" fill={colors.dim} />
                  </svg>
                </div>
              </div>
              <div style={{ fontFamily: fonts.text, fontWeight: 800, fontSize: 44, color: colors.white, marginTop: 24, letterSpacing: 2 }}>{p.callTo}</div>
              {failed ? (
                <div style={{ fontFamily: fonts.text, fontWeight: 800, fontSize: 38, color: colors.red, marginTop: 12, letterSpacing: 3, opacity: st.opacity, transform: `scale(${st.scale})` }}>
                  {p.callStatus}
                </div>
              ) : (
                <div style={{ fontFamily: fonts.text, fontWeight: 600, fontSize: 34, color: colors.dim, marginTop: 12, letterSpacing: 3 }}>ВЫЗОВ{dots}</div>
              )}
            </div>
            <div style={{ position: "absolute", bottom: 28, left: "50%", transform: `translateX(-50%) scale(${failed ? 1 + 0.08 * Math.abs(Math.sin(t * 8)) : 1})`, width: 88, height: 88, borderRadius: "50%", background: colors.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
