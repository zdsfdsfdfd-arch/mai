import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { sec, slide, stamp } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, Card } from "../components/Fx";
import { colors, fonts, ink } from "../theme";
import type { SceneTimeline } from "../types";

type Props = { items: string[] };

// Итоговый чек-лист: карточки-стикеры въезжают слева по фразам, галочки рисуются, герой кивает,
// в конце зелёный штамп «ЗАПОМНИ».
export const Checklist: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const times = B.checkTimes(scene, p.items.length);
  const keys = [focusKey(0, 540, 800, 1.0), focusKey(dur, 540, 820, 1.06)];
  const done = times.filter((x) => t >= x).length;
  const lastAt = times[times.length - 1] + 1.0;
  const st = stamp(frame, fps, sec(lastAt, fps));

  return (
    <Backdrop variant="navy" spot={{ x: 540, y: 760, color: "#3ec66d", opacity: 0.2 }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
          <g transform="rotate(-2 400 760)">
            <rect x={40} y={300} width={720} height={900} rx={18} fill="#4a3220" stroke={ink} strokeWidth={7} />
            <rect x={70} y={350} width={660} height={820} rx={8} fill="#e9dcc2" stroke={ink} strokeWidth={5} />
            <rect x={300} y={282} width={200} height={70} rx={14} fill="#8c91a6" stroke={ink} strokeWidth={6} />
            <rect x={330} y={300} width={140} height={30} rx={8} fill="#5c6a92" stroke={ink} strokeWidth={4} />
            {Array.from({ length: 14 }, (_, i) => (
              <line key={i} x1={100} y1={420 + i * 52} x2={700} y2={420 + i * 52} stroke="#b8a98a" strokeWidth={2} opacity={0.6} />
            ))}
          </g>
        </svg>
        <Character pose="stand" frame={frame} fps={fps} x={760} y={560} scale={0.92} mood={done === p.items.length ? "smile" : "neutral"} talkAt={times} />
        {p.items.map((item, i) => {
          const s = slide(frame, fps, sec(times[i], fps), -1, 260);
          const checkK = interpolate(t, [times[i] + 0.12, times[i] + 0.42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = 392 + i * 128;
          return (
            <div key={i} style={{ position: "absolute", left: 80, top: y, opacity: s.opacity, transform: `translateX(${s.x}px) rotate(${i % 2 ? 1 : -1}deg)` }}>
              <Card x={0} y={0} w={620} h={104} color={checkK >= 1 ? colors.green : colors.yellow} style={{ position: "relative", display: "flex", alignItems: "center", gap: 22, paddingLeft: 18, paddingTop: 8 }}>
                <svg width="70" height="70" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="36" fill={checkK >= 1 ? colors.green : colors.panelLight} stroke={ink} strokeWidth="7" />
                  <polyline points="22,44 36,58 62,28" fill="none" stroke={colors.white} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="80" strokeDashoffset={80 * (1 - checkK)} />
                </svg>
                <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 64, color: colors.white, letterSpacing: 1.5, lineHeight: 1, WebkitTextStroke: `2px ${ink}`, paintOrder: "stroke fill" }}>
                  <span style={{ color: colors.yellow, fontSize: 36, marginRight: 16 }}>{i + 1}</span>
                  {item}
                </div>
              </Card>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 560, top: 1120, padding: "6px 28px", border: `9px solid ${colors.green}`, boxShadow: `inset 0 0 0 4px ${ink}, 8px 8px 0 ${ink}`, color: colors.green, fontFamily: fonts.display, fontWeight: 900, fontSize: 92, letterSpacing: 4, transform: `translate(-50%, -50%) rotate(-10deg) scale(${st.scale})`, opacity: st.opacity, borderRadius: 14, background: "rgba(11,16,32,0.6)", WebkitTextStroke: `2px ${ink}`, paintOrder: "stroke fill", whiteSpace: "nowrap" }}>
          ЗАПОМНИ
        </div>
      </Camera>
    </Backdrop>
  );
};
