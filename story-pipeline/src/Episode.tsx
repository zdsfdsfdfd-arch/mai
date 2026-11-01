import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "./components/Captions";
import { Grain, Vignette } from "./components/Fx";
import { StatusPlaque, TopPlaque, Watermark } from "./components/Overlays";
import { useFonts } from "./fonts";
import { SceneView } from "./scenes";
import { cuesForScene } from "./sfx";
import { colors, fonts } from "./theme";
import type { MusicConfig, SceneTimeline, Timeline } from "./types";

// Переходы между сценами с перекрытием OV кадров: шторка по диагонали с цветной кромкой,
// наезд с размытием, сдвиг вверх с параллаксом. Уходящая сцена продолжает жить под входящей.
const OV = 12;
type Kind = "none" | "wipe-l" | "wipe-r" | "zoom" | "push";
const kindFor = (i: number, scene: SceneTimeline): Kind => {
  if (i === 0) return "none";
  if (scene.status && scene.status.startsWith("!")) return "zoom";
  return (["wipe-l", "push", "wipe-r", "zoom"] as Kind[])[i % 4];
};
const expo = (k: number) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));

const TransitionIn: React.FC<{ kind: Kind; children: React.ReactNode }> = ({ kind, children }) => {
  const frame = useCurrentFrame();
  const k = expo(interpolate(frame, [0, OV], [0, 1], { extrapolateRight: "clamp" }));
  if (kind === "none" || k >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (kind === "zoom") {
    const blur = (1 - k) * 14;
    return (
      <AbsoluteFill style={{ opacity: interpolate(k, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }), transform: `scale(${0.82 + 0.18 * k})`, transformOrigin: "50% 45%", filter: `blur(${blur}px)` }}>
        {children}
      </AbsoluteFill>
    );
  }
  if (kind === "push") {
    return <AbsoluteFill style={{ transform: `translateY(${(1 - k) * 100}%)` }}>{children}</AbsoluteFill>;
  }
  const dir = kind === "wipe-l" ? 1 : -1;
  const x = dir === 1 ? -25 + 150 * k : 125 - 150 * k;
  const clip = dir === 1 ? `polygon(0 0, ${x}% 0, ${x - 25}% 100%, 0 100%)` : `polygon(${x}% 0, 100% 0, 100% 100%, ${x - 25}% 100%)`;
  const edge = dir === 1 ? `polygon(${x}% 0, ${x + 4}% 0, ${x - 21}% 100%, ${x - 25}% 100%)` : `polygon(${x - 4}% 0, ${x}% 0, ${x - 25}% 100%, ${x - 29}% 100%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: clip }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: edge, background: colors.yellow }} />
    </AbsoluteFill>
  );
};

const TransitionOut: React.FC<{ kind: Kind; durationFrames: number; children: React.ReactNode }> = ({ kind, durationFrames, children }) => {
  const frame = useCurrentFrame();
  const k = expo(interpolate(frame, [durationFrames, durationFrames + OV], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  if (kind === "none" || k <= 0) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (kind === "zoom") return <AbsoluteFill style={{ transform: `scale(${1 + 0.16 * k})`, transformOrigin: "50% 45%", filter: `blur(${k * 10}px)` }}>{children}</AbsoluteFill>;
  if (kind === "push") return <AbsoluteFill style={{ transform: `translateY(${-30 * k}%)` }}>{children}</AbsoluteFill>;
  return <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * k})`, transformOrigin: "50% 45%" }}>{children}</AbsoluteFill>;
};

// Короткая вспышка в начале сцены поверх перехода.
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 4], [0.18, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: colors.white, opacity: flash, pointerEvents: "none" }} />;
};

const SceneLayer: React.FC<{ scene: SceneTimeline; timeline: Timeline; isFirst: boolean; sfxVolume: number; kindIn: Kind; kindOut: Kind }> = ({ scene, timeline, isFirst, sfxVolume, kindIn, kindOut }) => {
  const noTopPlaque = scene.type === "title_card" || scene.type === "end_card";
  const cues = useMemo(() => cuesForScene(scene, timeline.fps, isFirst), [scene, timeline.fps, isFirst]);
  return (
    <AbsoluteFill>
      <TransitionIn kind={kindIn}>
        <TransitionOut kind={kindOut} durationFrames={scene.durationFrames}>
          <SceneView scene={scene} />
          <Vignette />
          {!noTopPlaque && <TopPlaque part={timeline.part} dayLabel={timeline.dayLabel} spec={scene.topPlaque} />}
          {scene.status && <StatusPlaque text={scene.status} />}
          <Captions phrases={scene.phrases} />
        </TransitionOut>
      </TransitionIn>
      {!isFirst && <Flash />}
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
      {sfxVolume > 0 &&
        cues.map((c, i) => (
          <Sequence key={i} from={c.frame} durationInFrames={90} name={`sfx ${c.name}`}>
            <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.volume * sfxVolume} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};

// Фоновая музыка с «приглушением» под голосом: в паузах громче, во время фраз тише, переходы плавные.
const MusicTrack: React.FC<{ timeline: Timeline; music: MusicConfig }> = ({ timeline, music }) => {
  const base = music.volume ?? 0.22;
  const duck = music.duck ?? 0.35;
  const { fps } = timeline;
  const intervals = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (const s of timeline.scenes) {
      const s0 = s.startFrame / fps;
      for (const p of s.phrases) out.push([s0 + p.start - 0.1, s0 + p.end + 0.3]);
    }
    return out;
  }, [timeline, fps]);

  const volumeAt = (frame: number) => {
    const t = frame / fps;
    let dist = Infinity;
    for (const [a, b] of intervals) {
      if (t >= a && t <= b) {
        dist = 0;
        break;
      }
      dist = Math.min(dist, t < a ? a - t : t - b);
    }
    const gap = Math.min(1, dist / 0.35);
    const fadeIn = Math.min(1, t / 1.0);
    return base * (duck + (1 - duck) * gap) * fadeIn;
  };

  return <Audio src={staticFile("audio/music.wav")} volume={volumeAt} />;
};

export const Episode: React.FC<{ timeline: Timeline; music?: MusicConfig }> = ({ timeline, music = {} }) => {
  useFonts();
  const sfxVolume = music.sfx ?? 1;
  return (
    <AbsoluteFill style={{ background: colors.bg, fontFamily: fonts.display, color: colors.white }}>
      {timeline.scenes.map((scene, i) => {
        const next = timeline.scenes[i + 1];
        const kindOut = next ? kindFor(i + 1, next) : "none";
        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames + (next ? OV : 0)} name={`${scene.id} ${scene.type}`}>
            <SceneLayer scene={scene} timeline={timeline} isFirst={i === 0} sfxVolume={sfxVolume} kindIn={kindFor(i, scene)} kindOut={kindOut} />
          </Sequence>
        );
      })}
      {music.enabled !== false && <MusicTrack timeline={timeline} music={music} />}
      <Watermark channel={timeline.channel} />
      <Grain />
    </AbsoluteFill>
  );
};
