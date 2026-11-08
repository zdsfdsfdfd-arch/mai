// Slide order. Each module exports { id, chapter, title, theme, notes, html, steps?, onEnter?, onStep? }.
import cover from './01-cover.js';
import what from './02-what-is-lean.js';
import before from './03-before-lean.js';
import pushpull from './04-push-pull.js';
import ford from './05-ford.js';
import japan from './06-japan.js';
import tps from './07-tps.js';
import wastes from './08-wastes.js';
import term from './09-term.js';
import timeline from './10-timeline.js';
import today from './11-today.js';
import tech from './12-tech.js';
import finale from './13-finale.js';

export const slides = [cover, what, before, pushpull, ford, japan, tps, wastes, term, timeline, today, tech, finale];
