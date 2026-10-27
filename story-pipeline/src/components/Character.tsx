import React from "react";
import { interpolate } from "remotion";
import { colors } from "../theme";

// Персонаж-рэгдолл: круглая голова с лицом, шея, туловище-капсула, руки и ноги из двух капсул
// с круглыми суставами, кисти и ступни. Конечности качаются с запаздыванием и затуханием,
// при падении обмякают. Интерфейс совместим с прежним персонажем (та же рамка 300×560, ступни у низа).

export type Pose = "stand" | "point" | "sit" | "knock" | "walk" | "run" | "cover" | "fall" | "lie";
export type Outfit = "jacket" | "robe" | "suit" | "shirt";
export type Mood = "neutral" | "scared" | "smile" | "tired";

type Props = {
  pose: Pose;
  frame: number;
  fps: number;
  knockAt?: number[];
  talkAt?: number[];
  sitAt?: number; // плавный переход stand → sit
  fallK?: number; // 0..1 для позы fall (обмякание)
  scale?: number;
  x?: number;
  y?: number;
  flip?: boolean;
  outfit?: Outfit;
  mustache?: boolean;
  glasses?: boolean;
  mood?: Mood;
  opacity?: number;
};

const cloth = (o: Outfit) => (o === "robe" ? "#7a2d3a" : o === "suit" ? "#141622" : o === "shirt" ? "#e9e2c9" : colors.jacket);
const smooth = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Капсула от (0,0) вниз на длину len, ширина w; на конце сустав.
const Seg: React.FC<{ len: number; w: number; fill: string; joint?: boolean; children?: React.ReactNode }> = ({ len, w, fill, joint = true, children }) => (
  <g>
    <rect x={-w / 2} y={-w / 2} width={w} height={len + w / 2} rx={w / 2} fill={fill} />
    {joint && <circle cx={0} cy={0} r={w * 0.42} fill="#000" opacity={0.18} />}
    {children}
  </g>
);

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

