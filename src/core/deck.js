import { buildChrome, buildOverview, buildNotes, buildHelp, buildCredits, el, pad } from './ui.js';
import { runCounters, settleCounters } from './animate.js';

const STAGE_W = 1920;
const STAGE_H = 1080;
const IDLE_MS = 2600;

/**
 * Deck — a 1920×1080 slide engine.
 *
 * Each slide module provides:
 *   { id, title, chapter, theme: 'dark'|'light', steps?, notes, html(ctx), onEnter?(el, step), onStep?(el, step) }
 *
 * Navigation: arrows, Space, PgUp/PgDn, Home/End, swipe, wheel, progress bar,
 * on-screen buttons, #slide-N in the address bar.
 */
export class Deck {
  constructor(root, slides, { images = {}, base = './' } = {}) {
    this.root = root;
    this.slides = slides;
    this.images = images;
    this.base = base;
    this.index = -1;
    this.step = 0;
    this.locked = false;
  }

  mount() {
    const { root, slides } = this;

    this.stage = el('div', { class: 'stage', 'data-dir': 'fwd' });
    this.track = el('div', { class: 'slides' });

    this.sections = slides.map((s, i) => {
      const section = el('section', {
        class: `slide slide--${s.id}`,
        'data-theme': s.theme || 'dark',
        'data-index': i,
        'aria-roledescription': 'слайд',
        'aria-label': `${i + 1} из ${slides.length}: ${s.title}`,
      });
      section.innerHTML = s.html({ base: this.base, img: this.img.bind(this) });
      this.track.appendChild(section);
      return section;
    });

    this.chrome = buildChrome(slides.length);
    this.stage.append(this.track, this.chrome);

    this.overview = buildOverview(slides);
    this.notes = buildNotes();
    this.help = buildHelp();
    this.credits = buildCredits(this.images, this.base);
    this.toast = el('div', { class: 'toast', role: 'status' }, '→ или Пробел — дальше · H — управление');

    root.append(this.stage, this.notes, this.overview, this.help, this.credits, this.toast);

    this.$ = {
      chapterWrap: this.chrome.querySelector('.chrome-chapter'),
      chapterNum: this.chrome.querySelector('.chrome-chapter .num'),
      chapterName: this.chrome.querySelector('.chrome-chapter .name'),
      counter: this.chrome.querySelector('.counter .cur'),
      fill: this.chrome.querySelector('.progress-fill'),
      progress: this.chrome.querySelector('.progress'),
      dots: this.chrome.querySelector('.step-dots'),
      prev: this.chrome.querySelector('[data-action="prev"]'),
      next: this.chrome.querySelector('[data-action="next"]'),
      notesText: this.notes.querySelector('.notes-text'),
    };

    this.bind();
    this.fit();

    const fromHash = this.indexFromHash();
    this.go(fromHash ?? 0, { instant: true });

    setTimeout(() => this.toast.classList.add('is-show'), 900);
    setTimeout(() => this.toast.classList.remove('is-show'), 5200);
    this.pokeIdle();
    return this;
  }

  /** Returns an <img> for a key from the image manifest. */
  img(key, { alt, className = '', position } = {}) {
    const meta = this.images[key];
    if (!meta) throw new Error(`Unknown image: ${key}`);
    const pos = position || meta.position;
    const style = pos ? ` style="object-position:${pos}"` : '';
    const cls = className ? ` class="${className}"` : '';
    // All photos load eagerly: a deck must never show a half-loaded slide.
    return `<img src="${this.base}${meta.file}" alt="${alt ?? meta.alt}"${cls} decoding="async" draggable="false"${style}>`;
  }

  /* ───────────── layout ───────────── */

  fit() {
    const w = this.root.clientWidth;
    const h = this.root.clientHeight;
    const scale = Math.min(w / STAGE_W, h / STAGE_H);
    this.stage.style.setProperty('--scale', String(scale));
  }

  /* ───────────── navigation ───────────── */

  stepsOf(i) {
    return Math.max(1, this.slides[i]?.steps || 1);
  }

  next() {
    if (this.step < this.stepsOf(this.index) - 1) return this.setStep(this.step + 1);
    if (this.index < this.slides.length - 1) this.go(this.index + 1);
  }

  prev() {
    if (this.step > 0) return this.setStep(this.step - 1);
    if (this.index > 0) this.go(this.index - 1, { step: this.stepsOf(this.index - 1) - 1 });
  }

