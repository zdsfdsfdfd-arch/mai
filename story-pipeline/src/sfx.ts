import { sec } from "./anim";
import * as B from "./beats";
import * as N from "./beats2";
import type { SceneTimeline } from "./types";

// Реплики для сцен серии «Сосед снизу» (варианты сцен по props).
function neighborCues(scene: SceneTimeline, fps: number, add: (f: number, n: string, v: number) => void): boolean {
  const s = (x: number) => sec(x, fps);
  const p = scene.props ?? {};
  if (scene.type === "title_card" && p.hook === "neighbor") {
    add(2, "boom", 0.7);
    add(12, "pop", 0.4);
    add(s(N.titleHeartAt(scene)), "heart", 0.6);
    add(s(N.titleWhoAt(scene)), "bleat", 0.6);
    add(s(N.titleWhoAt(scene)) + 6, "pop", 0.4);
    return true;
  }
  if (scene.type === "building_cutaway" && p.mode === "neighbor") {
    add(s(N.floorDownAt(scene)), "whoosh", 0.3);
    add(s(N.lifeAt(scene)), "heart", 0.6);
    add(s(N.lifeAt(scene)) + 6, "click", 0.4);
    add(s(N.bleatAt(scene)), "bleat", 0.6);
    add(s(N.bleatAt(scene)) + 4, "trot", 0.4);
    return true;
  }
  if (scene.type === "sound_diagram" && p.source === "floor") {
    add(s(N.trotAt(scene)), "trot", 0.6);
    add(s(N.trotAt(scene)) + 8, "pop", 0.35);
    add(s(N.bleat2At(scene)), "bleat", 0.6);
    add(s(N.quoteAt(scene)), "pop", 0.45);
    return true;
  }
  if (scene.type === "stat_callouts" && p.diagram === "lift") {
    const times = N.cardPhraseTimes(scene);
    times.forEach((t, i) => {
      add(s(t), "pop", 0.5);
      if (i === 0) add(s(t) + 4, "whoosh", 0.3);
    });
    add(s(N.noteAt(scene)), "pop", 0.45);
    return true;
  }
  if (scene.type === "stat_callouts" && p.diagram === "invite") {
    add(s(scene.phrases[1]?.start ?? 2), "whoosh", 0.4);
    add(s(scene.phrases[2]?.start ?? 3.6), "stamp", 0.7);
    [3, 4, 5, 6].forEach((i) => add(s(scene.phrases[i]?.start ?? 4 + i), "pop", 0.35));
    for (const t of N.cardPhraseTimes(scene)) add(s(t), "pop", 0.5);
    return true;
  }
  if (scene.type === "character_scene" && p.setting === "door") {
    if (scene.character?.pose === "knock") {
      for (const k of N.doorKnockTimes(scene)) add(s(k), "knock", 0.75);
      add(s(N.doorOpenAt(scene)), "creak", 0.6);
      add(s(N.zinaPeekAt(scene)), "pop", 0.4);
      add(s(N.zinaPeekAt(scene)) + 6, "bleat", 0.45);
      add(s(N.halfYearAt(scene)), "heart", 0.6);
    } else {
      add(s(N.bowAt(scene)), "pop", 0.5);
      add(s(N.squintAt(scene)), "boom", 0.45);
      add(s(N.squintAt(scene)) + 10, "bleat", 0.35);
    }
    return true;
  }
  if (scene.type === "character_scene" && p.setting === "room") {
    const second = (p.sheep ?? []).some((x: { fromLeft?: boolean }) => x.fromLeft);
    if (!second) {
      add(4, "crunch", 0.5);
      add(s(N.bowAt(scene)), "pop", 0.5);
      add(s(N.stampAt(scene)), "stamp", 0.7);
      add(s(N.leavesAt(scene)), "crunch", 0.55);
      add(s(N.leavesAt(scene)) + 14, "crunch", 0.45);
    } else {
      add(s(N.panAt(scene)), "whoosh", 0.35);
      add(s(N.secondSheepAt(scene)), "trot", 0.5);
      add(s(N.glanceAt(scene)), "pop", 0.4);
      add(s(N.discussedAt(scene)), "boom", 0.45);
      add(s(N.discussedAt(scene)) + 12, "bleat", 0.3);
    }
    return true;
  }
  if (scene.type === "character_scene" && p.setting === "entrance") {
    add(4, "trot", 0.25);
    add(s(N.suitAt(scene)), "whoosh", 0.3);
    add(s(N.suitAt(scene)) + 4, "pop", 0.45);
    add(s(N.expandAt(scene)), "pop", 0.3);
    add(s(N.pointUpAt(scene)), "whoosh", 0.4);
    return true;
  }
  if (scene.type === "floor_plan") {
    add(s(N.sunAt(scene)), "pop", 0.45);
    add(s(N.planSheepAt(scene)), "crunch", 0.6);
    add(s(N.planSheepAt(scene)) + 12, "crunch", 0.5);
    add(s(N.planSheepAt(scene)) + 6, "pop", 0.4);
    return true;
  }
  if (scene.type === "dialogue") {
    const lines: Array<{ text: string }> = p.lines ?? [];
    N.bubbleTimes(scene, lines.length).forEach((t, i) => {
      add(s(t), "pop", 0.45);
      if (lines[i] && lines[i].text === lines[i].text.toUpperCase() && lines[i].text.length > 6) add(s(t), "boom", 0.35);
    });
    return true;
  }
  if (scene.type === "roof") {
    add(s(scene.phrases[0]?.start ?? 0.4), "rise", 0.5);
    add(s(N.roofRevealAt(scene)), "whoosh", 0.45);
    [0, 4, 8].forEach((d) => add(s(N.roofBowsAt(scene)) + d, "pop", 0.4));
    add(s(N.roofLabelAt(scene)), "pop", 0.45);
    add(s(N.haremAt(scene)), "stamp", 0.8);
    add(s(N.haremAt(scene)) + 2, "bleats", 0.6);
    return true;
  }
  if (scene.type === "end_card" && p.blackout) {
    add(s(N.arrowAt(scene)), "pop", 0.5);
    [0, 8, 16].forEach((d) => add(s(N.heartsAt(scene)) + d, "heart", 0.4));
    add(s(N.blackoutAt(scene)), "boom", 0.8);
    add(s(N.blackoutAt(scene)) + 2, "bleats", 0.8);
    add(s(N.blackoutAt(scene) + 1.2), "pop", 0.45);
    add(s(N.blackoutAt(scene) + 1.5), "pop", 0.4);
    return true;
  }
  return false;
}

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

  if (neighborCues(scene, fps, add)) return cues;

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
