import './04-push-pull.css';

// Two "who picks whom" diagrams: 8 models (left column) and 8 customers (right column).
const ROWS = 8;
const W = 828;
const H = 470;
const X_PRODUCT = 70;
const X_CUSTOMER = 758;
const rowY = (i) => 58 + i * 56;
const TOP_PICKS = 3; // customers only want the best few models

const product = (i, cls = '') => {
  const y = rowY(i);
  return `<g class="pp-product ${cls}" transform="translate(${X_PRODUCT} ${y})">
    <rect x="-17" y="-13" width="34" height="26" rx="2"/>
    <path d="M-17 -5 H17 M-5 -13 V-5 M5 -13 V-5"/>
  </g>`;
};

const customer = (i) => {
  const y = rowY(i);
  return `<g class="pp-customer" transform="translate(${X_CUSTOMER} ${y})">
    <circle cx="0" cy="-12" r="7"/>
    <path d="M-11 15 V3 a11 11 0 0 1 22 0 V15"/>
  </g>`;
};

/** A line that draws itself, plus an arrowhead that fades in once the line is done. */
const arrow = (x1, y1, x2, y2, k, cls) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 10;
  const p1 = [x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)];
  const p2 = [x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)];
  const delay = 700 + k * 45;
  return `<g class="pp-arrow ${cls}" style="--draw-delay:${delay}ms;--draw-dur:900ms;--hd:${delay + 800}ms">
    <path class="draw" pathLength="1" d="M${x1} ${y1} L${x2} ${y2}"/>
    <polygon points="${x2},${y2} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}"/>
  </g>`;
};

const columnLabels = `
  <text class="pp-col" x="${X_PRODUCT}" y="14" text-anchor="middle">Модели</text>
  <text class="pp-col" x="${X_CUSTOMER}" y="14" text-anchor="middle">Клиенты</text>`;

function pushDiagram() {
  let k = 0;
  const arrows = [];
  for (let i = 0; i < ROWS; i++) {
    for (const j of [i - 1, i + 1]) {
      if (j < 0 || j >= ROWS) continue;
      arrows.push(arrow(X_PRODUCT + 26, rowY(i), X_CUSTOMER - 22, rowY(j), k++, 'is-push'));
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="pp-svg" aria-hidden="true">
    ${columnLabels}
    ${arrows.join('')}
    ${Array.from({ length: ROWS }, (_, i) => product(i)).join('')}
    ${Array.from({ length: ROWS }, (_, i) => customer(i)).join('')}
  </svg>`;
}

function pullDiagram() {
  let k = 0;
  const arrows = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < TOP_PICKS; i++) {
      arrows.push(arrow(X_CUSTOMER - 22, rowY(j), X_PRODUCT + 26, rowY(i), k++, 'is-pull'));
    }
  }
  const shelfTop = rowY(TOP_PICKS) - 22;
  const shelfBottom = rowY(ROWS - 1) + 22;
  return `<svg viewBox="0 0 ${W} ${H}" class="pp-svg" aria-hidden="true">
    ${columnLabels}
    <rect class="pp-shelf" x="${X_PRODUCT - 34}" y="${shelfTop}" width="68" height="${shelfBottom - shelfTop}" rx="4"/>
    <path class="pp-bracket" d="M${X_PRODUCT + 46} ${shelfTop + 6} h12 V${shelfBottom - 6} h-12 M${X_PRODUCT + 58} ${(shelfTop + shelfBottom) / 2} h18"/>
    <text class="pp-shelf-label" x="${X_PRODUCT + 86}" y="${(shelfTop + shelfBottom) / 2 - 6}">5 из 8 моделей</text>
    <text class="pp-shelf-label is-strong" x="${X_PRODUCT + 86}" y="${(shelfTop + shelfBottom) / 2 + 20}">лежат на складе</text>
    ${arrows.join('')}
    ${Array.from({ length: ROWS }, (_, i) => product(i, i < TOP_PICKS ? 'is-picked' : 'is-unsold')).join('')}
    ${Array.from({ length: ROWS }, (_, i) => customer(i)).join('')}
  </svg>`;
}

export default {
  id: 'pushpull',
  chapter: 'Push и Pull',
  title: 'Push против Pull: кто кого выбирает',
  theme: 'light',
  notes: `
    Эта схема показывает главное отличие массового производства от Lean.

    Слева — логика «толкающего» завода: модели выпускаются заранее, большими партиями, и кажется,
    что у каждой найдётся свой покупатель.

    Справа — как выбирает реальный клиент: спрос собирается на нескольких моделях, которые лучше всего
    отвечают его ожиданиям по качеству, цене и срокам. Всё остальное оседает на складе — это запасы
    и перепроизводство, два вида потерь из списка Тайити Оно.

    Отсюда вывод Lean: не «толкать» продукцию на склад, а производить то, что «вытягивает» клиент.
  `,
  html: () => `
    <div class="pp-head">
      <p class="eyebrow" data-r style="--i:0"><b>Push vs Pull</b> спрос решает</p>
      <h2 class="h1" data-r style="--i:1">Не всё, что сделано, нужно клиенту</h2>
    </div>

    <figure class="pp-panel" data-r style="--i:2">
      <figcaption>
        <span class="label">Как думал завод · push</span>
        <b>Любую модель кто-нибудь купит</b>
      </figcaption>
      ${pushDiagram()}
    </figure>

    <figure class="pp-panel pp-panel--pull" data-r style="--i:3">
      <figcaption>
        <span class="label accent">Как выбирает клиент · pull</span>
        <b>Спрос собирается на нескольких лучших моделях</b>
      </figcaption>
      ${pullDiagram()}
    </figure>

    <p class="pp-caption" data-r style="--i:6">
      Всё, что попадает в ожидания клиента, продаётся. Всё остальное — <b>запасы и потери</b>.
      <span>Поэтому Lean производит то, что «вытягивает» клиент.</span>
    </p>
  `,
};
