import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop, sec } from "../anim";
import * as B from "../beats2";
import { Camera, focusKey } from "../components/Camera";
import { colors, fonts } from "../theme";
import type { SceneTimeline } from "../types";

type Card = { label: string; value: string; tone?: "red" | "green" | "yellow" };
type Props = { cards: Card[] };

// Улики: лифт с клочками шерсти и завитками духов, два билета, морковка с запиской. Карточки по фразам.
export const Evidence: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const p = scene.props as Props;
  const times = B.cardPhraseTimes(scene);
  const noteAt = B.noteAt(scene);
  const draw = interpolate(t, [0.1, 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const woolAt = times[0] ?? 2.5;
  const ticketsAt = times[1] ?? 5;
  const carrotAt = times[2] ?? 7;
  const wool = interpolate(t, [woolAt, woolAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tickets = pop(frame, fps, sec(ticketsAt, fps));
  const carrot = pop(frame, fps, sec(carrotAt, fps));
  const note = pop(frame, fps, sec(noteAt, fps));
  const keys = [focusKey(0, 540, 720, 1.2), focusKey(woolAt, 540, 760, 1.25), focusKey(ticketsAt, 540, 800, 1.1), focusKey(carrotAt, 540, 860, 1.0), focusKey(dur, 540, 880, 1.0)];

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Camera keys={keys}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* кабина лифта спереди: створки, табло */}
          <rect x={330} y={470} width={420} height={420} rx={10} fill={colors.panel} opacity={draw} />
          <rect x={330} y={470} width={420} height={420} rx={10} fill="none" stroke={colors.white} strokeWidth={6} strokeDasharray={1680} strokeDashoffset={1680 * (1 - draw)} />
          <line x1={540} y1={470} x2={540} y2={890} stroke={colors.line} strokeWidth={6} opacity={draw} />
          <rect x={500} y={430} width={80} height={36} rx={6} fill="#0a0d1a" stroke={colors.yellow} strokeWidth={3} opacity={draw} />
          <text x={540} y={457} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fill={colors.yellow} opacity={draw}>8</text>
          {/* клочки шерсти на полу */}
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} opacity={wool} transform={`translate(${380 + i * 70} ${860 - (i % 2) * 14}) scale(${0.5 + 0.5 * wool})`}>
              <circle cx={0} cy={0} r={14} fill="#f1efe6" />
              <circle cx={12} cy={-6} r={10} fill="#f1efe6" />
              <circle cx={-10} cy={-6} r={9} fill="#f1efe6" />
            </g>
          ))}
          {/* завитки духов поднимаются */}
          {wool > 0 &&
            [0, 1, 2].map((k) => {
              const ph = ((t - woolAt) * 0.5 + k / 3) % 1;
              const y0 = 840 - 300 * ph;
              return <path key={k} d={`M ${430 + k * 90} ${y0} q 20 -30 0 -60 t 0 -60`} fill="none" stroke="#ff5d8f" strokeWidth={5} strokeLinecap="round" opacity={(1 - ph) * 0.8 * wool} />;
            })}
          {/* два билета */}
          <g opacity={tickets.opacity} transform={`translate(0 ${tickets.y})`}>
            <rect x={780} y={640} width={150} height={70} rx={8} fill={colors.yellow} transform="rotate(-12 855 675)" />
            <rect x={800} y={690} width={150} height={70} rx={8} fill="#f3d26a" transform="rotate(-6 875 725)" />
            <text x={855} y={685} textAnchor="middle" fontFamily={fonts.mono} fontSize={22} fill={colors.beigeInk} transform="rotate(-12 855 675)">КИНО · 2</text>
          </g>
          {/* морковка */}
          <g opacity={carrot.opacity} transform={`translate(0 ${carrot.y})`}>
            <polygon points="150,780 300,750 300,810" fill="#ff8a3d" transform="rotate(-20 225 780)" />
            <polygon points="300,750 330,735 310,770 330,775 300,810" fill={colors.green} transform="rotate(-20 225 780)" />
          </g>
        </svg>
        {/* записка */}
        <div style={{ position: "absolute", left: 90, top: 870, width: 340, padding: "16px 20px", background: colors.beige, color: colors.beigeInk, fontFamily: fonts.text, fontWeight: 600, fontSize: 30, lineHeight: 1.2, transform: `rotate(-4deg) translateY(${note.y}px) scale(${note.scale})`, opacity: note.opacity, boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>
          «извини за вчерашнее, было громко»
        </div>
        {p.cards.map((c, i) => {
          const a = pop(frame, fps, sec(times[i] ?? 2 + i * 1.5, fps));
          const color = c.tone === "red" ? colors.red : c.tone === "green" ? colors.green : c.tone === "yellow" ? colors.yellow : colors.white;
          return (
            <div key={i} style={{ position: "absolute", left: 70 + i * 320, top: 1050, width: 300, height: 150, borderRadius: 22, background: colors.panel, border: `4px solid ${color}`, opacity: a.opacity, transform: `translateY(${a.y}px) scale(${a.scale})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <div style={{ fontFamily: fonts.text, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: colors.dim }}>{c.label}</div>
              <div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: c.value.length > 8 ? 52 : 68, lineHeight: 1, color }}>{c.value}</div>
            </div>
          );
        })}
      </Camera>
    </AbsoluteFill>
  );
};
