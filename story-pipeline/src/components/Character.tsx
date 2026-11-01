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
          <path d="M-22 -6 L44 -6 Q58 -4 56 10 L56 14 Q56 22 48 22 L-16 22 Q-24 22 -24 14 Z" fill="#15161f" stroke={ink} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M-14 6 L40 6" stroke={colors.white} strokeWidth={3} opacity={0.4} />
        </g>
      )}
    </g>
  );
};

export const Character: React.FC<Props> = ({ pose, frame, fps, knockAt = [], talkAt = [], flinchAt = [], lookAt, sitAt, fallK = 0, squash = 0, scale = 1, x = 0, y = 0, flip = false, outfit = "jacket", mustache = false, glasses = false, mood = "neutral", opacity = 1, shadow = true }) => {
  const t = frame / fps;
  const c = cloth(outfit);
  const cd = clothDark(outfit);
  const limbFill = outfit === "shirt" ? colors.skin : c;
  const pants = "#232a44";

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
  // вторичное движение: дыхание, покачивание свободных рук с запаздыванием, вздрагивание
  const idle = Math.sin(t * 1.7) * 3;
  const breathe = Math.sin(t * 2.2) * 2;
  const headBob = Math.sin(t * 2.2 + 0.6) * 1.5 + Math.sin(t * 0.9) * 1;
  const blink = (frame + 11) % Math.round(fps * 3.4) < 3;
  const fu = a.fu + idle * 0.4 - 120 * flinch;
  const fl = a.fl + idle * 0.6 - 30 * flinch;
  const bu = a.bu + idle * 0.5 - 110 * flinch;
  const bl = a.bl + idle * 0.4 - 20 * flinch;
  const torso = a.torso - 14 * flinch;
  const head = a.head - 8 * flinch;
  const bodyY = a.bodyY + breathe * 0.5 - 12 * flinch;
  const sq = Math.max(0, Math.min(1, squash)) + flinch * 0.15;
  const skin = colors.skin;
  const skinDark = "#d3a984";
  const hair = "#1b1722";
  const scared = mood === "scared" || flinch > 0.5;
  const smile = mood === "smile";
  const tired = mood === "tired";
  const grounded = pose !== "fall" && pose !== "lie";
  const look = lookAt ?? [Math.sin(t * 0.5) * 0.4, Math.sin(t * 0.33) * 0.2];
  const px = look[0] * 4.5;
  const py = look[1] * 3;
  const eyeR = 12 + 3 * flinch;

  return (
    <svg width={300 * scale} height={560 * scale} viewBox="0 0 300 560" style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : undefined, overflow: "visible", opacity }}>
      {shadow && <ellipse cx={150} cy={554} rx={(grounded ? 78 : 120) * (1 + sq * 0.3)} ry={10} fill={ink} opacity={0.3} />}
      <g transform={`translate(150 ${340 + bodyY}) translate(0 212) scale(${1 + sq * 0.22} ${1 - sq * 0.22}) translate(0 -212) rotate(${torso})`}>
        {/* задняя нога и рука */}
        <Limb ox={-22} oy={0} a1={a.bt} a2={a.bs} l1={100} l2={92} w={40} fill={pants} end="shoe" skin={skin} />
        <Limb ox={-32} oy={-150} a1={bu} a2={bl} l1={92} l2={80} w={34} fill={limbFill} end="hand" skin={skin} />
        {/* туловище */}
        <path d="M-50 -176 L50 -176 Q58 -176 58 -166 L54 -14 Q52 6 32 6 L-32 6 Q-52 6 -54 -14 L-58 -166 Q-58 -176 -50 -176 Z" fill={c} stroke={ink} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M22 -170 Q54 -150 54 -90 L52 -20 Q52 2 30 4 L44 4 Q55 -10 55 -40 L57 -120 Q57 -160 22 -170 Z" fill={cd} opacity={0.6} />
        {outfit === "jacket" && (
          <g>
            <polygon points="-2,-174 44,-174 22,-128" fill="#e3dfd4" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <line x1={10} y1={-126} x2={8} y2={-10} stroke={ink} strokeWidth={3} opacity={0.6} />
            <rect x={-44} y={-60} width={30} height={22} rx={6} fill="none" stroke={ink} strokeWidth={3} opacity={0.5} />
          </g>
        )}
        {outfit === "robe" && (
          <g>
            <polygon points="-10,-174 52,-174 20,-60" fill="#e8d8c0" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <rect x={-55} y={-72} width={110} height={14} fill="#5a1f2a" stroke={ink} strokeWidth={3} />
          </g>
        )}
        {outfit === "suit" && (
          <g>
            <polygon points="-6,-174 48,-174 20,-95" fill={colors.white} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <polygon points="16,-164 30,-164 23,-95" fill={colors.red} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
          </g>
        )}
        {outfit === "shirt" && (
          <g>
            <path d="M-6 -174 L22 -150 L46 -174" fill="none" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
            <line x1={22} y1={-150} x2={22} y2={-40} stroke={ink} strokeWidth={3} opacity={0.5} />
          </g>
        )}
        {/* бёдра и ремень */}
        <rect x={-54} y={-22} width={108} height={42} rx={18} fill={pants} stroke={ink} strokeWidth={SW} />
        <rect x={-50} y={-16} width={100} height={10} rx={4} fill={ink} opacity={0.7} />
        {/* передняя нога */}
        <Limb ox={22} oy={0} a1={a.ft} a2={a.fs} l1={100} l2={92} w={40} fill={pants} end="shoe" skin={skin} />
        {/* шея и голова */}
        <g transform={`translate(0 ${-174 + headBob}) rotate(${head})`}>
          <rect x={-16} y={-30} width={32} height={36} rx={12} fill={skin} stroke={ink} strokeWidth={SW} />
          <g transform="translate(2 -82)">
            <circle cx={-58} cy={2} r={13} fill={skin} stroke={ink} strokeWidth={SW} />
            <path d="M-62 -2 Q-56 2 -60 8" fill="none" stroke={ink} strokeWidth={3} />
            <circle cx={0} cy={0} r={66} fill={skin} stroke={ink} strokeWidth={SW} />
            <path d="M-30 40 Q0 70 40 40 Q10 56 -30 40 Z" fill={skinDark} opacity={0.5} />
            <g transform={`scale(1.18) translate(${Math.sin(t * 2.2 + 1) * 1.2} 0)`}>
              <path d="M-57 2 C-58 -58, 30 -80, 58 -28 C60 -16, 56 -10, 54 -14 C40 -44, 8 -52, -16 -36 C-34 -24, -46 -10, -50 8 C-54 8, -57 6, -57 2 Z" fill={hair} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M-20 -48 C-4 -62, 24 -60, 40 -44" fill="none" stroke="#3a3346" strokeWidth={4} strokeLinecap="round" />
            </g>
            <circle cx={2} cy={16} r={9} fill="#e58a8a" opacity={0.3} />
            <circle cx={50} cy={16} r={9} fill="#e58a8a" opacity={0.3} />
            {!blink ? (
              <>
                <circle cx={12} cy={-4} r={eyeR} fill={colors.white} stroke={ink} strokeWidth={3} />
                <circle cx={41} cy={-4} r={eyeR} fill={colors.white} stroke={ink} strokeWidth={3} />
                <circle cx={15 + px} cy={-3 + py} r={5.5 - 1.5 * flinch} fill={ink} />
                <circle cx={44 + px} cy={-3 + py} r={5.5 - 1.5 * flinch} fill={ink} />
                <circle cx={13.5 + px} cy={-5.5 + py} r={2} fill={colors.white} />
                <circle cx={42.5 + px} cy={-5.5 + py} r={2} fill={colors.white} />
                {tired && (
                  <>
                    <path d="M0 -10 Q12 -4 24 -10 L24 -16 L0 -16 Z" fill={skin} />
                    <path d="M29 -10 Q41 -4 53 -10 L53 -16 L29 -16 Z" fill={skin} />
                    <path d="M1 -9 Q12 -3 23 -9" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
                    <path d="M30 -9 Q41 -3 52 -9" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
                  </>
                )}
              </>
            ) : (
              <>
                <path d="M2 -4 Q12 2 22 -4" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
                <path d="M31 -4 Q41 2 51 -4" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
              </>
            )}
            <path d={scared ? "M0 -32 L22 -26" : tired ? "M2 -20 L22 -24" : "M2 -24 L22 -24"} stroke={ink} strokeWidth={5} strokeLinecap="round" />
            <path d={scared ? "M32 -28 L52 -34" : tired ? "M32 -24 L52 -20" : "M32 -24 L52 -24"} stroke={ink} strokeWidth={5} strokeLinecap="round" />
            <path d="M30 4 Q36 12 28 15" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
            {scared ? (
              <ellipse cx={28} cy={30} rx={9} ry={12} fill="#3a1f1f" stroke={ink} strokeWidth={3} />
            ) : talk > 0.1 ? (
              <ellipse cx={28} cy={28} rx={8 + 4 * talk} ry={2 + 9 * talk} fill="#3a1f1f" stroke={ink} strokeWidth={3} />
            ) : smile ? (
              <path d="M12 24 Q28 40 44 24" stroke={ink} strokeWidth={4} fill="#3a1f1f" strokeLinecap="round" />
            ) : tired ? (
              <path d="M16 30 L40 30" stroke={ink} strokeWidth={4} strokeLinecap="round" />
            ) : (
              <path d="M16 28 Q28 34 40 28" stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
            )}
            {mustache && <path d="M8 18 C18 8, 40 10, 48 20 C40 16, 18 18, 8 18 Z" fill={hair} stroke={ink} strokeWidth={3} />}
            {glasses && (
              <g fill="none" stroke={ink} strokeWidth={4}>
                <circle cx={12} cy={-4} r={17} />
                <circle cx={41} cy={-4} r={17} />
                <line x1={29} y1={-4} x2={24} y2={-4} />
              </g>
            )}
            {scared && <path d="M62 -40 Q70 -28 62 -20 Q54 -28 62 -40 Z" fill="#7cc4ff" stroke={ink} strokeWidth={3} />}
          </g>
        </g>
        {/* передняя рука */}
        <Limb ox={32} oy={-150} a1={fu} a2={fl} l1={92} l2={80} w={34} fill={limbFill} end="hand" skin={skin} />
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
