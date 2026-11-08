import './02-what-is-lean.css';
import { icon } from './icons.js';

const principles = [
  { icon: 'value', title: 'Ценность', text: 'Понять, за что клиент действительно готов платить' },
  { icon: 'nowaste', title: 'Без потерь', text: 'Убрать действия, которые не добавляют ценности' },
  { icon: 'kaizen', title: 'Кайдзен', text: 'Улучшать процесс понемногу — каждый день' },
  { icon: 'people', title: 'Уважение к людям', text: 'Лучшие идеи — у тех, кто делает работу' },
  { icon: 'flow', title: 'Поток', text: 'Работа движется без очередей и остановок' },
];

// One process seen through the customer's eyes: v = value, w = waste (relative widths).
const process = [
  ['w', 15], ['v', 4], ['w', 22], ['v', 3], ['w', 27], ['v', 4], ['w', 14], ['v', 3], ['w', 8],
];

export default {
  id: 'what',
  chapter: 'Понятие',
  title: 'Что такое Lean Production?',
  theme: 'light',
  notes: `
    Lean в переводе с английского — «стройный», «без лишнего». В русском прижилось «бережливое производство».
    Только не путать с ленью. Хотя ленивые люди часто первыми придумывают, как убрать лишние действия, — это база.

    Посмотрите на схему: в обычном процессе ценность для клиента создают только короткие красные отрезки.
    Всё серое — ожидание, перемещения, склады, переделки. Примерно как утро перед школой: сорок минут
    сборов, из них полезных минуты три. Lean не заставляет работать быстрее — он убирает серое.
    Ценности столько же, а процесс становится короче.

    Пять идей внизу — основа подхода: ценность, устранение потерь, постоянное улучшение (кайдзен),
    уважение к людям и непрерывный поток. Их можно не зубрить, но звучат они солидно.
  `,
  html: () => `
    <div class="what-head">
      <p class="eyebrow" data-r style="--i:0"><b>Понятие</b> lean — «стройный, без лишнего»</p>
      <h2 class="h1" data-r style="--i:1">Что такое<br>Lean Production?</h2>
      <p class="lead" data-r style="--i:2">Подход к организации работы, где всё подчинено <b class="ink">ценности для клиента</b>, а всё лишнее последовательно убирается.</p>
    </div>

    <div class="what-formula" data-r style="--i:3">
      <div class="what-formula__row">
        <span class="what-formula__k">Ценность для клиента</span>
        <span class="what-formula__v is-up">максимум</span>
      </div>
      <div class="what-formula__row">
        <span class="what-formula__k">Потери</span>
        <span class="what-formula__v is-down">минимум</span>
      </div>
    </div>

    <figure class="what-diagram" data-r style="--i:4">
      <figcaption class="label">Один процесс глазами клиента</figcaption>
      <div class="what-bar-wrap">
        <span class="what-bar-label">Обычный процесс</span>
        <div class="what-bar">
          ${process.map(([t, w]) => `<i class="${t}" style="--g:${(w * 6.9).toFixed(1)}"></i>`).join('')}
        </div>
      </div>
      <div class="what-bar-wrap">
        <span class="what-bar-label">Lean-процесс</span>
        <div class="what-bar is-lean">
          ${process.map(([t, w], i) => `<i class="${t}" style="--g:${(w * 6.9).toFixed(1)};--k:${i}"></i>`).join('')}
        </div>
        <span class="what-bar-note">та же ценность — <b>в разы быстрее</b></span>
      </div>
      <div class="what-legend">
        <span><i class="v"></i>Ценность — то, за что клиент платит</span>
        <span><i class="w"></i>Потери — ожидание, перемещения, запасы, переделки</span>
      </div>
    </figure>

    <ol class="what-principles">
      <li class="what-line" aria-hidden="true"><svg viewBox="0 0 1696 12" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 6 H1696" style="--draw-delay:900ms;--draw-dur:1800ms"/></svg></li>
      ${principles
        .map(
          (p, i) => `
        <li class="what-principle" data-r style="--i:${i + 7}">
          <span class="what-node"></span>
          ${icon(p.icon, { size: 52 })}
          <h3>${p.title}</h3>
          <p>${p.text}</p>
        </li>`,
        )
        .join('')}
    </ol>
  `,
};
