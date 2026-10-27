import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "./components/Captions";
import { StatusPlaque, TopPlaque, Watermark } from "./components/Overlays";
import { useFonts } from "./fonts";
import { SceneView } from "./scenes";
import { cuesForScene } from "./sfx";
import { colors, fonts } from "./theme";
import type { MusicConfig, SceneTimeline, Timeline } from "./types";

// Монтажный «панч»: сцена входит с лёгким наездом камеры и короткой вспышкой.
const PunchIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 10], [1.06, 1], { extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const flash = interpolate(frame, [0, 3], [0.22, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "50% 45%" }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: colors.white, opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

const SceneLayer: React.FC<{ scene: SceneTimeline; timeline: Timeline; isFirst: boolean; sfxVolume: number }> = ({ scene, timeline, isFirst, sfxVolume }) => {
  const noTopPlaque = scene.type === "title_card" || scene.type === "end_card";
  const cues = useMemo(() => cuesForScene(scene, timeline.fps, isFirst), [scene, timeline.fps, isFirst]);
  return (
    <AbsoluteFill>
      <PunchIn>
        <SceneView scene={scene} />
      </PunchIn>
      {!noTopPlaque && <TopPlaque part={timeline.part} dayLabel={timeline.dayLabel} spec={scene.topPlaque} />}
      {scene.status && <StatusPlaque text={scene.status} />}
      <Captions phrases={scene.phrases} />
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
      {timeline.scenes.map((scene, i) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames} name={`${scene.id} ${scene.type}`}>
          <SceneLayer scene={scene} timeline={timeline} isFirst={i === 0} sfxVolume={sfxVolume} />
        </Sequence>
      ))}
      {music.enabled !== false && <MusicTrack timeline={timeline} music={music} />}
      <Watermark channel={timeline.channel} />
    </AbsoluteFill>
  );
};