  go(target, { step = 0, instant = false } = {}) {
    const i = Math.max(0, Math.min(this.slides.length - 1, target));
    if (i === this.index) {
      this.setStep(step);
      return;
    }

    const prevIndex = this.index;
    const prevEl = this.sections[prevIndex];
    const nextEl = this.sections[i];
    const slide = this.slides[i];

    this.stage.dataset.dir = i > prevIndex ? 'fwd' : 'back';

    if (prevEl) {
      prevEl.classList.remove('is-active');
      prevEl.classList.add('is-leaving');
      clearTimeout(prevEl._leaveTimer);
      prevEl._leaveTimer = setTimeout(() => prevEl.classList.remove('is-leaving'), 750);
      prevEl.setAttribute('aria-hidden', 'true');
      prevEl.inert = true;
    }

    // Force a reflow so the entering slide always restarts its reveal sequence.
    nextEl.classList.remove('is-leaving');
    void nextEl.offsetWidth;

    if (instant) nextEl.style.transition = 'none';
    nextEl.classList.add('is-active');
    nextEl.removeAttribute('aria-hidden');
    nextEl.inert = false;
    if (instant) requestAnimationFrame(() => (nextEl.style.transition = ''));

    this.index = i;
    this.step = -1;
    this.setStep(step, { silent: true });

    this.stage.classList.toggle('is-light', slide.theme === 'light');
    runCounters(nextEl);
    if (prevEl) setTimeout(() => settleCounters(prevEl), 800);
    slide.onEnter?.(nextEl, this);

    this.updateChrome(slide, prevIndex === -1);
    this.updateHash();
  }

  setStep(n, { silent = false } = {}) {
    const max = this.stepsOf(this.index) - 1;
    const s = Math.max(0, Math.min(max, n));
    if (s === this.step && !silent) return;
    this.step = s;
    const section = this.sections[this.index];
    section.dataset.step = String(s);
    this.slides[this.index].onStep?.(section, s, this);
    this.renderDots();
    this.updateProgress();
    this.updateNav();
  }

  /* ───────────── chrome ───────────── */

  updateChrome(slide, first) {
    const { chapterWrap, chapterNum, chapterName, counter, notesText } = this.$;
    const apply = () => {
      chapterNum.textContent = pad(this.index + 1);
      chapterName.textContent = slide.chapter;
      chapterWrap.classList.remove('is-swapping');
    };
    if (first) apply();
    else {
      chapterWrap.classList.add('is-swapping');
      setTimeout(apply, 260);
    }
    counter.textContent = pad(this.index + 1);
    notesText.innerHTML = (slide.notes || '')
      .trim()
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');
    this.overview.querySelectorAll('.overview-item').forEach((b, i) => b.classList.toggle('is-current', i === this.index));
    this.$.progress.setAttribute('aria-valuenow', String(this.index + 1));
  }

  updateProgress() {
    const total = this.slides.length;
    const steps = this.stepsOf(this.index);
    const within = steps > 1 ? this.step / steps : 0;
    const pct = ((this.index + within + 1) / total) * 100;
    this.$.fill.style.width = `${Math.min(100, pct)}%`;
  }

  renderDots() {
    const steps = this.stepsOf(this.index);
    this.$.dots.innerHTML = steps > 1 ? Array.from({ length: steps }, (_, i) => `<i class="${i <= this.step ? 'on' : ''}"></i>`).join('') : '';
  }

  updateNav() {
    const atStart = this.index === 0 && this.step === 0;
    const atEnd = this.index === this.slides.length - 1 && this.step === this.stepsOf(this.index) - 1;
    this.$.prev.disabled = atStart;
    this.$.next.disabled = atEnd;
  }

  updateHash() {
    const hash = `#slide-${this.index + 1}`;
    try {
      if (location.hash !== hash) history.replaceState(null, '', hash);
    } catch {
      /* some embedded viewers forbid history changes — navigation still works */
    }
  }

  indexFromHash() {
    const m = /^#slide-(\d+)$/.exec(location.hash);
    if (!m) return null;
    const n = parseInt(m[1], 10) - 1;
    return n >= 0 && n < this.slides.length ? n : null;
  }

  /* ───────────── overlays ───────────── */

  openOverlay(node) {
    [this.overview, this.help, this.credits].forEach((o) => o !== node && o.classList.remove('is-open'));
    node.classList.add('is-open');
    this.activeOverlay = node;
    const focusTarget = node.querySelector('.is-current') || node.querySelector('[data-close]');
    setTimeout(() => focusTarget?.focus({ preventScroll: true }), 50);
  }

  closeOverlay() {
    if (!this.activeOverlay) return false;
    this.activeOverlay.classList.remove('is-open');
    this.activeOverlay = null;
    return true;
  }

  toggleOverlay(node) {
    if (this.activeOverlay === node) this.closeOverlay();
    else this.openOverlay(node);
  }

