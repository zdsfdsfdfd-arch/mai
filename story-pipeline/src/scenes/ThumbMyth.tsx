import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { sec, stamp } from "../anim";
import * as B from "../beats3";
import { Camera, focusKey } from "../components/Camera";
import { Character } from "../components/Character";
import { Backdrop, Burst, Glow, Shake } from "../components/Fx";
import { DrawPath } from "../components/Motion";
import { Label } from "../components/Overlays";
import { colors, fonts, ink } from "../theme";
import type { SceneTimeline } from "../types";

// Как в Fallout: герой на крыше вытягивает руку с поднятым большим пальцем к грибу и прищуривает глаз,
// камера уходит ему «в глаз» — вид от первого лица: кисть с тыльной стороны, палец против облака,
// рамки сравнения, штамп «МИФ» и красный крест.

const puffs = [
  { x: 0, y: -40, r: 150, tone: 1 },
  { x: -125, y: -10, r: 100, tone: 0 },
  { x: 125, y: -24, r: 112, tone: 2 },
  { x: -70, y: -118, r: 92, tone: 0 },
  { x: 72, y: -126, r: 96, tone: 1 },
  { x: 0, y: -160, r: 72, tone: 0 },
  { x: -160, y: 30, r: 62, tone: 1 },
  { x: 165, y: 22, r: 66, tone: 2 },
];
const skirt = [
  { x: -270, y: 340, r: 50 },
  { x: -190, y: 330, r: 70 },
  { x: -95, y: 352, r: 62 },
  { x: 0, y: 362, r: 72 },
  { x: 95, y: 352, r: 62 },
  { x: 190, y: 330, r: 70 },
  { x: 270, y: 340, r: 50 },
];
const tones = ["#8c7876", "#6f5c5c", "#584848"];
const tonesHi = ["#a99290", "#8a7574", "#6f5d5d"];

