import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Captions } from "./components/Captions";
import { StatusPlaque, TopPlaque, Watermark } from "./components/Overlays";
import { useFonts } from "./fonts";
import { SceneView } from "./scenes";
import { colors, fonts } from "./theme";
import type { MusicConfig, SceneTimeline, Timeline } from "./types";

const SceneLayer: React.FC<{ scene: SceneTimeline; timeline: Timeline }> = ({ scene, timeline }) => {
  const noTopPlaque = scene.type === "title_card" || scene.type === "end_card";
  return (
    <AbsoluteFill>
      <SceneView scene={scene} />
      {!noTopPlaque && <TopPlaque part={timeline.part} dayLabel={timeline.dayLabel} spec={scene.topPlaque} />}
      {scene.status && <StatusPlaque text={scene.status} />}
      <Captions phrases={scene.phrases} />
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
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
    const gap = Math.min(1, dist / 0.35); // 0 = под голосом, 1 = пауза
    const fadeIn = Math.min(1, t / 1.0);
    return base * (duck + (1 - duck) * gap) * fadeIn;
  };

  return <Audio src={staticFile("audio/music.wav")} volume={volumeAt} />;
};

export const Episode: React.FC<{ timeline: Timeline; music?: MusicConfig }> = ({ timeline, music = {} }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: colors.bg, fontFamily: fonts.display, color: colors.white }}>
      {timeline.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames} name={`${scene.id} ${scene.type}`}>
          <SceneLayer scene={scene} timeline={timeline} />
        </Sequence>
      ))}
      {music.enabled !== false && <MusicTrack timeline={timeline} music={music} />}
      <Watermark channel={timeline.channel} />
    </AbsoluteFill>
  );
};
