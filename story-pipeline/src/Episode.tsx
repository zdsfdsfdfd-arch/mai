import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Captions } from "./components/Captions";
import { StatusPlaque, TopPlaque, Watermark } from "./components/Overlays";
import { useFonts } from "./fonts";
import { SceneView } from "./scenes";
import { colors, fonts } from "./theme";
import type { SceneTimeline, Timeline } from "./types";

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

export const Episode: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: colors.bg, fontFamily: fonts.display, color: colors.white }}>
      {timeline.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames} name={`${scene.id} ${scene.type}`}>
          <SceneLayer scene={scene} timeline={timeline} />
        </Sequence>
      ))}
      <Watermark channel={timeline.channel} />
    </AbsoluteFill>
  );
};
