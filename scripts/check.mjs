// Automated QA for the built deck (run `npm run build` first).
//
//   npm run check                → checks every slide at 1920×1080
//   SHOTS=dir npm run check      → also saves a screenshot of every slide/step
//
// Reports: console errors, failed requests, broken images, text that leaves
// the stage or runs into the navigation chrome, and clipped text boxes.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const SHOTS = process.env.SHOTS || '';
const WAIT = Number(process.env.WAIT || 3800);

const server = await preview({ preview: { port: 4174, strictPort: false }, logLevel: 'silent' });
const url = server.resolvedUrls.local[0];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

const problems = [];
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__deck);
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const total = await page.evaluate(() => window.__deck.slides.length);

for (let i = 0; i < total; i++) {
  const steps = await page.evaluate((n) => window.__deck.stepsOf(n), i);
  for (let s = 0; s < steps; s++) {
    await page.evaluate(([n, st]) => window.__deck.go(n, { step: st }), [i, s]);
    await page.waitForTimeout(WAIT);

    const report = await page.evaluate(() => {
      const out = [];
      const stage = document.querySelector('.stage');
      const scale = parseFloat(getComputedStyle(stage).getPropertyValue('--scale')) || 1;
      const sr = stage.getBoundingClientRect();
      const slide = document.querySelector('.slide.is-active');
      const toStage = (r) => ({
        l: (r.left - sr.left) / scale,
        t: (r.top - sr.top) / scale,
        r: (r.right - sr.left) / scale,
        b: (r.bottom - sr.top) / scale,
      });

      // Images
      slide.querySelectorAll('img').forEach((img) => {
        if (!img.complete || img.naturalWidth === 0) out.push(`broken image: ${img.getAttribute('src')}`);
      });

      // Text boxes: leaf-ish elements that render text and are visible
      const visible = (el) => {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) return false;
        for (let p = el.parentElement; p && p !== slide; p = p.parentElement) {
          const ps = getComputedStyle(p);
          if (ps.visibility === 'hidden' || parseFloat(ps.opacity) === 0) return false;
        }
        return true;
      };
      const texts = [...slide.querySelectorAll('h1,h2,h3,h4,p,li,span,b,blockquote,figcaption,button,em,strong')].filter(
        (el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visible(el),
      );
      for (const el of texts) {
        if (el.closest('[aria-hidden="true"]')) continue; // decorative (kanji, HUD)
        const r = toStage(el.getBoundingClientRect());
        if (r.r - r.l < 1) continue;
        const name = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 40)}"`;
        if (r.l < 40 || r.r > 1880 || r.t < 84 || r.b > 1004) out.push(`outside safe area (${r.l | 0},${r.t | 0},${r.r | 0},${r.b | 0}): ${name}`);
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push(`clipped horizontally: ${name}`);
        if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible') out.push(`clipped vertically: ${name}`);
      }
      return out;
    });

    const label = `slide ${String(i + 1).padStart(2, '0')}${steps > 1 ? ` step ${s + 1}` : ''}`;
    report.forEach((r) => problems.push(`${label}: ${r}`));
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${label.replace(/ /g, '-')}.png` });
    console.log(`✓ ${label}${report.length ? ` — ${report.length} issue(s)` : ''}`);
  }
}

// Keyboard smoke test: → advances, ← goes back, End jumps to the last slide.
await page.evaluate(() => window.__deck.go(0));
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(300);
const afterRight = await page.evaluate(() => window.__deck.index);
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(300);
const afterLeft = await page.evaluate(() => window.__deck.index);
await page.keyboard.press('End');
await page.waitForTimeout(300);
const afterEnd = await page.evaluate(() => window.__deck.index);
if (afterRight !== 1 || afterLeft !== 0 || afterEnd !== total - 1)
  problems.push(`keyboard navigation: got ${afterRight}/${afterLeft}/${afterEnd}`);

await browser.close();
await new Promise((r) => server.httpServer.close(r));

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.log(' - ' + p));
  process.exit(1);
}
console.log(`\nAll ${total} slides OK: no errors, all images loaded, text inside the safe area.`);