  toggleNotes() {
    this.notes.classList.toggle('is-open');
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* fullscreen is optional (blocked in some embeds) */
    }
  }

  /* ───────────── input ───────────── */

  pokeIdle() {
    this.root.classList.remove('is-idle');
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.root.classList.add('is-idle'), IDLE_MS);
  }

  bind() {
    window.addEventListener('resize', () => this.fit());
    window.addEventListener('hashchange', () => {
      const i = this.indexFromHash();
      if (i != null && i !== this.index) this.go(i);
    });

    document.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('mousemove', () => this.pokeIdle(), { passive: true });

    // Buttons inside chrome and overlays
    this.root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action],[data-goto],[data-close],[data-step-to]');
      if (!t) return;
      if (t.hasAttribute('data-close')) return void this.closeOverlay();
      if (t.dataset.goto != null) {
        this.closeOverlay();
        return void this.go(parseInt(t.dataset.goto, 10));
      }
      if (t.dataset.stepTo != null) return void this.setStep(parseInt(t.dataset.stepTo, 10));
      const a = t.dataset.action;
      if (a === 'next') this.next();
      else if (a === 'prev') this.prev();
      else if (a === 'overview') this.toggleOverlay(this.overview);
      else if (a === 'credits') this.toggleOverlay(this.credits);
      else if (a === 'help') this.toggleOverlay(this.help);
    });

    // Close overlay when clicking its backdrop
    [this.overview, this.help, this.credits].forEach((o) =>
      o.addEventListener('click', (e) => {
        if (e.target === o) this.closeOverlay();
      }),
    );

    // Touch swipe
    let sx = 0;
    let sy = 0;
    let st = 0;
    this.stage.addEventListener(
      'touchstart',
      (e) => {
        const p = e.touches[0];
        sx = p.clientX;
        sy = p.clientY;
        st = Date.now();
      },
      { passive: true },
    );
    this.stage.addEventListener(
      'touchend',
      (e) => {
        const p = e.changedTouches[0];
        const dx = p.clientX - sx;
        const dy = p.clientY - sy;
        if (Date.now() - st < 700 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          if (dx < 0) this.next();
          else this.prev();
        }
      },
      { passive: true },
    );

    // Wheel / trackpad — one slide per gesture
    let wheelLock = 0;
    window.addEventListener(
      'wheel',
      (e) => {
        if (this.activeOverlay) return;
        const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (Math.abs(d) < 24) return;
        const now = Date.now();
        if (now < wheelLock) return;
        wheelLock = now + 900;
        if (d > 0) this.next();
        else this.prev();
      },
      { passive: true },
    );
  }

  onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    this.pokeIdle();

    if (k === 'Escape') {
      if (this.closeOverlay()) return e.preventDefault();
      if (this.notes.classList.contains('is-open')) return this.toggleNotes();
      return this.openOverlay(this.overview);
    }

    // While an overlay is open, only Escape and its own toggle key work.
    if (this.activeOverlay) {
      if ((k === 'o' || k === 'O' || k === 'щ' || k === 'Щ') && this.activeOverlay === this.overview) this.closeOverlay();
      if ((k === 'i' || k === 'I' || k === 'ш' || k === 'Ш') && this.activeOverlay === this.credits) this.closeOverlay();
      if ((k === 'h' || k === 'H' || k === '?' || k === 'р' || k === 'Р') && this.activeOverlay === this.help) this.closeOverlay();
      return;
    }

    // The "on-screen" button that has focus keeps Enter/Space for itself.
    const focusIsButton = document.activeElement?.tagName === 'BUTTON';

    switch (k) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        return this.next();
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        return this.prev();
      case ' ':
      case 'Spacebar':
        if (focusIsButton) return;
        e.preventDefault();
        return e.shiftKey ? this.prev() : this.next();
      case 'Enter':
        if (focusIsButton) return;
        e.preventDefault();
        return this.next();
      case 'Home':
        e.preventDefault();
        return this.go(0);
      case 'End':
        e.preventDefault();
        return this.go(this.slides.length - 1);
      default:
        break;
    }

    // Letter shortcuts work on both EN and RU keyboard layouts.
    const map = {
      f: 'fs', F: 'fs', а: 'fs', А: 'fs',
      n: 'notes', N: 'notes', т: 'notes', Т: 'notes',
      o: 'overview', O: 'overview', щ: 'overview', Щ: 'overview',
      h: 'help', H: 'help', '?': 'help', р: 'help', Р: 'help',
      i: 'credits', I: 'credits', ш: 'credits', Ш: 'credits',
    };
    const action = map[k];
    if (action === 'fs') this.toggleFullscreen();
    else if (action === 'notes') this.toggleNotes();
    else if (action === 'overview') this.toggleOverlay(this.overview);
    else if (action === 'help') this.toggleOverlay(this.help);
    else if (action === 'credits') this.toggleOverlay(this.credits);
  }
}
