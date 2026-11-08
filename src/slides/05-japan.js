import './05-japan.css';

const problems = [
  ['Нехватка ресурсов', 'сырья, энергии и оборудования'],
  ['Мало капитала', 'нет денег на огромные заводы и склады'],
  ['Маленький внутренний рынок', 'покупателей в разы меньше, чем в США'],
  ['Нельзя производить огромными партиями', 'не хватит ни денег, ни спроса'],
  ['Нужны разные модели', 'легковые машины, грузовики — малыми сериями'],
];

export default {
  id: 'japan',
  chapter: 'Послевоенная Япония',
  title: 'Япония после Второй мировой войны',
  theme: 'dark',
  notes: `
    После 1945 года японская промышленность была в руинах. Не хватало сырья, энергии, денег,
    а внутренний рынок был крошечным по сравнению с американским.

    Цифры из исследования MIT показывают масштаб разрыва: Toyota за 13 лет, с 1937 по 1950 год,
    выпустила 2 685 автомобилей. Завод Ford River Rouge в 1950 году выпускал около 7 000 машин в день.

    В 1950 году Эйдзи Тоёда изучал завод Ford в США и пришёл к выводу: копировать американскую
    систему в Японии бессмысленно. Нужен свой подход — производить разные модели небольшими партиями
    и без потерь.
  `,
  html: ({ img }) => `
    <div class="jp-photo photo photo--archive kb grain" data-r="fade" style="--i:0">
      ${img('tokyo')}
    </div>
    <div class="jp-shade"></div>
    <p class="jp-photo-caption caption" data-r="fade" style="--i:9"><b>Хатиодзи, Токио · 1945</b> · город после авианалётов</p>

    <div class="jp-main">
      <p class="eyebrow" data-r style="--i:1"><b>1945–1950</b> Япония</p>
      <h2 class="h1" data-r style="--i:2">Япония после войны</h2>
      <p class="lead jp-lead" data-r style="--i:3">Промышленность разрушена — начинать приходится почти с нуля.</p>
      <ul class="jp-problems">
        ${problems
          .map(
            ([t, d], i) => `
          <li data-r style="--i:${i + 4}">
            <i></i>
            <div><b>${t}</b><span>${d}</span></div>
          </li>`,
          )
          .join('')}
      </ul>
    </div>

    <div class="jp-numbers">
      <div class="jp-num" data-r style="--i:4">
        <div class="num-xl"><span data-count="2685" data-duration="1800">2 685</span></div>
        <p><b>автомобилей за 13 лет</b> выпустила Toyota с 1937 по 1950 год</p>
      </div>
      <div class="jp-vs" data-r="fade" style="--i:6"><span>vs</span></div>
      <div class="jp-num" data-r style="--i:7">
        <div class="num-xl accent"><span data-count="7000" data-duration="1800">7 000</span></div>
        <p><b>автомобилей в день</b> выпускал завод Ford River Rouge в 1950 году</p>
      </div>
      <p class="jp-source caption" data-r="fade" style="--i:9">Womack, Jones, Roos · The Machine That Changed the World, 1990</p>
    </div>

    <figure class="jp-eiji" data-r style="--i:11">
      <div class="jp-eiji__pic photo photo--archive grain">${img('eiji')}</div>
      <figcaption>
        <span class="label accent">1950 · поездка в США</span>
        <b>Эйдзи Тоёда</b>
        <span class="jp-eiji__meta">1913–2013 · позже президент Toyota</span>
        <p>Три месяца изучал завод Ford River Rouge и сделал вывод: копировать американскую систему в Японии нельзя.</p>
      </figcaption>
    </figure>

    <div class="jp-turn">
      <span class="jp-turn__a" data-r="left" style="--i:10">Условия не позволяли копировать американскую модель</span>
      <span class="jp-turn__line" aria-hidden="true">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M0 10 H100" style="--draw-delay:1500ms;--draw-dur:900ms"/></svg>
        <i></i>
      </span>
      <span class="jp-turn__b" data-r="right" style="--i:15">Нужно было придумать другой подход</span>
    </div>
  `,
};
