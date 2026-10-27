import { sec } from "./anim";
import * as B from "./beats";
import type { SceneTimeline } from "./types";

// Звуковые реплики (cue) по сценам: кадр внутри сцены, имя эффекта из public/sfx, громкость.
// Моменты берутся из beats.ts, то есть совпадают с анимацией.
export type Cue = { frame: number; name: string; volume: number };

export function cuesForScene(scene: SceneTimeline, fps: number, isFirst: boolean): Cue[] {
  const cues: Cue[] = [];
  const add = (frame: number, name: string, volume: number) => {
    if (frame >= 0 && frame < scene.durationFrames) cues.push({ frame: Math.round(frame), name, volume });
  };
  const s = (x: number) => sec(x, fps);
  const p = scene.props ?? {};

  if (!isFirst && scene.type !== "end_card") add(0, "cut", 0.45);
  if (scene.type !== "title_card" && scene.type !== "end_card") add(6, "pop", 0.4);
  if (scene.status) add(10, "pop", 0.35);
  for (const ph of scene.phrases) add(s(ph.start), "click", 0.12);

  switch (scene.type) {
    case "title_card":
      add(2, "boom", 0.8);
      add(2, "whoosh", 0.4);
      add(12, "pop", 0.45);
      add(s(B.titleBlackoutAt(scene)), "switch", 0.6);
      add(s(B.titleBlackoutAt(scene)) + 2, "boom", 0.35);
      add(s(B.titlePhoneAt(scene)), "pop", 0.4);
      break;
    case "end_card":
      add(0, "whoosh", 0.4);
      add(4, "boom", 0.7);
      add(14, "pop", 0.45);
      add(24, "pop", 0.45);
      break;
    case "building_cutaway":
      if (p.litWindows?.length) {
        add(s(p.litAt ?? 1.4), "chime", 0.5);
      } else {
        add(s(B.blackoutAt(scene)), "switch", 0.5);
        add(s(B.blackoutAt(scene)) + 6, "boom", 0.3);
        if (p.hud) add(s(B.hudAt(scene)) + 8, "click", 0.4);
        add(s(scene.phrases[1]?.start ?? 2.6), "whoosh", 0.25);
      }
      break;
    case "phone_screen":
      add(8, "beep", 0.4);
      add(s(scene.phrases[1]?.start ?? 1.5), "pop", 0.3);
      add(s(B.phoneStatusAt(scene)), "callfail", 0.45);
      add(s(B.phoneBatteryDropAt(scene)), "click", 0.5);
      break;
    case "stat_callouts":
      add(s(B.airAt(scene)), "whoosh", 0.3);
      add(s(B.dimsAt(scene)), "click", 0.4);
      for (const t of B.calloutTimes(scene)) add(s(t), "pop", 0.5);
      break;
    case "character_scene":
      for (const k of B.knockTimes(scene)) add(s(k), "knock", 0.75);
      if (scene.character?.pose === "sit" && p.light === "phone") {
        add(s(B.sitAt(scene)), "whoosh", 0.3);
        add(s(B.lightOffAt(scene)), "switch", 0.5);
      }
      break;
    case "cabin_diagram": {
      const c = B.cabinTimes(scene);
      add(s(c.hatchAt), "pop", 0.5);
      add(s(c.doorsAt), "pop", 0.5);
      add(s(c.doorsAt), "boom", 0.35);
      add(s(c.shaftAt), "whoosh", 0.45);
      add(s(c.shaftAt), "pop", 0.45);
      break;
    }
    case "sound_diagram": {
      add(s(B.wavesAt(scene)), "knock", 0.5);
      add(s(B.wavesAt(scene)) + 4, "rise", 0.5);
      for (const t of B.reachTimes(scene)) add(s(t), "click", 0.35);
      add(s(B.reachLabelAt(scene)), "pop", 0.45);
      break;
    }
    case "city_night":
      add(s(B.cityLitAt(scene)), "chime", 0.5);
      add(s(B.cityListenAt(scene)), "whoosh", 0.25);
      add(s(B.cityPhoneAt(scene)), "pop", 0.4);
      add(s(B.cityPhoneAt(scene)) + 2, "beep", 0.3);
      break;
    default:
      break;
  }
  return cues;
}
