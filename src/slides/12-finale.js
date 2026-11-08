import './12-finale.css';

const chain = [
  { name: 'Ford', when: '1913', note: 'конвейер' },
  { name: 'Toyota', when: '1937', note: 'своя дорога' },
  { name: 'TPS', when: '1950-е', note: 'JIT + Jidoka' },
  { name: 'Lean Production', when: '1988', note: 'имя для всего мира' },
  { name: 'Continuous Improvement', when: 'каждый день', note: 'кайдзен' },
  { name: 'Smart Factory', when: '2020-е', note: 'Lean + AI' },
];

export default {
  id: 'finale',
  chapter: 'Итог',
  title: 'Итог: культура постоянного улучшения',
  theme: 'dark',
  notes: `
    Подведём итог. Lean Production возникла из необходимости: у послевоенной Toyota не было
    ресурсов, чтобы повторять путь Форда. Пришлось научиться делать больше с меньшими ресурсами.

    Цепочка развития: конвейер Форда, собственный путь Toyota, Toyota Production System,
    международное имя Lean Production, культура постоянного улучшения — и сегодня умные заводы.

    Главная мысль: Lean — это не просто технология производства. Это культура, в которой каждый
    каждый день немного улучшает свою работу. Спасибо за внимание!
  `,
  html: () => `
    <div class="fn-kanji jp" aria-hidden="true" data-r="blur" style="--i:0">改善</div>

    <div class="fn-head">
      <p class="eyebrow" data-r style="--i:0"><b>Итог</b> 1913 — сегодня</p>
      <h2 class="fn-title" data-r style="--i:1">Lean Production возникла из необходимости делать <span>больше с&nbsp;меньшими ресурсами</span></h2>
    </div>

    <div class="fn-chain">
      <svg class="fn-line" viewBox="0 0 1696 4" preserveAspectRatio="none" aria-hidden="true">
        <path class="fn-line__base" d="M0 2 H1696"/>
        <path class="draw fn-line__run" pathLength="1" d="M0 2 H1696" style="--draw-delay:700ms;--draw-dur:2400ms"/>
      </svg>
      <ol>
        ${chain
          .map(
            (c, i) => `
          <li class="fn-node ${i === chain.length - 1 ? 'is-last' : ''}" style="--k:${i}">
            <span class="fn-when" data-r="fade" style="--i:${i * 2.6 + 4}">${c.when}</span>
            <span class="fn-dot"></span>
            <b data-r style="--i:${i * 2.6 + 5}">${c.name}</b>
            <span class="fn-note" data-r="fade" style="--i:${i * 2.6 + 6}">${c.note}</span>
          </li>`,
          )
          .join('')}
      </ol>
    </div>

    <blockquote class="fn-quote" data-r style="--i:20">
      «Lean — это не просто технология производства. <span>Это культура постоянного улучшения.»</span>
    </blockquote>

    <div class="fn-bottom" data-r="fade" style="--i:23">
      <span class="fn-thanks">Спасибо за внимание</span>
      <span class="fn-seal"><span class="seal">改善</span><span class="caption">кайдзен — <b>непрерывное улучшение</b></span></span>
      <button class="fn-credits" type="button" data-action="credits">Источники фото</button>
    </div>
  `,
};
