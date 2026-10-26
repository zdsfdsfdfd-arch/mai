import React from "react";
import { Composition } from "remotion";
import timelineJson from "../episode/timeline.json";
import { Episode } from "./Episode";
import { H, W } from "./theme";
import type { Timeline } from "./types";

const timeline = timelineJson as unknown as Timeline;

export const Root: React.FC = () => {
  return (
    <Composition
      id="Episode"
      component={Episode}
      durationInFrames={timeline.totalFrames}
      fps={timeline.fps}
      width={W}
      height={H}
      defaultProps={{ timeline }}
    />
  );
};
