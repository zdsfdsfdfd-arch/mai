import './12-tech.css';
import { icon } from './icons.js';

const stack = [
  { icon: 'automation', name: 'Automation', ru: 'автоматизация рутинных операций' },
  { icon: 'iot', name: 'IoT', ru: 'датчики сообщают о состоянии станков' },
  { icon: 'data', name: 'Big Data', ru: 'решения на основе данных, а не догадок' },
  { icon: 'chip', name: 'AI', ru: 'прогноз поломок, спроса и брака' },
  { icon: 'robot', name: 'Robotics', ru: 'точность и скорость на тяжёлых операциях' },
];

const hud = [
  { x: 210, y: 250, label: 'Датчик · вибрация', value: 'норма' },
  { x: 520, y: 520, label: 'ИИ-контроль качества', value: '99,7 %' },
  { x: 170, y: 760, label: 'Прогноз обслуживания', value: 'через 6 дн.' },
];

export default {
  id: 'tech',
  chapter: 'Lean + технологии',
  title: 'Lean + современные технологии',
  theme: 'dark',
  notes: `
    Сегодня Lean соединяется с технологиями Industry 4.0: автоматизацией, интернетом вещей,
    большими данными, искусственным интеллектом и роботами.

    Важно понимать порядок. Lean сначала убирает ненужные процессы. Технологии потом помогают
    делать нужные процессы быстрее, точнее и дешевле. Если автоматизировать процесс с потерями,
    потери тоже станут автоматическими — и быстрыми.

    Так появляется «умный завод»: датчики следят за станками, ИИ замечает брак и предсказывает
    поломки заранее, а люди занимаются улучшениями.
  `,
  html: ({ img }) => `
    <figure class="tc-photo photo photo--modern kb grain" data-r="fade" style="--i:0">
      ${img('smartfactory')}
    </figure>
    <div class="tc-shade"></div>

    <div class="tc-hud" aria-hidden="true">
      ${hud
        .map(
          (h, i) => `
        <div class="tc-tag" style="left:${h.x}px;top:${h.y}px;--i:${i * 2 + 9}" data-r="scale">
          <i></i><span>${h.label}</span><b>${h.value}</b>
        </div>`,
        )
        .join('')}
      <span class="tc-badge" data-r style="--i:14">= Smart Factory</span>
    </div>

    <div class="tc-main">
      <p class="eyebrow" data-r style="--i:0"><b>Industry 4.0</b> 2010-е — 2020-е</p>
      <h2 class="h1" data-r style="--i:1">Lean + технологии</h2>

      <ol class="tc-stack">
        <li class="tc-lean" data-r style="--i:2"><strong>Lean</strong><span class="tc-lean__text">сначала убираем всё ненужное</span></li>
        ${stack
          .map(
            (s, i) => `
          <li data-r="left" style="--i:${i + 3}">
            <em>+</em>
            <span class="tc-ic" style="--draw-delay:${600 + i * 140}ms">${icon(s.icon, { size: 36 })}</span>
            <b>${s.name}</b>
            <span>${s.ru}</span>
          </li>`,
          )
          .join('')}
      </ol>

      <div class="tc-split" data-r style="--i:9">
        <p><span class="label">Lean</span><span>устраняет <b>ненужные</b> процессы</span></p>
        <p><span class="label accent">AI и автоматизация</span><span>делают <b>необходимые</b> процессы быстрее, точнее и дешевле</span></p>
      </div>
    </div>
  `,
};
