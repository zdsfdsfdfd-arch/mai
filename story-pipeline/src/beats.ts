import type { SceneTimeline } from "./types";

// Моменты событий сцены, привязанные к началу фраз озвучки (секунды внутри сцены).
// Одни и те же функции используют и компоненты сцен, и звуковые реплики (sfx.ts),
// поэтому картинка и звук всегда совпадают, какой бы ни была длительность озвучки.

const ps = (scene: SceneTimeline, i: number, fallback: number) => scene.phrases[i]?.start ?? fallback;
const pe = (scene: SceneTimeline, i: number, fallback: number) => scene.phrases[i]?.end ?? fallback;

export const hudAt = (scene: SceneTimeline) => (scene.phrases.length >= 3 ? ps(scene, 2, 0.3) : 0.3);

export const blackoutAt = (scene: SceneTimeline) => ps(scene, 2, 1.5);

export const phoneStatusAt = (scene: SceneTimeline) => scene.props?.statusAt ?? ps(scene, 1, 1.5) + 1.0;

export const phoneBatteryDropAt = (scene: SceneTimeline) => ps(scene, 2, 3.3) + 0.6;

export const calloutTimes = (scene: SceneTimeline): number[] => {
  const cards: Array<{ at: number }> = scene.props?.cards ?? [];
  if (scene.phrases.length >= 4) {
    const s = ps(scene, 3, 4.8);
    const e = pe(scene, 3, s + 4);
    return cards.map((_, i) => (i === 0 ? s + 0.3 : i === 1 ? s + 1.5 : Math.max(s + 2.6, e - 0.9)));
  }
  return cards.map((c) => c.at);
};

export const airAt = (scene: SceneTimeline) => ps(scene, 1, 1.8);
export const dimsAt = (scene: SceneTimeline) => ps(scene, 2, 2.9);

export const knockTimes = (scene: SceneTimeline): number[] => {
  if (scene.character?.pose !== "knock") return [];
  if (scene.phrases.length >= 3) {
    const a = ps(scene, 0, 0.4);
    const b = ps(scene, 2, 2.3);
    return [a + 0.1, a + 0.4, a + 0.7, b + 0.1, b + 0.4, b + 0.7];
  }
  return scene.props?.knockAt ?? [];
};

export const sitAt = (scene: SceneTimeline) => ps(scene, 1, 1.2) + 0.2;
export const lightOffAt = (scene: SceneTimeline) => scene.props?.lightOffAt ?? ps(scene, 2, 2.2) + 0.6;
export const breatheAt = (scene: SceneTimeline) => ps(scene, 3, 3.7);

export const cabinTimes = (scene: SceneTimeline) => ({
  hatchAt: ps(scene, 2, scene.props?.hatchAt ?? 1.8),
  doorsAt: ps(scene, 3, scene.props?.doorsAt ?? 3.6),
  shaftAt: ps(scene, 4, scene.props?.shaftAt ?? 5.2),
});

export const wavesAt = (scene: SceneTimeline) => ps(scene, 1, scene.props?.wavesAt ?? 1.5);
export const reachTimes = (scene: SceneTimeline): number[] => {
  const reach: number[] = scene.props?.reach ?? [];
  const base = ps(scene, 2, wavesAt(scene) + 1.2);
  return reach.map((_, i) => base + 0.3 + i * 0.45);
};
export const reachLabelAt = (scene: SceneTimeline) => ps(scene, 2, wavesAt(scene) + 1.2) + 1.3;

export const cityLitAt = (scene: SceneTimeline) => ps(scene, 0, 0.4) + 0.4;
export const cityListenAt = (scene: SceneTimeline) => ps(scene, 1, 2.4);
export const cityPhoneAt = (scene: SceneTimeline) => ps(scene, 2, 3.5) + 0.4;

export const titleBlackoutAt = (scene: SceneTimeline) => ps(scene, 1, 3.4);
export const titlePhoneAt = (scene: SceneTimeline) => ps(scene, 2, 4.6) + 0.3;

export const sceneEnd = (scene: SceneTimeline, fps: number) => scene.durationFrames / fps;
