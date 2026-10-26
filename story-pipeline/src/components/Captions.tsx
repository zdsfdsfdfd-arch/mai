import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { colors, fonts } from "../theme";
import type { Phrase } from "../types";

// Субтитры в стиле референса: фраза появляется целиком тусклым серым,
// слова по одному становятся белыми в темпе озвучки, акцентные слова сразу жёлтые или красные.
const HOLD_AFTER = 0.45; // сек, сколько держать фразу после последнего слова

export const Captions: React.FC<{ phrases: Phrase[] }> = ({ phrases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const current = phrases.find((p) => t >= p.start && t < p.end + HOLD_AFTER) ?? null;
  if (!current) return null;

  const { opacity, scale } = pop(frame, fps, Math.round(current.start * fps));

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 1290,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "flex-start",
        gap: "0 22px",
        rowGap: 2,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "50% 50%",
        fontFamily: fonts.display,
        fontWeight: 900,
        fontSize: 96,
        lineHeight: 1.02,
        letterSpacing: 1,
        textTransform: "uppercase",
        textAlign: "center",
      }}
    >
      {current.words.map((w, i) => {
        const spoken = t >= w.start - 0.05;
        const color = w.accent === "yellow" ? colors.yellow : w.accent === "red" ? colors.red : spoken ? colors.white : colors.dim;
        return (
          <span
            key={i}
            style={{
              color,
              WebkitTextStroke: "3px #07090f",
              paintOrder: "stroke fill",
              textShadow: "0 8px 22px rgba(0,0,0,0.65)",
              transition: "none",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
