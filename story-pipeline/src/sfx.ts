import { sec } from "./anim";
import type { SceneTimeline } from "./types";

// Звуковые реплики (cue) по сценам: кадр внутри сцены, имя эффекта из public/sfx, громкость.
// Моменты совпадают с задержками pop() в компонентах сцен и оверлеев.
export type Cue = { frame: number; name: string; volume: number };

export function cuesForScene(scene: SceneTimeline, fps: number, isFirst: boolean): Cue[] {
  const cues: Cue[] = [];
  const add = (frame: number, name: string, volume: number) => {
    if (frame >= 0 && frame < scene.durationFrames) cues.push({ frame: Math.round(frame), name, volume });
  };
  const p = scene.props ?? {};

  // переход между сценами
  if (!isFirst && scene.type !== "end_card") add(0, "cut", 0.45);

  // верхняя плашка и статус
  if (scene.type !== "title_card" && scene.type !== "end_card") add(6, "pop", 0.4);
  if (scene.status) add(10, "pop", 0.35);

  // тихий тик на смене фразы субтитров
  for (const ph of scene.phrases) add(sec(ph.start, fps), "click", 0.12);

  switch (scene.type) {
    case "title_card":
      add(2, "boom", 0.8);
      add(2, "whoosh", 0.4);
      add(12, "pop", 0.45);
      break;
    case "end_card":
      add(0, "whoosh", 0.4);
      add(4, "boom", 0.7);
      add(14, "pop", 0.45);
      add(24, "pop", 0.45);
      break;
    case "building_cutaway":
      if (p.hud) add(8, "click", 0.4);
      if (p.litAt !== undefined) add(sec(p.litAt, fps), "chime", 0.5);
      break;
    case "phone_screen":
      add(8, "beep", 0.4);
      add(sec(p.statusAt ?? 2.6, fps), "callfail", 0.45);
      break;
    case "stat_callouts":
      for (const c of p.cards ?? []) add(sec(c.at, fps), "pop", 0.5);
      break;
    case "character_scene":
      for (const k of p.knockAt ?? []) add(sec(k, fps), "knock", 0.75);
      if (p.lightOffAt !== undefined) add(sec(p.lightOffAt, fps), "switch", 0.5);
      break;
    case "cabin_diagram":
      add(sec(p.hatchAt, fps), "pop", 0.5);
      add(sec(p.doorsAt, fps), "pop", 0.5);
      add(sec(p.doorsAt, fps), "boom", 0.35);
      add(sec(p.shaftAt, fps), "whoosh", 0.45);
      add(sec(p.shaftAt, fps), "pop", 0.45);
      break;
    case "sound_diagram": {
      const w = sec(p.wavesAt, fps);
      add(w, "rise", 0.5);
      (p.reach ?? []).forEach((_: number, i: number) => add(w + 8 + i * 12, "click", 0.35));
      add(w + 20, "pop", 0.45);
      break;
    }
    case "city_night":
      add(sec(p.litAt ?? 1.0, fps), "chime", 0.5);
      add(sec(p.litAt ?? 1.0, fps) + 10, "pop", 0.4);
      break;
    default:
      break;
  }
  return cues;
}
