import './10-today.css';
import { icon } from './icons.js';

const domains = [
  { icon: 'car', title: 'Автомобилестроение', text: 'Канбан и Just-in-Time на сборочных линиях' },
  { icon: 'factory', title: 'Промышленность', text: 'От станков и электроники до самолётов' },
  { icon: 'medicine', title: 'Медицина', text: 'Меньше ожидания для пациентов, порядок в операционных' },
  { icon: 'code', title: 'IT', text: 'Kanban-доски, Lean Startup, быстрые релизы' },
  { icon: 'truck', title: 'Логистика', text: 'Поставки точно в срок, склады без завалов' },
  { icon: 'bank', title: 'Банки', text: 'Решение по кредиту за дни, а не за недели' },
  { icon: 'restaurant', title: 'Рестораны', text: 'Продуманное рабочее место, свежие продукты, быстрая выдача' },
  { icon: 'education', title: 'Образование', text: 'Понятные процессы: расписание, документы, проекты' },
];

export default {
  id: 'today',
  chapter: 'Lean сегодня',
  title: 'Lean сегодня: не только автомобили',
  theme: 'light',
  notes: `
    Сегодня Lean давно вышел за пределы автозаводов. Больницы сокращают время ожидания пациентов
    и наводят порядок в операционных. Банки ускоряют одобрение кредитов. IT-команды работают
    с Kanban-досками и выпускают продукт маленькими шагами. Рестораны продумывают рабочее место повара.

    Главная мысль слайда: Lean — это не набор инструментов для заводов. Это способ смотреть
    на любую работу как на процесс, который можно сделать понятнее, быстрее и без лишнего.
  `,
  html: ({ img }) => `
    <div class="td-left">
      <p class="eyebrow" data-r style="--i:0"><b>Сегодня</b> 2000-е — 2020-е</p>
      <h2 class="h1" data-r style="--i:1">Lean сегодня</h2>
      <p class="lead" data-r style="--i:2">Не только автомобили: подход работает везде, где есть процесс.</p>
      <figure class="td-photo photo photo--modern" data-r="mask" style="--i:3">
        ${img('kanbanboard')}
      </figure>
      <p class="td-thesis" data-r style="--i:4">Lean — это не набор инструментов для заводов. <span>Это способ организации процессов.</span></p>
    </div>

    <ul class="td-grid">
      ${domains
        .map(
          (d, i) => `
        <li class="td-item" data-r style="--i:${i + 3}">
          <span class="td-item__icon" style="--draw-delay:${500 + i * 110}ms">${icon(d.icon, { size: 52 })}</span>
          <div>
            <h3>${d.title}</h3>
            <p>${d.text}</p>
          </div>
        </li>`,
        )
        .join('')}
    </ul>
  `,
};
