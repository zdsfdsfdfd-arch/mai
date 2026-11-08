// DOM builders for the deck chrome and overlays.

const ICON_PREV =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
const ICON_NEXT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export const pad = (n) => String(n).padStart(2, '0');

export function el(tag, attrs = {}, html = '') {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    node.setAttribute(k, v === true ? '' : v);
  }
  if (html) node.innerHTML = html;
  return node;
}

export function buildChrome(total) {
  const chrome = el('div', { class: 'chrome', 'aria-hidden': 'false' });
  chrome.innerHTML = `
    <div class="chrome-top">
      <div class="chrome-brand"><i></i><span>Lean Production · История</span></div>
      <div class="chrome-chapter"><span class="num"></span><span class="name"></span></div>
    </div>
    <div class="chrome-bottom">
      <div class="chrome-hint" aria-hidden="true">
        <span><kbd>←</kbd><kbd>→</kbd>навигация</span>
        <span><kbd>N</kbd>заметки</span>
        <span><kbd>O</kbd>содержание</span>
        <span><kbd>F</kbd>полный экран</span>
      </div>
      <div class="chrome-right">
        <div class="step-dots" aria-hidden="true"></div>
        <button class="menu-btn" type="button" data-action="overview" aria-label="Содержание">Содержание</button>
        <div class="counter" aria-live="polite"><b class="cur">01</b> / ${pad(total)}</div>
        <div class="nav-btns">
          <button class="nav-btn" type="button" data-action="prev" aria-label="Предыдущий слайд">${ICON_PREV}</button>
          <button class="nav-btn" type="button" data-action="next" aria-label="Следующий слайд">${ICON_NEXT}</button>
        </div>
      </div>
    </div>
    <div class="progress" role="progressbar" aria-label="Прогресс презентации" aria-valuemin="1" aria-valuemax="${total}">
      <div class="progress-fill"></div>
      <div class="progress-ticks">
        ${Array.from({ length: total }, (_, i) => `<button type="button" data-goto="${i}" aria-label="Слайд ${i + 1}"></button>`).join('')}
      </div>
    </div>`;
  return chrome;
}

export function buildOverview(slides) {
  const overlay = el('div', { class: 'overlay', id: 'overview', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Содержание' });
  overlay.innerHTML = `
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Содержание</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="overview-grid">
        ${slides
          .map(
            (s, i) => `
          <button class="overview-item" type="button" data-goto="${i}">
            <span class="n">${pad(i + 1)} · ${s.chapter}</span>
            <span class="t">${s.title}</span>
          </button>`,
          )
          .join('')}
      </div>
    </div>`;
  return overlay;
}

export function buildNotes() {
  const notes = el('aside', { class: 'notes', id: 'notes', 'aria-label': 'Заметки докладчика' });
  notes.innerHTML = `
    <div class="notes-inner">
      <div class="notes-label">Заметки докладчика<br><span class="muted">N — скрыть</span></div>
      <div class="notes-text"></div>
    </div>`;
  return notes;
}

export function buildHelp() {
  const keys = [
    ['Следующий слайд', '→ · Пробел · PgDn'],
    ['Предыдущий слайд', '← · Shift+Пробел · PgUp'],
    ['Первый / последний', 'Home · End'],
    ['Содержание', 'O · Esc'],
    ['Заметки докладчика', 'N'],
    ['Полный экран', 'F'],
    ['Источники фотографий', 'I'],
    ['Эта подсказка', 'H · ?'],
  ];
  const overlay = el('div', { class: 'overlay', id: 'help', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Управление' });
  overlay.innerHTML = `
    <div class="overlay-panel" style="width:min(820px,100%)">
      <div class="overlay-head">
        <h2>Управление</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <div class="keys">
        ${keys.map(([a, b]) => `<div><span>${a}</span><kbd>${b}</kbd></div>`).join('')}
      </div>
      <p class="muted" style="margin-top:24px;font-size:14px">На телефоне и планшете листайте свайпом влево и вправо.</p>
    </div>`;
  return overlay;
}

export function buildCredits(images, base) {
  const overlay = el('div', { class: 'overlay', id: 'credits', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Источники фотографий' });
  const items = Object.values(images)
    .map(
      (img) => `
      <li>
        <img src="${base}${img.file}" alt="" loading="lazy">
        <div>
          <b>${img.title}</b>
          <span>${img.author} · ${img.license}</span><br>
          <a href="${img.source}" target="_blank" rel="noopener">${img.source.replace('https://', '')}</a>
        </div>
      </li>`,
    )
    .join('');
  overlay.innerHTML = `
    <div class="overlay-panel">
      <div class="overlay-head">
        <h2>Источники фотографий</h2>
        <button class="overlay-close" type="button" data-close>Закрыть · Esc</button>
      </div>
      <ul class="credits-list">${items}</ul>
    </div>`;
  return overlay;
}
