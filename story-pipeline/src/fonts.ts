import { continueRender, delayRender, staticFile } from "remotion";

// Шрифты самохостинг (woff2 из репозитория сайта). Загружаем через FontFace API,
// чтобы рендер дождался шрифтов и не было кадров с запасным шрифтом.
const faces: Array<[string, string, number]> = [
  ["Sofia Sans Condensed", "fonts/sofia-sans-condensed-900-cyrillic.woff2", 900],
  ["Sofia Sans Condensed", "fonts/sofia-sans-condensed-900-cyrillic-ext.woff2", 900],
  ["Sofia Sans Condensed", "fonts/sofia-sans-condensed-900-latin.woff2", 900],
  ["Sofia Sans Condensed", "fonts/sofia-sans-condensed-900-latin-ext.woff2", 900],
  ["Inter", "fonts/inter-800-cyrillic.woff2", 800],
  ["Inter", "fonts/inter-800-cyrillic-ext.woff2", 800],
  ["Inter", "fonts/inter-800-latin.woff2", 800],
  ["Inter", "fonts/inter-600-cyrillic.woff2", 600],
  ["Inter", "fonts/inter-600-latin.woff2", 600],
];

let loaded: Promise<void> | null = null;

export const loadFonts = (): Promise<void> => {
  if (loaded) return loaded;
  loaded = Promise.all(
    faces.map(async ([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, { weight: String(weight) });
      await face.load();
      document.fonts.add(face);
    }),
  ).then(() => undefined);
  return loaded;
};

export const useFonts = () => {
  const handle = delayRender("fonts");
  loadFonts().then(() => continueRender(handle));
};
