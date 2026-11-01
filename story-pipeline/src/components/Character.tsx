import React from "react";
import { interpolate } from "remotion";
import { colors, ink } from "../theme";

// Персонаж в стиле «стикер» с гибкими резиновыми конечностями: руки и ноги — плавные трубки через локоть
// и колено (без шарниров), крупная голова, живое лицо: моргает, смотрит, дышит, вздрагивает, говорит.
// Рамка 300×560, ступни у низа (y≈554), тень на полу. API совместим со всеми сценами.

export type Pose = "stand" | "point" | "sit" | "knock" | "walk" | "run" | "cover" | "fall" | "lie";
export type Outfit = "jacket" | "robe" | "suit" | "shirt";
export type Mood = "neutral" | "scared" | "smile" | "tired";

type Props = {
  pose: Pose;
  frame: number;
  fps: number;
  knockAt?: number[];
  talkAt?: number[];
  flinchAt?: number[];
  lookAt?: [number, number];
  sitAt?: number;
  fallK?: number;
  squash?: number;
  scale?: number;
  x?: number;
  y?: number;
  flip?: boolean;
  outfit?: Outfit;
  mustache?: boolean;
  glasses?: boolean;
  mood?: Mood;
  opacity?: number;
  shadow?: boolean;
};

const SW = 6;
const cloth = (o: Outfit) => (o === "robe" ? "#8a3344" : o === "suit" ? "#1a1d2e" : o === "shirt" ? "#efe7d2" : "#2f4a8f");
const clothDark = (o: Outfit) => (o === "robe" ? "#5e2030" : o === "suit" ? "#0f111c" : o === "shirt" ? "#cfc6ae" : "#1f3366");
const smooth = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rad = (d: number) => (d * Math.PI) / 180;

type Angles = { fu: number; fl: number; bu: number; bl: number; ft: number; fs: number; bt: number; bs: number; torso: number; head: number; bodyY: number; lean: number };

const poseAngles = (pose: Pose, t: number, extra: { hit: number; gesture: number; fallK: number }): Angles => {
  const sw = Math.sin(t * 7);
  const base: Angles = { fu: 5 - 50 * extra.gesture, fl: 8 - 40 * extra.gesture, bu: -5, bl: 8, ft: 0, fs: 0, bt: 0, bs: 0, torso: 0, head: -3 * extra.gesture, bodyY: 0, lean: 0 };
  switch (pose) {
    case "walk":
      return { ...base, fu: -28 * sw, fl: 20, bu: 28 * sw, bl: 20, ft: 26 * sw, fs: Math.max(0, -38 * sw), bt: -26 * sw, bs: Math.max(0, 38 * sw), torso: 4, bodyY: Math.abs(sw) * 4 };
    case "run": {
      const sr = Math.sin(t * 11);
      return { ...base, fu: -50 * sr, fl: 60, bu: 50 * sr, bl: 60, ft: 40 * sr, fs: Math.max(0, -60 * sr), bt: -40 * sr, bs: Math.max(0, 60 * sr), torso: 14, bodyY: Math.abs(sr) * 6 };
    }
    case "sit":
      return { ...base, fu: 25 - 25 * extra.gesture, fl: -70 - 30 * extra.gesture, bu: 20, bl: -70, ft: -88, fs: 92, bt: -84, bs: 90, torso: 2, bodyY: 96 };
    case "cover":
      return { ...base, fu: -165, fl: -60, bu: -160, bl: -70, ft: -95, fs: 115, bt: -90, bs: 112, torso: 22, head: 18, bodyY: 118 };
    case "knock":
      return { ...base, fu: -92, fl: -62 + 56 * extra.hit, bu: -4, bl: 6, torso: 3 };
    case "point":
      return { ...base, fu: -152, fl: -12, bu: -6, bl: 8, torso: -4, head: -8 };
    case "fall": {
      const k = extra.fallK;
      const flail = Math.sin(t * 18) * 40 * (1 - k);
      return { ...base, fu: lerp(-40, 70, k) + flail, fl: lerp(-20, 30, k), bu: lerp(40, 80, k) - flail, bl: lerp(10, 25, k), ft: lerp(0, 30, k), fs: lerp(0, 40, k), bt: lerp(0, -20, k), bs: lerp(0, 35, k), torso: lerp(0, -82, k), head: lerp(0, 25, k), bodyY: lerp(0, 150, k), lean: 0 };
    }
    case "lie":
      return { ...base, fu: 60, fl: 20, bu: 75, bl: 25, ft: 25, fs: 30, bt: -15, bs: 30, torso: -86, head: 20, bodyY: 160 };
    default:
      return base;
  }
};

