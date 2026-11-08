import './07-tps.css';

const founders = [
  {
    key: 'sakichi',
    name: 'Сакити Тоёда',
    years: '1867–1930',
    text: 'Изобрёл ткацкий станок, который сам останавливается при обрыве нити. Отсюда идея дзидока.',
  },
  {
    key: 'kiichiro',
    name: 'Киитиро Тоёда',
    years: '1894–1952',
    text: 'Основал Toyota Motor (1937) и сформулировал принцип Just-in-Time.',
  },
  {
    key: 'shingo',
    name: 'Сигео Синго',
    years: '1909–1990',
    text: 'Инженер-консультант: быстрая переналадка SMED и защита от ошибок poka-yoke.',
  },
];

export default {
  id: 'tps',
  chapter: 'Toyota Production System',
  title: 'Toyota Production System: люди и два столпа',
  theme: 'dark',
  steps: 2,
  notes: `
    Шаг 1 — люди. Корни TPS — в ткацком станке Сакити Тоёды: он сам останавливался, если рвалась нить.
    Его сын Киитиро основал автомобильную компанию Toyota и сформулировал идею «точно вовремя».
    Систему в цехах построил инженер Тайити Оно: с конца 1940-х по 1970-е он ввёл канбан,
    описал семь видов потерь и метод «пяти почему». Сигео Синго добавил быструю переналадку
    оборудования и защиту от ошибок.

    Шаг 2 — два столпа TPS. Just-in-Time: производить только то, что нужно, когда нужно и сколько нужно.
    Jidoka: автоматизация с человеческим контролем — при любой проблеме линия останавливается,
    чтобы брак не пошёл дальше. В основании — стандартная работа, выравнивание и кайдзен.
  `,
  onStep(el, step) {
    el.querySelectorAll('.tps-tab').forEach((t, i) => t.setAttribute('aria-selected', String(i === step)));
  },
  html: ({ img }) => `
    <div class="tps-head">
      <p class="eyebrow" data-r style="--i:0"><b>1948–1975</b> Toyota, Япония</p>
      <h2 class="h1" data-r style="--i:1">Toyota Production System</h2>
    </div>
    <span class="tps-jp jp-vertical" data-r="fade" style="--i:4">トヨタ生産方式</span>

    <div class="tps-tabs" role="tablist" data-r="fade" style="--i:2">
      <button class="tps-tab" role="tab" type="button" data-step-to="0"><span>01</span>Люди</button>
      <button class="tps-tab" role="tab" type="button" data-step-to="1"><span>02</span>Два столпа</button>
    </div>

    <!-- Scene 1: people -->
    <div class="tps-scene tps-scene--people">
      <figure class="tps-ohno-photo photo photo--archive grain" data-r="mask-up" style="--i:2">
        ${img('ohno')}
      </figure>

      <div class="tps-ohno" data-r style="--i:3">
        <span class="label accent">Архитектор системы</span>
        <h3 class="tps-ohno__name">Тайити Оно</h3>
        <p class="tps-ohno__meta">1912–1990 · инженер, позже вице-президент Toyota</p>
        <ul class="tps-ohno__list">
          <li><b>Канбан</b> — карточки, по которым следующий участок «вытягивает» детали</li>
          <li><b>7 видов потерь</b> — что не добавляет ценности</li>
          <li><b>«5 почему»</b> — искать корневую причину проблемы</li>
        </ul>
        <blockquote class="tps-quote">
          «Мы смотрим на время от заказа клиента до получения денег — и сокращаем его, убирая потери»
        </blockquote>
      </div>

      <ul class="tps-founders">
        ${founders
          .map(
            (f, i) => `
          <li class="tps-founder" data-r="right" style="--i:${i + 5}">
            <div class="tps-founder__pic photo photo--archive">${f.key ? img(f.key) : `<span class="tps-nameplate jp">${f.jp}</span>`}</div>
            <div>
              <h4>${f.name}</h4>
              <span class="tps-founder__years">${f.years}</span>
              <p>${f.text}</p>
            </div>
          </li>`,
          )
          .join('')}
      </ul>
    </div>

    <!-- Scene 2: the TPS "house" -->
    <div class="tps-scene tps-scene--house" aria-label="Схема Toyota Production System">
      <div class="tps-house">
        <svg class="tps-roof" viewBox="0 0 1040 170" aria-hidden="true">
          <path d="M8 162 L520 8 L1032 162 Z" />
        </svg>
        <div class="tps-roof__text">
          <span class="label">Цель</span>
          <b>Качество · Низкая стоимость · Короткие сроки</b>
        </div>

        <div class="tps-pillars">
          <div class="tps-pillar">
            <span class="tps-pillar__jp jp">ジャスト・イン・タイム</span>
            <h3>Just-in-Time</h3>
            <p>Производить <b>только то, что нужно</b>, тогда, когда нужно, и столько, сколько нужно.</p>
            <span class="tps-pillar__tools">канбан · поток · вытягивание</span>
          </div>

          <div class="tps-core">
            <span class="tps-core__ring"></span>
            <b>Люди</b>
            <span>командная работа и кайдзен</span>
          </div>

          <div class="tps-pillar">
            <span class="tps-pillar__jp jp">自働化</span>
            <h3>Jidoka</h3>
            <p>Автоматизация с человеческим контролем: при проблеме <b>линия останавливается</b>, чтобы брак не пошёл дальше.</p>
            <span class="tps-pillar__tools">андон · стоп-шнур · poka-yoke</span>
          </div>
        </div>

        <div class="tps-base">
          <span>Стандартная работа</span><i></i><span>Выравнивание (хейдзунка)</span><i></i><span>Стабильные процессы</span>
        </div>
      </div>

      <aside class="tps-origin">
        <figure class="tps-loom photo photo--archive">
          ${img('loom')}
        </figure>
        <p class="caption"><b>Автоматический ткацкий станок Toyoda, тип G (1924)</b><br>Останавливался сам, если рвалась нить, — один человек мог следить за многими станками. Это и есть дзидока.</p>
        <div class="tps-origin__map">
          <div><span class="accent">JIT</span><i class="arr"></i>идея Киитиро Тоёды, 1930-е</div>
          <div><span class="accent">Jidoka</span><i class="arr"></i>станок Сакити Тоёды, 1924</div>
        </div>
      </aside>
    </div>
  `,
};
