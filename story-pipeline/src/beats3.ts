import type { SceneTimeline } from "./types";

// Моменты событий серии «Вспышка» (привязка к фразам озвучки).
const ps = (s: SceneTimeline, i: number, fb: number) => s.phrases[i]?.start ?? fb;
const pe = (s: SceneTimeline, i: number, fb: number) => s.phrases[i]?.end ?? fb;

// класс, режим flash: вспышка на 4-й фразе, название на 5-й
export const flashAt = (s: SceneTimeline) => ps(s, 3, 3.5) + 0.5;
export const titleAt = (s: SceneTimeline) => ps(s, 4, 5.3);
// класс, режим cover: падение на 1-й, стекло на 5-й
export const dropAt = (s: SceneTimeline) => ps(s, 0, 0.4) + 0.3;
export const shatterAt = (s: SceneTimeline) => ps(s, 4, 9.0) + 0.3;
// палец: поднимается 1, сравнение 2, «миф» 4, крест 5
export const thumbUpAt = (s: SceneTimeline) => ps(s, 0, 0.4) + 0.3;
export const outlineAt = (s: SceneTimeline) => ps(s, 1, 3.0);
export const mythAt = (s: SceneTimeline) => ps(s, 3, 7.5);
export const crossAt = (s: SceneTimeline) => ps(s, 4, 9.0);
// счётчик: свет 2, звук 3, отсчёт 4, формула 5, «твоё время» 6
export const lightAt = (s: SceneTimeline) => ps(s, 1, 1.2);
export const soundAt = (s: SceneTimeline) => ps(s, 2, 3.5);
export const countAt = (s: SceneTimeline) => ps(s, 3, 6.0);
export const formulaAt = (s: SceneTimeline) => ps(s, 4, 7.5);
export const yourTimeAt = (s: SceneTimeline) => ps(s, 5, 9.5);
// пыль: таймер 2, пыль 3, опасность 4
export const timerStartAt = (s: SceneTimeline) => ps(s, 1, 1.5);
export const dustAt = (s: SceneTimeline) => ps(s, 2, 3.0) + 0.4;
export const dangerAt = (s: SceneTimeline) => ps(s, 3, 7.0);
// укрытие: машина 2, здание 3, этажи 6, подвал 7
export const carAt = (s: SceneTimeline) => ps(s, 1, 1.5);
export const buildingAt = (s: SceneTimeline) => ps(s, 2, 4.0);
export const floorsAt = (s: SceneTimeline) => ps(s, 5, 8.5);
export const basementAt = (s: SceneTimeline) => ps(s, 6, 11.5);
// спад: сиди 2, график 3, 7 часов 4, двое суток 5, сутки 6
export const sitAt3 = (s: SceneTimeline) => ps(s, 1, 1.5);
export const chartAt = (s: SceneTimeline) => ps(s, 2, 2.5);
export const sevenAt = (s: SceneTimeline) => ps(s, 3, 4.5);
export const twoDaysAt = (s: SceneTimeline) => ps(s, 4, 7.5);
export const dayAt = (s: SceneTimeline) => ps(s, 5, 9.5);
// чек-лист: пункт i на фразе i+1
export const checkTimes = (s: SceneTimeline, n: number) => Array.from({ length: n }, (_, i) => ps(s, i + 1, 1 + i * 0.9));
// финал с пальцем
export const thumbAt = (s: SceneTimeline) => ps(s, 0, 0.4) + 0.4;
export const endOfSpeech = (s: SceneTimeline) => pe(s, s.phrases.length - 1, 2);
