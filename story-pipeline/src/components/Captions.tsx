import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "../anim";
import { colors, fonts, ink } from "../theme";
import type { Phrase } from "../types";

// Субтитры-караоке: фраза появляется целиком, слова по одному становятся белыми в темпе речи,
// акцентные слова сразу жёлтые или красные. Размер подстраивается под длину фразы (не больше 3–4 строк).
const HOLD_AFTER = 0.45;

export const Captions: React.FC<{ phrases: Phrase[] }> = ({ phrases }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const current = phrases.find((p) => t >= p.start && t < p.end + HOLD_AFTER) ?? null;
  if (!current) return null;

  const { opacity, scale } = pop(frame, fps, Math.round(current.start * fps));
  const chars = current.words.reduce((n, w) => n + w.text.length + 1, 0);
  const fontSize = chars > 95 ? 66 : chars > 70 ? 76 : chars > 48 ? 86 : 96;

  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        top: 1290,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "flex-start",
        gap: `0 ${fontSize * 0.22}px`,
        rowGap: 0,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "50% 30%",
        fontFamily: fonts.display,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.02,
        letterSpacing: 1,
        textTransform: "uppercase",
        textAlign: "center",
      }}
    >
      {current.words.map((w, i) => {
        const spoken = t >= w.start - 0.05;
        const color = w.accent === "yellow" ? colors.yellow : w.accent === "red" ? colors.red : spoken ? colors.white : colors.dim;
        const justSpoken = spoken && t - w.start < 0.12 && !w.accent;
        return (
          <span
            key={i}
            style={{
              color,
              WebkitTextStroke: `${Math.max(3, fontSize / 30)}px ${ink}`,
              paintOrder: "stroke fill",
              textShadow: `${fontSize / 16}px ${fontSize / 16}px 0 ${ink}`,
              transform: justSpoken ? "scale(1.06)" : undefined,
              display: "inline-block",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
