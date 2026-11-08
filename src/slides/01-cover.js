import './01-cover.css';

// Stations on the cover's flow line preview the whole story.
const stations = [
  { x: 112, year: '1913', label: 'Ford' },
  { x: 560, year: '1950-е', label: 'Toyota' },
  { x: 1010, year: '1988', label: 'Lean' },
  { x: 1460, year: '2020-е', label: 'Smart Factory' },
];

export default {
  id: 'cover',
  chapter: 'Обложка',
  title: 'История возникновения Lean Production',
  theme: 'dark',
  notes: `
    Сегодня разберём, как появилась концепция Lean Production — бережливое производство.
    Путь длиной больше ста лет: от конвейера Генри Форда в 1913 году до «умных» заводов 2020-х.
    Спойлер: больше всех ауры в этой истории нафармят японцы.

    Главный вопрос презентации: почему подход, придуманный на японском автозаводе после войны,
    сегодня используют больницы, банки, IT-компании и даже школы? Начинай спокойно и уверенно,
    как сигма на собеседовании: первые десять секунд решают, будет класс слушать или листать ленту.

    Фото на обложке сделано в 2011 году на заводе во Фримонте (Калифорния). С 1984 по 2010 год
    здесь работал NUMMI — совместный завод General Motors и Toyota, где американские инженеры
    учились производственной системе Toyota. Красные роботы — не для красоты, они правда такие.
  `,
  html: ({ img }) => `
    <div class="cover-photo photo photo--modern kb grain" data-r="fade" style="--i:0">
      ${img('cover')}
    </div>
    <div class="cover-shade"></div>

    <svg class="cover-flow" viewBox="0 0 1920 1080" aria-hidden="true">
      <path class="draw cover-flow__faint" pathLength="1" style="--draw-delay:500ms;--draw-dur:2200ms"
        d="M1920 560 C 1480 580, 1300 868, 1010 868"/>
      <path class="draw cover-flow__faint" pathLength="1" style="--draw-delay:650ms;--draw-dur:2200ms"
        d="M1920 740 C 1720 750, 1640 868, 1460 868"/>
      <path class="draw cover-flow__main" id="cover-line" pathLength="1" style="--draw-delay:350ms;--draw-dur:2000ms"
        d="M112 868 H 1808"/>
      ${stations
        .map(
          (s, i) => `
        <g class="cover-station" style="--i:${i}">
          <line x1="${s.x}" y1="852" x2="${s.x}" y2="884"/>
          <circle cx="${s.x}" cy="868" r="${i === stations.length - 1 ? 7 : 4}" class="${i === stations.length - 1 ? 'is-now' : ''}"/>
        </g>`,
        )
        .join('')}
      <circle class="cover-runner" r="5">
        <animateMotion dur="7s" repeatCount="indefinite" path="M112 868 H 1808" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1"/>
      </circle>
    </svg>

    <div class="cover-stations">
      ${stations
        .map(
          (s, i) => `
        <div class="cover-station-label" style="left:${s.x}px;--i:${i + 6}" data-r="fade">
          <span>${s.year}</span><b>${s.label}</b>
        </div>`,
        )
        .join('')}
    </div>

    <div class="cover-text">
      <p class="eyebrow" data-r style="--i:1"><b>Бережливое производство</b> 1913 — 2026</p>
      <h1 class="cover-title">
        <span class="cover-title__a" data-r="mask-up" style="--i:2">История возникновения</span>
        <span class="cover-title__b" data-r="mask-up" style="--i:3">Lean Production</span>
      </h1>
      <p class="cover-sub" data-r style="--i:5">От производственной системы Toyota до&nbsp;современного бережливого производства</p>
    </div>

    <div class="cover-jp" data-r="fade" style="--i:8">
      <span class="jp-vertical">リーン生産方式の歴史</span>
      <i class="cover-jp__dot"></i>
    </div>
  `,
};
