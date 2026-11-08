import './08-term.css';

const steps = [
  { when: '1948–1975', title: 'Toyota Production System', text: 'Система рождается в цехах Toyota. Снаружи её называют просто «японскими методами».' },
  { when: '1985–1990', title: 'Исследования MIT', text: 'Международная программа IMVP пять лет сравнивает автозаводы Японии, США и Европы.' },
  { when: '1988', title: 'Термин «Lean Production»', text: 'Исследователь MIT Джон Крафчик называет систему Toyota «lean» — «бережливой».' },
  { when: '1990 →', title: 'Мировое распространение', text: 'Книга о результатах исследования становится бестселлером. Lean изучают во всём мире.' },
];

const halves = ['человеческих усилий', 'производственных площадей', 'инвестиций в оборудование', 'времени на разработку модели'];

export default {
  id: 'term',
  chapter: 'Термин Lean',
  title: 'Как появился термин «Lean Production»',
  theme: 'dark',
  notes: `
    Важно: сама система Toyota существовала задолго до слова «Lean». Десятилетиями её называли
    просто Toyota Production System или «японскими методами».

    В 1980-х годах в Массачусетском технологическом институте (MIT) работала международная
    программа IMVP. Исследователи сравнивали автозаводы разных стран и увидели, что японские заводы
    делают машины быстрее, качественнее и с меньшими затратами.

    В 1988 году участник программы Джон Крафчик в своей статье назвал такой подход «lean» —
    «стройный, бережливый». А в 1990 году вышла книга Джеймса Вумека, Дэниела Джонса и Дэниела Руса
    «The Machine That Changed the World» («Машина, которая изменила мир»). После неё термин
    Lean Production стал известен во всём мире.
  `,
  html: ({ img }) => `
    <div class="tm-intro">
      <p class="eyebrow" data-r style="--i:0"><b>1988–1990</b> MIT, США</p>
      <h2 class="h1" data-r style="--i:1">Откуда взялось слово «Lean»</h2>
      <p class="lead" data-r style="--i:2">Система Toyota работала десятилетиями, прежде чем у неё появилось международное имя.</p>

      <figure class="tm-author" data-r style="--i:4">
        <div class="tm-author__pic photo photo--archive grain">${img('krafcik')}</div>
        <figcaption>
          <span class="label accent">Автор термина</span>
          <b>Джон Крафчик</b>
          <span class="tm-author__meta">исследователь MIT · 1988</span>
          <p>В статье «Triumph of the Lean Production System» первым назвал систему Toyota словом «lean».</p>
        </figcaption>
      </figure>

      <div class="tm-half" data-r style="--i:9">
        <div class="tm-half__num">½</div>
        <div>
          <p class="tm-half__q">Почему «бережливое»? По сравнению с массовым производством — вдвое меньше:</p>
          <ul class="tm-half__list">
            ${halves.map((h) => `<li><i><b></b></i>${h}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <ol class="tm-steps">
      <li class="tm-steps__line" aria-hidden="true">
        <svg viewBox="0 0 4 640" preserveAspectRatio="none"><path class="draw" pathLength="1" d="M2 0 V640" style="--draw-delay:500ms;--draw-dur:2200ms"/></svg>
      </li>
      ${steps
        .map(
          (s, i) => `
        <li class="tm-step ${i === 2 ? 'is-key' : ''}" data-r style="--i:${i * 2 + 3}">
          <span class="tm-dot"></span>
          <span class="tm-when">${s.when}</span>
          <h3>${s.title}</h3>
          <p>${s.text}</p>
        </li>`,
        )
        .join('')}
    </ol>

    <figure class="tm-book" data-r="scale" style="--i:6">
      <div class="tm-cover">
        <span class="tm-cover__top">MIT · International Motor Vehicle Program</span>
        <span class="tm-cover__title">The Machine That Changed the World</span>
        <span class="tm-cover__line"></span>
        <span class="tm-cover__sub">The Story of Lean Production</span>
        <span class="tm-cover__authors">James P. Womack<br>Daniel T. Jones<br>Daniel Roos</span>
      </div>
      <figcaption>
        <b>«The Machine That Changed the World»</b>
        <span>Вумек, Джонс, Рус · 1990 · книга, сделавшая Lean известным</span>
      </figcaption>
    </figure>
  `,
};
