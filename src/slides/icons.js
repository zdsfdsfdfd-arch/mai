// Custom line icons, 64×64 grid, 1.5px stroke. `.ac` parts take the accent colour.
// Paths carry pathLength="1" so the deck can draw them in (class "draw").

const P = (d, cls = '') => `<path d="${d}" pathLength="1" class="draw ${cls}"/>`;
const R = (x, y, w, h, cls = '', rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" pathLength="1" class="draw ${cls}"/>`;
const C = (cx, cy, r, cls = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" pathLength="1" class="draw ${cls}"/>`;

const shapes = {
  /* — Lean principles — */
  value: P('M14 24 22 12h20l8 12-18 28z') + P('M14 24h36') + P('M26 24l6 28 6-28', 'ac') + P('M22 12l4 12 6-12 6 12 4-12', 'ac'),
  nowaste: P('M6 32h14M44 32h14') + C(32, 32, 11, 'ac') + P('M27 27l10 10M37 27 27 37', 'ac'),
  kaizen: P('M8 54h12V44h12V34h12V24h12') + P('M36 10h16v16', 'ac') + P('M52 10 34 28', 'ac'),
  people: C(24, 21, 7) + P('M11 50c0-9 5-14 13-14s13 5 13 14') + C(43, 24, 6, 'ac') + P('M38 37c1.5-.7 3.2-1 5-1 6.5 0 10 5 10 12', 'ac'),
  flow: P('M6 32h50') + P('M50 26l6 6-6 6') + R(12, 24, 12, 12) + R(30, 24, 12, 12, 'ac'),

  /* — Mass production traits — */
  batch: R(8, 40, 16, 14) + R(24, 40, 16, 14) + R(40, 40, 16, 14) + R(16, 26, 16, 14) + R(32, 26, 16, 14) + R(24, 12, 16, 14, 'ac'),
  warehouse: P('M8 26 32 12l24 14v28H8z') + P('M18 54V34h28v20') + P('M18 41h28M18 48h28', 'ac'),
  hourglass: P('M18 9h28M18 55h28') + P('M21 9c0 12 11 15 11 23S21 43 21 55M43 9c0 12-11 15-11 23s11 11 11 23') + P('M26 49h12l-6-6z', 'ac'),
  demand: P('M8 56h48M8 56V8') + P('M12 44c8-2 12-16 20-16s12 14 20 8', 'ac') + P('M12 34h42'),

  /* — 7 wastes (+1) — */
  overproduction: R(8, 40, 14, 14) + R(22, 40, 14, 14) + R(15, 26, 14, 14) + R(42, 10, 14, 14, 'ac') + P('M49 14v6M46 17h6', 'ac') + P('M36 54h20', 'ac'),
  waiting: C(32, 35, 19) + P('M32 24v11l8 6', 'ac') + P('M26 8h12M32 8v8'),
  transport: R(8, 8, 14, 14) + P('M15 26v8h34v9H15v9h33', 'ac') + P('M44 47l5 5-5 5', 'ac'),
  overprocessing: C(27, 35, 9) + P('M27 19v5M27 46v5M11 35h5M38 35h5M15.7 23.7l3.5 3.5M34.8 42.8l3.5 3.5M15.7 46.3l3.5-3.5M34.8 27.2l3.5-3.5') + P('M50 6v12M44 12h12M53 26v8M49 30h8', 'ac'),
  inventory: P('M10 8v48M54 8v48M10 23h44M10 39h44M10 56h44') + R(14, 13, 10, 10) + R(27, 15, 8, 8) + R(38, 28, 12, 11, 'ac') + R(14, 45, 12, 11) + R(30, 45, 10, 11),
  motion: C(18, 12, 5) + P('M18 18v16M18 34l-7 18M18 34l7 18M18 24l-8 8M18 24l9 7') + P('M34 48c4-14 10-24 22-31', 'ac') + P('M49 14l7 3-2 7', 'ac'),
  defects: P('M32 7l21 12v26L32 57 11 45V19z') + P('M31 7l-5 14 9 7-7 10 7 8-4 11', 'ac'),
  talent: P('M24 42c-6-4-10-10-10-17a18 18 0 0 1 36 0c0 7-4 13-10 17v6H24z') + P('M26 55h12') + P('M27 35l5-9 5 9M29 31h6', 'ac'),

  /* — Timeline — */
  kanban: R(14, 7, 36, 50, '', 2) + P('M20 17h24M20 25h16M20 33h20') + R(20, 42, 11, 8, 'ac'),
  crisis: P('M22 9S10 26 10 34a12 12 0 0 0 24 0c0-8-12-25-12-25z') + P('M47 14v34M41 42l6 6 6-6', 'ac'),
  globe: C(32, 32, 22) + P('M10 32h44M32 10c-8 8-8 36 0 44M32 10c8 8 8 36 0 44') + P('M15 20c11 4 23 4 34 0', 'ac'),
  book: P('M8 14c8-2 16-2 24 4v36c-8-6-16-6-24-4z') + P('M56 14c-8-2-16-2-24 4v36c8-6 16-6 24-4z') + P('M39 25h10M39 32h10', 'ac'),
  cross: R(9, 9, 46, 46, '', 4) + P('M27 18h10v9h9v10h-9v9H27v-9h-9V27h9z', 'ac'),
  screen: R(7, 10, 50, 34, '', 2) + P('M24 10v34M40 10v34M24 54h16M32 44v10') + R(11, 16, 9, 6, 'ac') + R(28, 16, 8, 6) + R(11, 26, 9, 6) + R(44, 16, 9, 6),
  chip: R(18, 18, 28, 28, '', 3) + P('M26 10v8M32 10v8M38 10v8M26 46v8M32 46v8M38 46v8M10 26h8M10 32h8M10 38h8M46 26h8M46 32h8M46 38h8') + R(26, 26, 12, 12, 'ac', 1),

  /* — Domains — */
  car: P('M6 43V32l9-13h25l11 13h7v11z') + P('M15 32h36M27 19v13') + C(18, 45, 5, 'ac') + C(45, 45, 5, 'ac'),
  factory: P('M8 54V30l12 8v-8l12 8v-8l12 8V12h8v42z') + P('M16 46h6M28 46h6M40 46h6', 'ac'),
  medicine: P('M32 53S10 39 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 15-22 29-22 29z') + P('M15 32h9l4-8 6 14 4-6h11', 'ac'),
  code: R(7, 11, 50, 42, '', 3) + P('M7 20h50') + P('M26 30l-6 6 6 6M38 30l6 6-6 6', 'ac'),
  truck: P('M5 15h33v27H5zM38 25h11l9 9v8H38z') + C(16, 46, 5, 'ac') + C(47, 46, 5, 'ac'),
  bank: P('M8 24 32 10l24 14z') + P('M10 48h44M7 55h50') + P('M16 28v16M26 28v16M38 28v16M48 28v16') + P('M28 19h8', 'ac'),
  restaurant: P('M9 44h46M14 44a18 18 0 0 1 36 0') + P('M32 26v-5M28 21h8') + P('M7 51h50', 'ac'),
  education: P('M4 24 32 12l28 12-28 12z') + P('M16 30v12c8 6 24 6 32 0V30') + P('M58 25v15', 'ac'),

  /* — Technology — */
  automation: C(32, 32, 7) + P('M32 15v5M32 44v5M15 32h5M44 32h5') + P('M50 20A22 22 0 0 0 13 23M14 44a22 22 0 0 0 37-3', 'ac') + P('M13 14v9h9M51 50v-9h-9', 'ac'),
  iot: C(32, 42, 4, 'ac') + P('M23 33a13 13 0 0 1 18 0M16 26a23 23 0 0 1 32 0M9 19a33 33 0 0 1 46 0') + P('M32 46v10M24 56h16'),
  data: P('M14 14c0-3.3 8-6 18-6s18 2.7 18 6-8 6-18 6-18-2.7-18-6z') + P('M14 14v36c0 3.3 8 6 18 6s18-2.7 18-6V14') + P('M14 26c0 3.3 8 6 18 6s18-2.7 18-6', 'ac') + P('M14 38c0 3.3 8 6 18 6s18-2.7 18-6'),
  robot: P('M8 56h28M14 56v-6h16v6') + P('M22 50 30 29l17-7') + C(30, 29, 3.5) + C(22, 50, 3.5) + P('M47 22l7-7M47 22l7 5', 'ac'),
};

export function icon(name, { size = 56, cls = '' } = {}) {
  const body = shapes[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="icon ${cls}" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}
