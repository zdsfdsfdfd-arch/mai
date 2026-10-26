import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { time: string; battery: number; signal: boolean; callTo: string; callStatus: string; statusAt?: number };

// Экран смартфона: время, батарея, «нет сети», неотвеченный вызов.
export const PhoneScreen: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = scene.props as Props;
  const statusAt = (p.statusAt ?? 2.6) * fps;
  const failed = frame >= statusAt;
  const phone = pop(frame, fps, 0);
  const net = pop(frame, fps, 8);
  const st = pop(frame, fps, statusAt);
  const dots = ".".repeat(1 + (Math.floor(frame / 10) % 3));
  const low = p.battery <= 20;

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
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
          transform: `scale(${phone.scale})`,
        }}
      >
        <div style={{ position: "absolute", inset: 18, borderRadius: 56, background: "#0a0f1e", overflow: "hidden" }}>
          {/* статус-бар */}
          <div style={{ position: "absolute", top: 26, left: 40, fontFamily: fonts.text, fontWeight: 600, fontSize: 34, color: colors.white }}>{p.time}</div>
          <div style={{ position: "absolute", top: 26, right: 40, display: "flex", alignItems: "center", gap: 12, fontFamily: fonts.text, fontWeight: 800, fontSize: 34, color: low ? colors.red : colors.white }}>
            {p.battery} %
            <svg width="64" height="32" viewBox="0 0 64 32">
              <rect x="2" y="4" width="52" height="24" rx="6" fill="none" stroke={low ? colors.red : colors.white} strokeWidth="4" />
              <rect x="57" y="11" width="5" height="10" rx="2" fill={low ? colors.red : colors.white} />
              <rect x="6" y="8" width={Math.max(4, (44 * p.battery) / 100)} height="16" rx="3" fill={low ? colors.red : colors.green} />
            </svg>
          </div>
          {/* нет сети */}
          <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: net.opacity, transform: `scale(${net.scale})` }}>
            <svg width="140" height="110" viewBox="0 0 140 110">
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={10 + i * 32} y={80 - i * 22} width={22} height={20 + i * 22} rx={4} fill={colors.dim} />
              ))}
              <line x1="8" y1="104" x2="132" y2="6" stroke={colors.red} strokeWidth="10" strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 96, color: colors.white, letterSpacing: 2, marginTop: 10 }}>НЕТ СЕТИ</div>
          </div>
          {/* вызов */}
          <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", background: colors.panelLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="72" height="72" viewBox="0 0 90 90">
                <circle cx="45" cy="32" r="18" fill={colors.dim} />
                <path d="M12 82 C12 55, 78 55, 78 82 Z" fill={colors.dim} />
              </svg>
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
          {/* кнопка сброса */}
          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", width: 88, height: 88, borderRadius: "50%", background: colors.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="60" height="60" viewBox="0 0 60 60">
              <path d="M8 36 C20 22, 40 22, 52 36 L46 44 C38 36, 22 36, 14 44 Z" fill={colors.white} />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
