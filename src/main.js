import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/deck.css';
import './styles/components.css';

import { Deck } from './core/deck.js';
import { slides } from './slides/index.js';
import { images } from './data/images.js';

const root = document.getElementById('app');

// Preload every photo before the first slide animates in, so no slide
// ever appears half-loaded during a talk. Fonts are awaited as well.
function preload() {
  const base = import.meta.env.BASE_URL;
  const pics = Object.values(images).map(
    (img) =>
      new Promise((resolve) => {
        const el = new Image();
        el.onload = el.onerror = resolve;
        el.src = `${base}${img.file}`;
      }),
  );
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500));
  return Promise.race([Promise.all([...pics, fonts]), timeout]);
}

preload().then(() => {
  const deck = new Deck(root, slides, { images, base: import.meta.env.BASE_URL }).mount();
  // Handy for debugging and for the automated check script.
  window.__deck = deck;
});