export const Character: React.FC<Props> = ({ pose, frame, fps, knockAt = [], talkAt = [], sitAt, fallK = 0, scale = 1, x = 0, y = 0, flip = false, outfit = "jacket", mustache = false, glasses = false, mood = "neutral", opacity = 1 }) => {
  const t = frame / fps;
  const c = cloth(outfit);
  const limbFill = outfit === "shirt" ? "#e9e2c9" : c;
  const pants = colors.pants;

  let hit = 0;
  for (const k of knockAt) {
    const d = frame - k * fps;
    if (d >= 0 && d <= 9) hit = Math.max(hit, interpolate(d, [0, 3, 9], [0, 1, 0]));
  }
  let gesture = 0;
  for (const g of talkAt) {
    const d = t - g;
    if (d >= 0 && d <= 0.9) gesture = Math.max(gesture, Math.sin((d / 0.9) * Math.PI));
  }
  let a = poseAngles(pose, t, { hit, gesture, fallK });
  if (sitAt !== undefined) {
    const k = smooth(interpolate(t, [sitAt, sitAt + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    const s = poseAngles("sit", t, { hit, gesture, fallK });
    const st = poseAngles("stand", t, { hit, gesture, fallK });
    const m = (key: keyof Angles) => lerp(st[key], s[key], k);
    a = { fu: m("fu"), fl: m("fl"), bu: m("bu"), bl: m("bl"), ft: m("ft"), fs: m("fs"), bt: m("bt"), bs: m("bs"), torso: m("torso"), head: m("head"), bodyY: m("bodyY"), lean: 0 };
  }
  // вторичное движение: лёгкое запаздывающее покачивание свободных конечностей и дыхание
  const idle = Math.sin(t * 1.7) * 2.5;
  const breathe = Math.sin(t * 2.2) * 2;
  const blink = (frame + 11) % Math.round(fps * 3.4) < 3;

  // пропорции (стоя): голова, шея, торс 170, руки 95+88, ноги 105+105
  const skin = colors.skin;
  const hair = colors.hair;
  const shoe = "#1b1b22";
  const eyeOpen = !blink;
  const scared = mood === "scared";
  const smile = mood === "smile";

  return (
    <svg width={300 * scale} height={560 * scale} viewBox="0 0 300 560" style={{ position: "absolute", left: x, top: y, transform: flip ? "scaleX(-1)" : undefined, overflow: "visible", opacity }}>
      <g transform={`translate(150 ${340 + a.bodyY + breathe * 0.5}) rotate(${a.torso})`}>
        {/* задняя нога от бедра */}
        <g transform={`translate(-22 0) rotate(${a.bt})`}>
          <Seg len={100} w={38} fill={pants}>
            <g transform={`translate(0 100) rotate(${a.bs})`}>
              <Seg len={92} w={32} fill={pants}>
                <rect x={-18} y={88} width={64} height={22} rx={10} fill={shoe} opacity={0.85} />
              </Seg>
            </g>
          </Seg>
        </g>
        {/* задняя рука от плеча */}
        <g transform={`translate(-30 -150) rotate(${a.bu + idle * 0.5})`}>
          <Seg len={92} w={34} fill={limbFill}>
            <g transform={`translate(0 92) rotate(${a.bl})`}>
              <Seg len={82} w={30} fill={limbFill}>
                <circle cx={0} cy={86} r={17} fill={skin} />
              </Seg>
            </g>
          </Seg>
        </g>
        {/* туловище */}
        <rect x={-52} y={-172} width={104} height={178} rx={44} fill={c} />
        {outfit === "robe" && (
          <g>
            <polygon points="-10,-170 52,-170 20,-60" fill="#e8d8c0" />
            <rect x={-52} y={-70} width={104} height={12} fill="#5a1f2a" />
          </g>
        )}
        {outfit === "suit" && (
          <g>
            <polygon points="-6,-170 48,-170 20,-95" fill={colors.white} />
            <polygon points="16,-160 30,-160 23,-95" fill={colors.red} />
          </g>
        )}
        {outfit === "jacket" && <polygon points="0,-170 46,-170 22,-128" fill={colors.collar} />}
        {/* бёдра */}
        <rect x={-50} y={-20} width={100} height={36} rx={18} fill={pants} />
        {/* передняя нога */}
        <g transform={`translate(22 0) rotate(${a.ft})`}>
          <Seg len={100} w={38} fill={pants}>
            <g transform={`translate(0 100) rotate(${a.fs})`}>
              <Seg len={92} w={32} fill={pants}>
                <rect x={-18} y={88} width={64} height={22} rx={10} fill={shoe} />
              </Seg>
            </g>
          </Seg>
        </g>
        {/* шея и голова */}
        <g transform={`translate(0 -172) rotate(${a.head})`}>
          <rect x={-14} y={-26} width={28} height={30} rx={12} fill={skin} />
          <g transform="translate(0 -78)">
            <circle cx={0} cy={0} r={56} fill={skin} />
            {/* волосы */}
            <path d="M-57 2 C-58 -58, 30 -80, 58 -28 C60 -16, 56 -10, 54 -14 C40 -44, 8 -52, -16 -36 C-34 -24, -46 -10, -50 8 C-54 8, -57 6, -57 2 Z" fill={hair} />
            {/* глаза (три четверти, смотрит вправо) */}
            {eyeOpen ? (
              <>
                <circle cx={10} cy={-4} r={9} fill={colors.white} />
                <circle cx={34} cy={-4} r={9} fill={colors.white} />
                <circle cx={13} cy={-3} r={4.5} fill="#0b0b10" />
                <circle cx={37} cy={-3} r={4.5} fill="#0b0b10" />
              </>
            ) : (
              <>
                <rect x={2} y={-5} width={16} height={3} rx={1.5} fill="#0b0b10" />
                <rect x={26} y={-5} width={16} height={3} rx={1.5} fill="#0b0b10" />
              </>
            )}
            {/* брови */}
            <path d={scared ? "M0 -24 L20 -20" : "M2 -18 L18 -18"} stroke="#0b0b10" strokeWidth={3} strokeLinecap="round" />
            <path d={scared ? "M28 -22 L46 -26" : "M28 -18 L44 -18"} stroke="#0b0b10" strokeWidth={3} strokeLinecap="round" />
            {/* рот */}
            {scared ? <ellipse cx={26} cy={24} rx={8} ry={10} fill="#3a1f1f" /> : smile ? <path d="M12 20 Q26 34 40 20" stroke="#3a1f1f" strokeWidth={3} fill="none" strokeLinecap="round" /> : <path d="M16 24 L36 24" stroke="#3a1f1f" strokeWidth={3} strokeLinecap="round" />}
            {mustache && <path d="M8 14 C18 4, 36 6, 44 16 C36 12, 18 14, 8 14 Z" fill={hair} />}
            {glasses && (
              <g fill="none" stroke="#0b0b10" strokeWidth={3}>
                <circle cx={10} cy={-4} r={14} />
                <circle cx={36} cy={-4} r={14} />
                <line x1={24} y1={-4} x2={22} y2={-4} />
              </g>
            )}
          </g>
        </g>
        {/* передняя рука */}
        <g transform={`translate(30 -150) rotate(${a.fu + idle * 0.3})`}>
          <Seg len={92} w={34} fill={limbFill}>
            <g transform={`translate(0 92) rotate(${a.fl})`}>
              <Seg len={82} w={30} fill={limbFill}>
                <circle cx={0} cy={86} r={17} fill={skin} />
              </Seg>
            </g>
          </Seg>
        </g>
      </g>
    </svg>
  );
};

// Чёрный силуэт другого человека, с шагом (тот же риг, залит чёрным).
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
