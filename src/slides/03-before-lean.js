import './03-before-lean.css';
import { icon } from './icons.js';

const traits = [
  { icon: 'batch', text: 'Огромные партии одинаковых изделий' },
  { icon: 'warehouse', text: 'Большие склады и запасы' },
  { icon: 'hourglass', text: 'Длинные производственные циклы' },
  { icon: 'demand', text: 'Медленная реакция на спрос' },
];

const flowRow = (steps, kind) => `
  <div class="bl-flow bl-flow--${kind}">
    ${steps
      .map(
        (s, i) => `
      <div class="bl-step">
        <span class="bl-step__n">${String(i + 1).padStart(2, '0')}</span>
        <span class="bl-step__t">${s}</span>
        ${kind === 'push' && i === 1 ? '<span class="bl-pile" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' : ''}
      </div>
      ${i < steps.length - 1 ? '<span class="bl-link" aria-hidden="true"><i></i></span>' : ''}`,
      )
      .join('')}
  </div>`;

export default {
  id: 'before',
  chapter: 'До Lean',
  title: 'До появления Lean: эпоха массового производства',
  theme: 'dark',
  notes: `
    В первой половине XX века промышленность жила по логике массового производства:
    чем больше одинаковых изделий выпускается за раз, тем дешевле обходится каждое.

    Поэтому заводы делали огромные партии, а готовая продукция и детали месяцами лежали на складах.
    Если спрос менялся, перестроиться было трудно и дорого.

    Lean переворачивает эту логику: не «произвести много и потом продать», а «произвести ровно то,
    что нужно клиенту, и тогда, когда нужно».
  `,
  html: ({ img }) => `
    <figure class="bl-photo photo photo--archive kb grain" data-r="mask" style="--i:0">
      ${img('massprod')}
      <figcaption class="caption"><b>Одинаковые шасси Model T на конвейере</b><br>Ford, Хайленд-Парк, 1913</figcaption>
    </figure>

    <div class="bl-main">
      <p class="eyebrow" data-r style="--i:1"><b>1900–1950</b> до появления Lean</p>
      <h2 class="h1" data-r style="--i:2">Эпоха массового<br>производства</h2>
      <p class="lead" data-r style="--i:3">Главная цель — выпустить как можно больше. Чем больше партия, тем дешевле каждая штука.</p>

      <ul class="bl-traits">
        ${traits.map((t, i) => `<li data-r style="--i:${i + 4}">${icon(t.icon, { size: 46 })}<span>${t.text}</span></li>`).join('')}
      </ul>

      <div class="bl-compare">
        <div class="bl-row" data-r style="--i:8">
          <div class="bl-row__head">
            <span class="label">Традиционная модель</span>
            <span class="bl-tag">«толкаем» продукцию на склад</span>
          </div>
          ${flowRow(['Произвести много', 'Хранить', 'Продавать'], 'push')}
        </div>
        <div class="bl-row bl-row--lean" data-r style="--i:10">
          <div class="bl-row__head">
            <span class="label accent">Будущая модель Lean</span>
            <span class="bl-tag">клиент «вытягивает» продукцию</span>
          </div>
          ${flowRow(['Произвести необходимое', 'Тогда, когда нужно', 'Без лишних потерь'], 'pull')}
        </div>
      </div>
    </div>
  `,
};
