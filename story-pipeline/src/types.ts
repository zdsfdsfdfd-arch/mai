export type Accent = "yellow" | "red" | null;

export type Word = { text: string; start: number; end: number; accent: Accent };

export type Phrase = { text: string; start: number; end: number; words: Word[] };

export type TopPlaque = { num: string; text: string };

export type CharacterSpec = { pose: "stand" | "point" | "sit" | "knock" };

export type SceneTimeline = {
  id: string;
  type: string;
  startFrame: number;
  durationFrames: number;
  audio: string | null;
  audioDuration: number;
  phrases: Phrase[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
  character?: CharacterSpec;
  topPlaque?: TopPlaque;
  status?: string;
};

export type MusicConfig = {
  enabled?: boolean; // по умолчанию true; файл public/audio/music.wav создаёт scripts/music.mjs
  volume?: number; // базовая громкость музыки в паузах, 0..1 (по умолчанию 0.22)
  duck?: number; // доля громкости под голосом, 0..1 (по умолчанию 0.35)
  bpm?: number;
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  series: string;
  part: number;
  channel: string;
  dayLabel: string;
  scenes: SceneTimeline[];
};