// Гибкая конечность: плавная кривая через локоть/колено, обводка, блик.
const Limb: React.FC<{ ox: number; oy: number; a1: number; a2: number; l1: number; l2: number; w: number; fill: string; end: "hand" | "shoe"; skin: string }> = ({ ox, oy, a1, a2, l1, l2, w, fill, end, skin }) => {
  const ex = ox - l1 * Math.sin(rad(a1));
  const ey = oy + l1 * Math.cos(rad(a1));
  const hx = ex - l2 * Math.sin(rad(a1 + a2));
  const hy = ey + l2 * Math.cos(rad(a1 + a2));
  const cx = 2 * ex - (ox + hx) / 2;
  const cy = 2 * ey - (oy + hy) / 2;
  const d = `M${ox} ${oy} Q${cx} ${cy} ${hx} ${hy}`;
  return (
    <g>
      <path d={d} fill="none" stroke={ink} strokeWidth={w + 2 * SW} strokeLinecap="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" stroke={colors.white} strokeWidth={w * 0.22} strokeLinecap="round" opacity={0.16} transform="translate(-4 -3)" />
      {end === "hand" ? (
        <circle cx={hx} cy={hy} r={21} fill={skin} stroke={ink} strokeWidth={SW} />
      ) : (
        <g transform={`translate(${hx} ${hy}) rotate(${a1 + a2})`}>
          <path d="M-24 -8 L42 -8 Q60 -4 58 12 L58 16 Q58 24 50 24 L-18 24 Q-26 24 -26 16 Z" fill={colors.white} stroke={ink} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M-24 6 L56 6" stroke={colors.red} strokeWidth={5} />
          <path d="M-24 16 L56 16" stroke={ink} strokeWidth={3} opacity={0.6} />
          <path d="M-2 -8 Q8 4 20 -8" fill="none" stroke={ink} strokeWidth={3} opacity={0.6} />
        </g>
      )}
    </g>
  );
};