// Кисть от первого лица, тыльная сторона: запястье, ладонь, четыре согнутых пальца столбиком справа
// (указательный сверху, мизинец снизу), большой палец из двух фаланг с ногтем наружу.
const PovHand: React.FC<{ outAt: number }> = ({ outAt }) => (
  <g>
    {/* рукав худи и манжета */}
    <rect x={-104} y={176} width={208} height={980} rx={12} fill="#2bb39a" stroke={ink} strokeWidth={8} />
    <rect x={36} y={176} width={62} height={980} fill="#1b8673" opacity={0.6} />
    <rect x={-118} y={150} width={236} height={62} rx={14} fill="#1b8673" stroke={ink} strokeWidth={8} />
    {Array.from({ length: 11 }, (_, i) => (
      <line key={i} x1={-100 + i * 20} y1={162} x2={-100 + i * 20} y2={200} stroke={ink} strokeWidth={3} opacity={0.3} />
    ))}
    {/* запястье */}
    <path d="M-72 100 L74 100 L80 164 L-78 164 Z" fill={colors.skin} stroke={ink} strokeWidth={8} strokeLinejoin="round" />
    {/* согнутые пальцы столбиком справа: от мизинца к указательному, чтобы верхние перекрывали нижние */}
    {[
      { x: 34, y: 40, w: 84, h: 52, k: 3 },
      { x: 40, y: -10, w: 94, h: 56, k: 2 },
      { x: 44, y: -64, w: 98, h: 58, k: 1 },
      { x: 40, y: -120, w: 96, h: 60, k: 0 },
    ].map((f, i) => (
      <g key={i}>
        <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.h / 2} fill={colors.skin} stroke={ink} strokeWidth={8} />
        <path d={`M${f.x + f.w - 30} ${f.y + 10} Q${f.x + f.w - 22} ${f.y + f.h / 2} ${f.x + f.w - 30} ${f.y + f.h - 10}`} fill="none" stroke={ink} strokeWidth={3.5} opacity={0.5} />
        <rect x={f.x + 8} y={f.y + f.h - 16} width={f.w - 40} height={8} rx={4} fill="#d3a984" opacity={0.6} />
      </g>
    ))}
    {/* тыльная сторона ладони: от запястья вверх к бугру большого пальца, по верху к костяшкам */}
    <path d="M-78 112 C-100 60, -112 10, -102 -30 C-94 -62, -62 -82, -40 -88 L58 -118 Q88 -124 92 -96 L96 104 Q96 126 72 126 L-60 126 Q-80 126 -78 112 Z" fill={colors.skin} stroke={ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M40 -112 L58 -118 Q88 -124 92 -96 L96 104 Q96 126 72 126 L44 126 Z" fill="#d3a984" opacity={0.4} />
    {/* костяшки по верхнему краю */}
    <path d="M-20 -84 q 16 -12 34 -6" fill="none" stroke={ink} strokeWidth={4} opacity={0.5} />
    <path d="M20 -96 q 16 -12 34 -6" fill="none" stroke={ink} strokeWidth={4} opacity={0.5} />
    <path d="M-70 10 Q-20 26 36 16" fill="none" stroke={ink} strokeWidth={3} opacity={0.22} />
    {/* большой палец: две фаланги, складка в суставе, ноготь наружу */}
    <path d="M-106 -26 C-124 -86, -118 -156, -96 -198 C-84 -228, -58 -248, -36 -232 C-18 -218, -24 -178, -34 -140 C-40 -112, -40 -92, -40 -88 Q-74 -72 -106 -26 Z" fill={colors.skin} stroke={ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M-108 -150 q 16 8 34 2" fill="none" stroke={ink} strokeWidth={4} opacity={0.5} />
    <path d="M-116 -70 C-126 -120, -118 -170, -98 -200" fill="none" stroke={colors.white} strokeWidth={6} strokeLinecap="round" opacity={0.28} />
    <path d="M-40 -196 C-34 -170, -38 -130, -42 -96" fill="none" stroke="#d3a984" strokeWidth={10} strokeLinecap="round" opacity={0.55} />
    <ellipse cx={-62} cy={-214} rx={16} ry={23} fill="#f3dcc4" stroke={ink} strokeWidth={4} transform="rotate(-14 -62 -214)" />
    {/* рамка сравнения по пальцу */}
    <DrawPath d="M-132 -256 h124 v182 h-124 Z" at={outAt} dur={0.5} stroke={colors.yellow} width={7} />
  </g>
);

export const ThumbMyth: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = scene.durationFrames / fps;
  const upAt = B.thumbUpAt(scene);
  const outAt = B.outlineAt(scene);
  const mythAt = B.mythAt(scene);
  const crossAt = B.crossAt(scene);
  const povAt = outAt - 0.35;
  const pov = t >= povAt;
  const cloudK = interpolate(t, [0, dur], [0.8, 1.0]);
  const myth = stamp(frame, fps, sec(mythAt, fps));
  const crossK = interpolate(t, [crossAt, crossAt + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mythBurst = interpolate(t, [mythAt + 0.08, mythAt + 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const povFlash = t < povAt ? 0 : interpolate(t, [povAt, povAt + 0.12], [0.9, 0], { extrapolateRight: "clamp" });
  // камера: общий план с героем, наезд в его кисть, затем вид от первого лица
  const keys = pov
    ? [focusKey(povAt, 520, 860, 1.12), focusKey(povAt + 0.25, 520, 860, 1.06), focusKey(mythAt, 520, 860, 1.06), focusKey(crossAt + 0.4, 520, 900, 1.12), focusKey(dur, 520, 910, 1.14)]
    : [focusKey(0, 460, 900, 1.0), focusKey(upAt + 0.3, 420, 900, 1.05), focusKey(povAt - 0.3, 420, 900, 1.05), focusKey(povAt, 330, 930, 2.6)];
  const ash = Array.from({ length: 44 }, (_, i) => ({ x: (i * 173) % 1080, y0: (i * 211) % 1400, s: 0.6 + (i % 4) * 0.3, r: 2 + (i % 3) * 1.5 }));
  const handUp = interpolate(t, [povAt, povAt + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (k) => 1 - Math.pow(1 - k, 3) });
  const handY = (1 - handUp) * 700 + (handUp >= 1 ? Math.sin(t * 2.4) * 5 : 0);
  const handRot = -10 + (handUp >= 1 ? Math.sin(t * 1.6) * 1.2 : 0);
  const roil = (i: number) => 1 + 0.045 * Math.sin(t * 1.3 + i * 1.7);
  const back = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({ x: i * 104 - 30, w: 70 + ((i * 37) % 40), h: 260 + ((i * 71) % 160) }));
  const front = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => ({ x: i * 90 - 40, w: 58 + ((i * 29) % 34), h: 150 + ((i * 53) % 130), ant: i % 4 === 1, tank: i % 5 === 3 }));

  return (
    <Backdrop variant="dusk" grid={false} particles={false}>
      <Camera keys={keys}>
        <Shake at={mythAt} amp={14} dur={0.45} seed={3}>
          <Shake at={crossAt} amp={10} dur={0.4} seed={7}>
            <Glow x={430} y={980} r={520} color="#ff7a2a" opacity={0.6} />
            <Glow x={430} y={690} r={420} color="#ffb060" opacity={0.25} />
            <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
              {Array.from({ length: 18 }, (_, i) => (
                <circle key={i} cx={(i * 223) % 1080} cy={((i * 131) % 420) + 60} r={1.5 + (i % 3)} fill={colors.white} opacity={0.3 + 0.5 * Math.abs(Math.sin(t * 1.5 + i))} />
              ))}
              <ellipse cx={540} cy={1120} rx={760} ry={90} fill="#ffb060" opacity={0.18} />
              {/* гриб */}
              <g transform={`translate(430 700) scale(${cloudK}) rotate(${Math.sin(t * 0.4) * 1.5})`}>
                <g stroke={ink} strokeWidth={16} strokeLinejoin="round" fill={ink}>
                  <path d="M-62 40 C-54 150, -44 240, -96 330 L96 330 C44 240, 54 150, 62 40 Z" />
                  {skirt.map((s, i) => <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} />)}
                  {puffs.map((p, i) => <circle key={`p${i}`} cx={p.x} cy={p.y} r={p.r * roil(i)} />)}
                </g>
                <path d="M-62 40 C-54 150, -44 240, -96 330 L96 330 C44 240, 54 150, 62 40 Z" fill="#5a4648" />
                <path d="M-62 40 C-54 150, -44 240, -96 330 L-10 330 C-2 240, -30 150, -20 40 Z" fill="#6f5c5c" />
                {skirt.map((s, i) => <circle key={`sf${i}`} cx={s.x} cy={s.y} r={s.r} fill="#4a3a3c" />)}
                {skirt.map((s, i) => <circle key={`sh${i}`} cx={s.x - s.r * 0.2} cy={s.y - s.r * 0.22} r={s.r * 0.72} fill="#5e4a4c" />)}
                <ellipse cx={0} cy={330} rx={300} ry={26} fill="#ff8a3a" opacity={0.55} />
                {puffs.map((p, i) => <circle key={`pf${i}`} cx={p.x} cy={p.y} r={p.r * roil(i)} fill={tones[p.tone]} />)}
                {puffs.map((p, i) => <circle key={`ph${i}`} cx={p.x - p.r * 0.2} cy={p.y - p.r * 0.22} r={p.r * roil(i) * 0.7} fill={tonesHi[p.tone]} />)}
                <g transform={`translate(0 ${120 - ((t * 14) % 60)})`}>
                  <ellipse cx={0} cy={0} rx={120} ry={22} fill="#7a6667" stroke={ink} strokeWidth={9} />
                  <ellipse cx={0} cy={-3} rx={92} ry={11} fill="#5a4648" />
                </g>
                <circle cx={0} cy={300} r={60} fill="#ffb060" opacity={0.5} />
              </g>
              {/* город */}
              {back.map((b, i) => (
                <rect key={i} x={b.x} y={1300 - b.h} width={b.w} height={b.h + 40} fill="#2a1a3c" stroke={ink} strokeWidth={4} />
              ))}
              {front.map((b, i) => (
                <g key={i}>
                  {b.ant && <line x1={b.x + b.w / 2} y1={1300 - b.h} x2={b.x + b.w / 2} y2={1300 - b.h - 60} stroke={ink} strokeWidth={5} />}
                  {b.ant && <circle cx={b.x + b.w / 2} cy={1300 - b.h - 62} r={5} fill={colors.red} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))} />}
                  {b.tank && <rect x={b.x + 8} y={1300 - b.h - 30} width={26} height={30} rx={4} fill="#1a1024" stroke={ink} strokeWidth={4} />}
                  <rect x={b.x} y={1300 - b.h} width={b.w} height={b.h + 40} fill="#160f20" stroke={ink} strokeWidth={5} />
                  {Array.from({ length: Math.floor(b.h / 42) }, (_, r) =>
                    [0, 1].map((c) => (
                      <rect key={`${r}${c}`} x={b.x + 10 + c * (b.w / 2 - 6)} y={1300 - b.h + 16 + r * 42} width={b.w / 2 - 20} height={20} rx={2} fill={colors.yellow} opacity={(i * 7 + r * 3 + c) % 4 === 0 ? 0.08 : 0.55 + 0.4 * Math.abs(Math.sin(t * 1.4 + i + r))} />
                    )),
                  )}
                </g>
              ))}
              <rect x={-100} y={1300} width={1280} height={800} fill="#0f0a16" />
              {ash.map((d, i) => (
                <circle key={i} cx={d.x + Math.sin(t * 1.5 + i) * 20} cy={(d.y0 + t * 60 * d.s) % 1400} r={d.r} fill="#cfc2b5" opacity={0.35} />
              ))}
              {/* крыша на переднем плане (общий план) */}
              {!pov && (
                <g>
                  <rect x={-100} y={1236} width={700} height={120} fill="#1c1426" stroke={ink} strokeWidth={7} />
                  <rect x={-100} y={1222} width={700} height={22} fill="#2a1f36" stroke={ink} strokeWidth={6} />
                  <rect x={420} y={1150} width={60} height={86} rx={6} fill="#1c1426" stroke={ink} strokeWidth={6} />
                  <line x1={450} y1={1150} x2={450} y2={1080} stroke={ink} strokeWidth={6} />
                  <circle cx={450} cy={1076} r={6} fill={colors.red} opacity={0.5 + 0.5 * Math.abs(Math.sin(t * 3))} />
                </g>
              )}
            </svg>
            {/* герой на крыше: поднимает руку с большим пальцем, прищуривается */}
            {!pov && (
              <Character pose={t < upAt ? "stand" : "thumb"} blend={{ from: "stand", to: "thumb", at: upAt, dur: 0.55 }} frame={frame} fps={fps} x={70} y={1236 - 554 * 0.85} scale={0.85} lookAt={[0.9, -0.6]} wink={t >= upAt + 0.5} mood={t >= upAt + 0.5 ? "smile" : "neutral"} />
            )}
            {/* вид от первого лица */}
            {pov && (
              <svg width={1080} height={1920} style={{ position: "absolute", overflow: "visible" }}>
                <g transform={`translate(430 ${1150 + handY}) rotate(${handRot}) scale(0.95)`}>
                  <PovHand outAt={outAt} />
                </g>
                <DrawPath d="M200 470 h460 v340 h-460 Z" at={outAt + 0.25} dur={0.6} stroke={colors.yellow} width={6} />
                <DrawPath d="M384 914 L660 810" at={outAt + 0.7} dur={0.3} stroke={colors.yellow} width={4} dash="10 10" />
                <g opacity={crossK > 0 ? 1 : 0} strokeLinecap="round">
                  <line x1={260} y1={930} x2={260 + 300 * Math.min(1, crossK * 2)} y2={930 + 340 * Math.min(1, crossK * 2)} stroke={ink} strokeWidth={30} />
                  <line x1={560} y1={930} x2={560 - 300 * Math.max(0, crossK * 2 - 1)} y2={930 + 340 * Math.max(0, crossK * 2 - 1)} stroke={ink} strokeWidth={30} />
                  <line x1={260} y1={930} x2={260 + 300 * Math.min(1, crossK * 2)} y2={930 + 340 * Math.min(1, crossK * 2)} stroke={colors.red} strokeWidth={18} />
                  <line x1={560} y1={930} x2={560 - 300 * Math.max(0, crossK * 2 - 1)} y2={930 + 340 * Math.max(0, crossK * 2 - 1)} stroke={colors.red} strokeWidth={18} />
                </g>
              </svg>
            )}
            {pov && <Label text="ПАЛЕЦ < ОБЛАКО" x={740} y={1060} delay={sec(outAt, fps) + 6} tone="beige" />}
            <Burst x={760} y={700} k={mythBurst} n={12} r0={120} r1={420} color={colors.red} width={8} />
            <div style={{ position: "absolute", left: 600, top: 560, padding: "8px 30px", border: `10px solid ${colors.red}`, boxShadow: `inset 0 0 0 5px ${ink}, 8px 8px 0 ${ink}`, color: colors.red, fontFamily: fonts.display, fontWeight: 900, fontSize: 128, letterSpacing: 6, transform: `rotate(-12deg) scale(${myth.scale})`, opacity: myth.opacity, borderRadius: 14, background: "rgba(11,16,32,0.55)", WebkitTextStroke: `3px ${ink}`, paintOrder: "stroke fill" }}>
              МИФ
            </div>
          </Shake>
        </Shake>
      </Camera>
      {/* виньетка «глаза» в виде от первого лица */}
      {pov && <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 52%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />}
      <AbsoluteFill style={{ background: colors.white, opacity: povFlash, pointerEvents: "none" }} />
      <Label text="В ЖИЗНИ НЕ РАБОТАЕТ" x={540} y={1225} delay={sec(crossAt, fps) + 8} tone="red" />
    </Backdrop>
  );
};
