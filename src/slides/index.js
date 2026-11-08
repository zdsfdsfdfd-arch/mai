// Slide order. Each module exports { id, chapter, title, theme, notes, html, steps?, onEnter?, onStep? }.
import cover from './01-cover.js';
import what from './02-what-is-lean.js';
import before from './03-before-lean.js';
import ford from './04-ford.js';
import japan from './05-japan.js';
import tps from './06-tps.js';
import wastes from './07-wastes.js';
import term from './08-term.js';
import timeline from './09-timeline.js';
import today from './10-today.js';
import tech from './11-tech.js';
import finale from './12-finale.js';

export const slides = [cover, what, before, ford, japan, tps, wastes, term, timeline, today, tech, finale];