export const Character: React.FC<Props> = ({ pose, frame, fps, knockAt = [], talkAt = [], flinchAt = [], lookAt, sitAt, fallK = 0, squash = 0, scale = 1, x = 0, y = 0, flip = false, outfit = "jacket", mustache = false, glasses = false, mood = "neutral", opacity = 1, shadow = true }) => {
  const t = frame / fps;
  const hoodie = outfit === "jacket";
  const c = hoodie ? "#2bb39a" : cloth(outfit);
  const cd = hoodie ? "#1b8673" : clothDark(outfit);
  const limbFill = outfit === "shirt" ? colors.skin : c;
  const jeans = "#2f3b5c";

  let hit = 0;
  for (const k of knockAt) {
    const d = frame - k * fps;
    if (d >= 0 && d <= 9) hit = Math.max(hit, interpolate(d, [0, 3, 9], [0, 1, 0]));
  }
  let gesture = 0;
  let talk = 0;
  for (const g of talkAt) {
    const d = t - g;
    if (d >= 0 && d <= 0.9) gesture = Math.max(gesture, Math.sin((d / 0.9) * Math.PI));
    if (d >= 0 && d <= 1.4) talk = Math.max(talk, Math.abs(Math.sin(d * 14)) * (1 - d / 1.4));
  }
  let flinch = 0;
  for (const f of flinchAt) {
    const d = t - f;
    if (d >= 0 && d <= 0.7) flinch = Math.max(flinch, d < 0.12 ? d / 0.12 : 1 - (d - 0.12) / 0.58);
  }
  let a = poseAngles(pose, t, { hit, gesture, fallK });
  if (sitAt !== undefined) {
    const k = smooth(interpolate(t, [sitAt, sitAt + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    const s = poseAngles("sit", t, { hit, gesture, fallK });
    const st = poseAngles("stand", t, { hit, gesture, fallK });
    const m = (key: keyof Angles) => lerp(st[key], s[key], k);
    a = { fu: m("fu"), fl: m("fl"), bu: m("bu"), bl: m("bl"), ft: m("ft"), fs: m("fs"), bt: m("bt"), bs: m("bs"), torso: m("torso"), head: m("head"), bodyY: m("bodyY"), lean: 0 };
  }
  const idle = Math.sin(t * 1.7) * 3;
  const breathe = Math.sin(t * 2.2) * 2;
  const headBob = Math.sin(t * 2.2 + 0.6) * 1.5 + Math.sin(t * 0.9) * 1;
  const blink = (frame + 11) % Math.round(fps * 3.4) < 3;
  const fu = a.fu + idle * 0.4 - 120 * flinch;
  const fl = a.fl + idle * 0.6 - 30 * flinch;
  const bu = a.bu + idle * 0.5 - 110 * flinch;
  const bl = a.bl + idle * 0.4 - 20 * flinch;
  const torso = a.torso - 14 * flinch;
  const head = a.head - 8 * flinch + Math.sin(t * 0.7) * 1.5;
  const bodyY = a.bodyY + breathe * 0.5 - 12 * flinch;
  const sq = Math.max(0, Math.min(1, squash)) + flinch * 0.15;
  const skin = colors.skin;
  const skinDark = "#d3a984";
  const hair = "#2b1d14";
  const hairHi = "#5a3d2a";
  const scared = mood === "scared" || flinch > 0.5;
  const smile = mood === "smile";
  const tired = mood === "tired";
  const grounded = pose !== "fall" && pose !== "lie";
  const look = lookAt ?? [Math.sin(t * 0.5) * 0.4, Math.sin(t * 0.33) * 0.2];
  const px = look[0] * 5;
  const py = look[1] * 4;
  const pupilR = 8 - 2 * flinch;
  const mouthOpen = scared ? 1 : talk;

  return (
    <svg width={300 * scale} height={560 * scale} viewBox="0 0 300 560" style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : undefined, overflow: "visible", opacity }}>
      {shadow && <ellipse cx={150} cy={554} rx={(grounded ? 76 : 120) * (1 + sq * 0.3)} ry={10} fill={ink} opacity={0.3} />}
      <g transform={`translate(150 ${354 + bodyY}) translate(0 200) scale(${1 + sq * 0.22} ${1 - sq * 0.22}) translate(0 -200) rotate(${torso})`}>
        {/* задняя нога и рука */}
        <Limb ox={-22} oy={0} a1={a.bt} a2={a.bs} l1={92} l2={86} w={40} fill={jeans} end="shoe" skin={skin} />
        <Limb ox={-34} oy={-140} a1={bu} a2={bl} l1={88} l2={78} w={36} fill={limbFill} end="hand" skin={skin} />
        {/* капюшон за шеей */}
        {hoodie && <path d="M-60 -150 Q-74 -196 -34 -206 L34 -206 Q74 -196 60 -150 Q0 -132 -60 -150 Z" fill={cd} stroke={ink} strokeWidth={SW} strokeLinejoin="round" />}
        {/* туловище */}
        <path d="M-46 -162 L46 -162 Q60 -162 60 -148 L54 -16 Q52 8 30 8 L-30 8 Q-52 8 -54 -16 L-60 -148 Q-60 -162 -46 -162 Z" fill={c} stroke={ink} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M24 -158 Q56 -140 56 -90 L52 -20 Q52 4 30 6 L44 6 Q55 -10 55 -40 L58 -120 Q58 -150 24 -158 Z" fill={cd} opacity={0.55} />
        {hoodie && (
          <g>
            <path d="M-40 -162 Q0 -130 40 -162 Q0 -142 -40 -162 Z" fill={cd} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <path d="M-10 -142 L-14 -92" stroke={ink} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
            <path d="M10 -142 L14 -92" stroke={ink} strokeWidth={4} strokeLinecap="round" opacity={0.7} />
            <circle cx={-14} cy={-90} r={4} fill={ink} opacity={0.7} />
            <circle cx={14} cy={-90} r={4} fill={ink} opacity={0.7} />
            <path d="M-38 -56 L38 -56 L32 -14 L-32 -14 Z" fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" opacity={0.45} />
          </g>
        )}
        {outfit === "robe" && (
          <g>
            <polygon points="-10,-162 52,-162 20,-60" fill="#e8d8c0" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <rect x={-55} y={-72} width={110} height={14} fill="#5a1f2a" stroke={ink} strokeWidth={3} />
          </g>
        )}
        {outfit === "suit" && (
          <g>
            <polygon points="-6,-162 48,-162 20,-95" fill={colors.white} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <polygon points="16,-152 30,-152 23,-95" fill={colors.red} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
          </g>
        )}
        {outfit === "shirt" && (
          <g>
            <path d="M-14 -162 Q0 -146 14 -162" fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <rect x={-18} y={-110} width={36} height={30} rx={6} fill={colors.yellow} stroke={ink} strokeWidth={3} opacity={0.9} />
          </g>
        )}
        {/* бёдра и ремень */}
        <rect x={-54} y={-20} width={108} height={40} rx={18} fill={jeans} stroke={ink} strokeWidth={SW} />
        <rect x={-50} y={-14} width={100} height={9} rx={4} fill={ink} opacity={0.6} />
        {/* передняя нога */}
        <Limb ox={22} oy={0} a1={a.ft} a2={a.fs} l1={92} l2={86} w={40} fill={jeans} end="shoe" skin={skin} />
        {/* шея и голова */}
        <g transform={`translate(0 ${-164 + headBob}) rotate(${head})`}>
          <rect x={-15} y={-34} width={30} height={40} rx={12} fill={skin} stroke={ink} strokeWidth={SW} />
          <g transform="translate(4 -82)">
            <circle cx={-60} cy={6} r={13} fill={skin} stroke={ink} strokeWidth={SW} />
            <path d="M-64 2 Q-58 6 -62 12" fill="none" stroke={ink} strokeWidth={3} />
            {/* голова */}
            <path d="M-64 -14 C-64 -92, 64 -92, 64 -14 C64 36, 44 72, 0 72 C-44 72, -64 36, -64 -14 Z" fill={skin} stroke={ink} strokeWidth={SW} strokeLinejoin="round" />
            <path d="M-34 44 Q0 72 36 44 Q6 58 -34 44 Z" fill={skinDark} opacity={0.45} />
            {/* волосы: большой чуб */}
            <g transform={`translate(${Math.sin(t * 2.2 + 1) * 1.5} 0)`}>
              <path d="M-66 -30 C-62 -84, -20 -104, 10 -100 C44 -100, 72 -100, 88 -62 C94 -48, 76 -44, 60 -52 C44 -60, 26 -50, 8 -52 C-14 -54, -36 -46, -50 -28 Z" fill={hair} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M-40 -72 C-10 -94, 30 -92, 60 -74" fill="none" stroke={hairHi} strokeWidth={6} strokeLinecap="round" />
              <rect x={-64} y={-34} width={10} height={26} rx={4} fill={hair} />
            </g>
            {/* щёки */}
            <circle cx={-4} cy={26} r={10} fill="#e58a8a" opacity={0.25} />
            <circle cx={54} cy={22} r={10} fill="#e58a8a" opacity={0.25} />
            {/* глаза */}
            {!blink ? (
              <>
                <ellipse cx={8} cy={-4} rx={15} ry={19 + 3 * flinch} fill={colors.white} stroke={ink} strokeWidth={4} />
                <ellipse cx={46} cy={-6} rx={15} ry={19 + 3 * flinch} fill={colors.white} stroke={ink} strokeWidth={4} />
                <circle cx={12 + px} cy={-1 + py} r={pupilR} fill="#3a2a1e" />
                <circle cx={50 + px} cy={-3 + py} r={pupilR} fill="#3a2a1e" />
                <circle cx={12 + px} cy={-1 + py} r={pupilR * 0.55} fill={ink} />
                <circle cx={50 + px} cy={-3 + py} r={pupilR * 0.55} fill={ink} />
                <circle cx={9 + px} cy={-6 + py} r={3} fill={colors.white} />
                <circle cx={47 + px} cy={-8 + py} r={3} fill={colors.white} />
                {tired && (
                  <>
                    <path d="M-7 -8 Q8 0 23 -8 L23 -24 L-7 -24 Z" fill={skin} />
                    <path d="M31 -10 Q46 -2 61 -10 L61 -26 L31 -26 Z" fill={skin} />
                    <path d="M-6 -7 Q8 1 22 -7" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
                    <path d="M32 -9 Q46 -1 60 -9" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
                  </>
                )}
              </>
            ) : (
              <>
                <path d="M-6 -2 Q8 6 22 -2" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
                <path d="M32 -4 Q46 4 60 -4" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
              </>
            )}
            {/* брови */}
            <path d={scared ? "M-8 -38 Q8 -50 24 -36" : tired ? "M-6 -26 Q8 -30 24 -34" : "M-8 -30 Q8 -40 24 -30"} fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
            <path d={scared ? "M30 -40 Q46 -52 62 -36" : tired ? "M30 -34 Q46 -32 62 -26" : "M30 -32 Q46 -42 62 -30"} fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
            {/* нос */}
            <path d="M36 10 Q46 20 34 26" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
            {/* рот */}
            {mouthOpen > 0.1 ? (
              <g>
                <ellipse cx={30} cy={44} rx={10 + 6 * mouthOpen} ry={4 + 14 * mouthOpen} fill="#5a2222" stroke={ink} strokeWidth={4} />
                <ellipse cx={30} cy={48 + 8 * mouthOpen} rx={6} ry={4 * mouthOpen} fill="#e07a8a" />
              </g>
            ) : smile ? (
              <g>
                <path d="M2 34 Q30 66 58 32 Q30 46 2 34 Z" fill={colors.white} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
                <path d="M6 36 Q30 46 54 34" fill="none" stroke={ink} strokeWidth={2} opacity={0.6} />
              </g>
            ) : tired ? (
              <path d="M12 44 L46 44" stroke={ink} strokeWidth={5} strokeLinecap="round" />
            ) : (
              <path d="M10 40 Q30 52 52 38" stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
            )}
            {mustache && <path d="M6 30 C18 18, 44 20, 54 32 C44 26, 18 28, 6 30 Z" fill={hair} stroke={ink} strokeWidth={3} />}
            {glasses && (
              <g fill="none" stroke={ink} strokeWidth={4}>
                <ellipse cx={8} cy={-4} rx={20} ry={21} />
                <ellipse cx={46} cy={-6} rx={20} ry={21} />
                <line x1={28} y1={-5} x2={26} y2={-5} />
              </g>
            )}
            {scared && <path d="M70 -44 Q80 -30 70 -20 Q60 -30 70 -44 Z" fill="#7cc4ff" stroke={ink} strokeWidth={3} />}
          </g>
        </g>
        {/* передняя рука */}
        <Limb ox={34} oy={-140} a1={fu} a2={fl} l1={88} l2={78} w={36} fill={limbFill} end="hand" skin={skin} />
      </g>
    </svg>
  );
};

// Чёрный силуэт другого человека, с шагом.
export const Silhouette: React.FC<{ frame: number; fps: number; x: number; y: number; scale?: number; walking?: boolean; flip?: boolean }> = ({ frame, fps, x, y, scale = 1, walking = true, flip = false }) => {
  const t = frame / fps;
  const sw = walking ? Math.sin(t * 7) : 0;
  const bob = walking ? Math.abs(Math.sin(t * 7)) * 4 : 0;
  return (
    <svg width={160 * scale} height={300 * scale} viewBox="0 0 160 300" style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}>
      <g transform={`translate(0 ${-bob})`} fill="#07090f">
        <circle cx={80} cy={48} r={34} />
        <rect x={70} y={78} width={20} height={16} rx={8} />
        <rect x={50} y={92} width={60} height={110} rx={28} />
        <rect x={22} y={100} width={22} height={88} rx={11} transform={`rotate(${-22 * sw} 33 100)`} />
        <rect x={116} y={100} width={22} height={88} rx={11} transform={`rotate(${22 * sw} 127 100)`} />
        <rect x={56} y={198} width={22} height={92} rx={11} transform={`rotate(${18 * sw} 67 198)`} />
        <rect x={82} y={198} width={22} height={92} rx={11} transform={`rotate(${-18 * sw} 93 198)`} />
      </g>
    </svg>
  );
};
