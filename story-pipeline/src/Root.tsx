import React from "react";
import { Composition } from "remotion";
import scriptJson from "../episode/script.json";
import timelineJson from "../episode/timeline.json";
import { Episode } from "./Episode";
import { H, W } from "./theme";
import type { MusicConfig, Timeline } from "./types";

const timeline = timelineJson as unknown as Timeline;
const music = ((scriptJson as { music?: MusicConfig }).music ?? {}) as MusicConfig;

export const Root: React.FC = () => {
  return (
    <Composition
      id="Episode"
      component={Episode}
      durationInFrames={timeline.totalFrames}
      fps={timeline.fps}
      width={W}
      height={H}
      defaultProps={{ timeline, music }}
    />
  );
};
