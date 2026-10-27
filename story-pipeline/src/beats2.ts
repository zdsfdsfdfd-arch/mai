import type { SceneTimeline } from "./types";

// Моменты событий для сцен серии «Сосед снизу» (привязка к фразам озвучки).
const ps = (scene: SceneTimeline, i: number, fallback: number) => scene.phrases[i]?.start ?? fallback;
const pe = (scene: SceneTimeline, i: number, fallback: number) => scene.phrases[i]?.end ?? fallback;
const last = (scene: SceneTimeline) => scene.phrases[scene.phrases.length - 1];

// дверь соседа (s05): стук на 1-й фразе, дверь открывается на 3-й, Зина на 5-й, «полгода» на 6-й
export const doorKnockTimes = (s: SceneTimeline) => [0.2, 0.5, 0.8].map((d) => ps(s, 0, 0.4) + d);
export const doorOpenAt = (s: SceneTimeline) => ps(s, 2, 4.8);
export const zinaPeekAt = (s: SceneTimeline) => ps(s, 4, 7.5);
export const halfYearAt = (s: SceneTimeline) => ps(s, 5, 8.5);
// взгляд Зины (s06): бантик на 2-й фразе, прищур на 3-й
export const bowAt = (s: SceneTimeline) => ps(s, 1, 2.5);
export const squintAt = (s: SceneTimeline) => ps(s, 2, 3.6);
// комната (s08): бантик 2, штамп «прописана» 3, листья 4
export const stampAt = (s: SceneTimeline) => ps(s, 2, 3.5);
export const leavesAt = (s: SceneTimeline) => ps(s, 3, 5.9);
// комната (s10): поворот к коридору 1, вторая выходит 2, переглянулись 3, статус 4
export const panAt = (s: SceneTimeline) => ps(s, 0, 0.4);
export const secondSheepAt = (s: SceneTimeline) => ps(s, 1, 1.8) + 0.1;
export const glanceAt = (s: SceneTimeline) => ps(s, 2, 3.0);
export const discussedAt = (s: SceneTimeline) => ps(s, 3, 4.6);
// план квартиры (s07): солнце/время 2, барашек у фикуса 3
export const sunAt = (s: SceneTimeline) => ps(s, 1, 1.8);
export const planSheepAt = (s: SceneTimeline) => ps(s, 2, 2.7) + 0.2;
// диалог (s09): пузырь i появляется на фразе i+1
export const bubbleTimes = (s: SceneTimeline, n: number) => Array.from({ length: n }, (_, i) => ps(s, i + 1, 1.5 + i * 1.3));
// подъезд (s12): «в костюме» 2, «расширяемся» 3, «поздравляю» 4, «куда» 5 (сосед показывает вверх)
export const suitAt = (s: SceneTimeline) => ps(s, 1, 2.3);
export const expandAt = (s: SceneTimeline) => ps(s, 2, 3.4);
export const congratsAt = (s: SceneTimeline) => ps(s, 3, 5.9);
export const pointUpAt = (s: SceneTimeline) => ps(s, 4, 6.8);
// крыша (s13): наезд вверх к концу 2-й фразы, бантики 3, подпись 4, «гарем» 5
export const roofRevealAt = (s: SceneTimeline) => ps(s, 1, 2.2);
export const roofBowsAt = (s: SceneTimeline) => ps(s, 2, 4.4);
export const roofLabelAt = (s: SceneTimeline) => ps(s, 3, 5.8);
export const haremAt = (s: SceneTimeline) => ps(s, 4, 7.1);
// финал (s14): стрелка вверх 2, сердечки 3, затемнение после последней фразы
export const arrowAt = (s: SceneTimeline) => ps(s, 1, 2.4);
export const heartsAt = (s: SceneTimeline) => ps(s, 2, 4.2);
export const blackoutAt = (s: SceneTimeline) => (last(s)?.end ?? 6.5) + 0.3;
// заставка (s01): сердце снизу на 2-й фразе, силуэт барашка на 4-й
export const titleHeartAt = (s: SceneTimeline) => ps(s, 1, 1.7);
export const titleWhoAt = (s: SceneTimeline) => ps(s, 3, 5.1);
// дом (s02): спуск к 8-му на 2-й фразе, «личная жизнь» 3, блеяние 4
export const floorDownAt = (s: SceneTimeline) => ps(s, 1, 1.6);
export const lifeAt = (s: SceneTimeline) => ps(s, 2, 2.8);
export const bleatAt = (s: SceneTimeline) => ps(s, 3, 7.5);
// звуки (s03): топот 3, блеяние 4, голос 5, цитата 6
export const trotAt = (s: SceneTimeline) => ps(s, 2, 2.8);
export const bleat2At = (s: SceneTimeline) => ps(s, 3, 3.8);
export const voiceAt = (s: SceneTimeline) => ps(s, 4, 4.9);
export const quoteAt = (s: SceneTimeline) => ps(s, 5, 6.1);
// улики (s04): карточки по индексам фраз из props.cardPhrases, записка на последней фразе
export const cardPhraseTimes = (s: SceneTimeline) => {
  const idx: number[] = s.props?.cardPhrases ?? [];
  return idx.map((i) => ps(s, i, 2 + i * 1.5));
};
export const noteAt = (s: SceneTimeline) => ps(s, s.phrases.length - 1, 9.5);
export const sceneEndAt = (s: SceneTimeline) => pe(s, s.phrases.length - 1, 5);
