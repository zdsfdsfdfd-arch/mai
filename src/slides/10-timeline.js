import './10-timeline.css';
import { icon } from './icons.js';

const eras = [
  { when: '1940–50-е', icon: 'kanban', title: 'Рождение TPS', text: 'Тайити Оно строит систему в цехах Toyota: канбан, Just-in-Time, дзидока.' },
  { when: '1960–70-е', icon: 'crisis', title: 'Проверка кризисом', text: 'После нефтяного кризиса 1973 года Toyota восстанавливается быстрее других — методы перенимает вся Япония.' },
  { when: '1980-е', icon: 'globe', title: 'Запад учится', text: 'GM и Toyota открывают совместный завод NUMMI (1984). Методы Toyota изучают в США и Европе.' },
  { when: '1990-е', icon: 'book', title: 'Слово «Lean»', text: 'Книги «The Machine That Changed the World» (1990) и «Lean Thinking» (1996).' },
  { when: '2000-е', icon: 'cross', title: 'За пределами заводов', text: 'Lean приходит в больницы, банки, логистику и сервис. Появляется Lean Six Sigma.' },
  { when: '2010-е', icon: 'screen', title: 'Lean + digital', text: 'Lean Startup (Эрик Рис, 2011), Agile и Kanban-доски в IT. Процессы становятся цифровыми.' },
  { when: '2020-е', icon: 'chip', title: 'Lean + AI', text: 'Industry 4.0: датчики, данные, ИИ и роботы помогают убирать потери.' },
];

export default {
  id: 'timeline',
  chapter: 'Развитие Lean',
  title: 'Как развивался Lean: 1940-е — 2020-е',
  theme: 'dark',
  notes: `
    Пройдём по десятилетиям. В 1940–50-е годы Тайити Оно создаёт систему в цехах Toyota.
    В 1973 году нефтяной кризис ударил по всем автопроизводителям, но Toyota восстановилась быстрее —
    и японские компании начали массово перенимать её методы.

    В 1980-е Запад начинает учиться: General Motors и Toyota открывают совместный завод NUMMI
    в Калифорнии. В 1990-е появляется слово Lean и выходят ключевые книги.

    В 2000-е Lean выходит за пределы заводов — в больницы, банки, логистику. В 2010-е — в IT:
    Эрик Рис пишет «The Lean Startup», появляются Agile и Kanban-доски. Теперь каждый стартап
    немного Toyota, только с пуфиками и смузи.

    Красный клин внизу показывает, как Lean разлетелся по миру. Примерно как любой мем:
    сначала один завод, через пару лет его знают все отрасли.
  `,
  html: ({ img }) => `
    <div class="tl-head">
      <p class="eyebrow" data-r style="--i:0"><b>80 лет</b> развития</p>
      <h2 class="h1" data-r style="--i:1">Как развивался Lean</h2>
      <p class="tl-lead lead" data-r style="--i:2">От одного японского завода — к способу работы по всему миру.</p>
    </div>

    <figure class="tl-person" data-r style="--i:3">
      <div class="tl-person__pic photo photo--archive grain">${img('ries')}</div>
      <figcaption>
        <span class="label accent">2011 · Lean Startup</span>
        <b>Эрик Рис</b>
        <span class="tl-person__meta">предприниматель, автор книги</span>
        <p>В книге «The Lean Startup» перенёс идеи Toyota в стартапы и IT: делать продукт маленькими шагами и проверять каждый на клиентах.</p>
      </figcaption>
    </figure>

    <div class="tl">
      <svg class="tl-line" viewBox="0 0 1696 4" preserveAspectRatio="none" aria-hidden="true">
        <path class="tl-line__base" d="M0 2 H1696"/>
        <path class="draw tl-line__run" pathLength="1" d="M0 2 H1696" style="--draw-delay:400ms;--draw-dur:2600ms"/>
      </svg>
      <ol class="tl-eras">
        ${eras
          .map(
            (e, i) => `
          <li class="tl-era ${i === eras.length - 1 ? 'is-now' : ''}" style="--k:${i}">
            <div class="tl-era__top" data-r style="--i:${i * 2.4 + 3}">
              ${
                e.photo
                  ? `<span class="tl-era__photo photo photo--archive grain">${img(e.photo)}</span>`
                  : `<span class="tl-era__icon" style="--draw-delay:${700 + i * 330}ms">${icon(e.icon, { size: 60 })}</span>`
              }
              <span class="tl-era__when">${e.when}</span>
            </div>
            <span class="tl-node">${i === eras.length - 1 ? '<span class="pulse"></span>' : ''}</span>
            <div class="tl-era__body" data-r style="--i:${i * 2.4 + 4}">
              <h3>${e.title}</h3>
              <p>${e.text}</p>
            </div>
          </li>`,
          )
          .join('')}
      </ol>
    </div>

    <figure class="tl-scope">
      <div class="tl-scope__shape" data-r="mask" style="--i:19">
      <svg viewBox="0 0 1696 110" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="tl-scope-fill" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style="stop-color:var(--accent);stop-opacity:0.06"/>
            <stop offset="1" style="stop-color:var(--accent);stop-opacity:0.5"/>
          </linearGradient>
        </defs>
        <path d="M0 53 C 760 52, 1250 38, 1696 0 L1696 110 C 1250 72, 760 58, 0 57 Z" fill="url(#tl-scope-fill)"/>
        <path d="M0 55 C 760 55, 1250 55, 1696 55" fill="none" style="stroke:var(--accent);stroke-width:1;stroke-dasharray:2 6;vector-effect:non-scaling-stroke"/>
      </svg>
      </div>
      <figcaption data-r="fade" style="--i:21">
        <span class="label">Масштаб применения</span>
        <span class="label">один завод <i class="arr"></i> весь мир, любые отрасли</span>
      </figcaption>
    </figure>
  `,
};
