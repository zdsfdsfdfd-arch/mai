// Единая палитра и типографика в духе референса: плоский вектор, тёмный фон, акценты.
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const colors = {
  bg: "#0b1020",
  bg2: "#141b33",
  panel: "#1c2440",
  panelLight: "#2a3458",
  line: "#3a4670",
  white: "#f5f3ea",
  dim: "#8c91a6",
  beige: "#e9dcc2",
  beigeInk: "#1a1a1a",
  red: "#e5392f",
  yellow: "#f3c03a",
  green: "#3ec66d",
  blue: "#3f8cff",
  skin: "#e8c9a8",
  hair: "#1d1a24",
  jacket: "#243a73",
  collar: "#d9d6cf",
  pants: "#1b1f2e",
  door: "#7a4b2a",
  doorDark: "#5a3419",
  lightCone: "#f7e7b0",
  ink: "#0a0c14",
  shadow: "#070910",
};

// Стиль «стикер»: толстая тёмная обводка у всех нарисованных объектов и жёсткая смещённая тень.
export const ink = colors.ink;
export const SW = 7;
export const stroke = { stroke: colors.ink, strokeWidth: SW, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
export const hardShadow = (d = 8) => `${d}px ${d}px 0 ${colors.ink}`;

export const fonts = {
  display: "'Sofia Sans Condensed', 'Arial Narrow', sans-serif",
  text: "'Inter', Arial, sans-serif",
  mono: "'JetBrains Mono', 'DejaVu Sans Mono', monospace",
};
