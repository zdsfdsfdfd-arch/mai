import './08-wastes.css';
import { icon } from './icons.js';

const wastes = [
  { icon: 'overproduction', title: 'Перепроизводство', text: 'Сделать больше или раньше, чем нужно', example: 'Испекли 100 пирожков, а купили 60. Остальное — в мусор.' },
  { icon: 'waiting', title: 'Ожидание', text: 'Люди и машины простаивают', example: 'Станок ждёт детали, рабочий ждёт, пока освободится станок.' },
  { icon: 'transport', title: 'Лишняя транспортировка', text: 'Детали возят туда-сюда', example: 'Склад в другом конце завода: каждую партию везут через весь цех.' },
  { icon: 'overprocessing', title: 'Избыточная обработка', text: 'Делать больше, чем ценит клиент', example: 'Полировать деталь, которую никто никогда не увидит.' },
  { icon: 'inventory', title: 'Запасы', text: 'Лишние материалы и продукция', example: 'Полки забиты деталями «на всякий случай» — это замороженные деньги.' },
  { icon: 'motion', title: 'Лишние движения', text: 'Ненужные шаги, наклоны, поиски', example: 'Инструмент лежит далеко — за ним приходится ходить десятки раз в день.' },
  { icon: 'defects', title: 'Дефекты', text: 'Брак, переделки, исправления', example: 'Ошибку заметили в конце линии — переделывать приходится весь узел.' },
];

export default {
  id: 'wastes',
  chapter: '7 видов потерь',
  title: '7 видов потерь (муда)',
  theme: 'light',
  notes: `
    Тайити Оно описал семь видов потерь — по-японски «муда». Это всё, что тратит время, силы
    и деньги, но не делает продукт ценнее для клиента.

    Самой опасной Оно считал перепроизводство: оно порождает остальные потери — запасы,
    транспортировку, ожидание. Свежий пример: фабрика наделала гору Лабубу, а мода уже прошла.
    Это перепроизводство и запасы в одном флаконе.

    Нажмите на любую карточку, чтобы увидеть пример из жизни. Можно спросить класс, какой вид потерь
    самый частый в школе. Ответ «ожидание звонка» засчитывается автоматически. А лишние движения —
    это когда третий раз за день ищешь зарядку по всей квартире.

    Сегодня к семи видам часто добавляют восьмой — неиспользованный потенциал людей: идеи
    сотрудников, которые никто не спросил.
  `,
  onEnter(el) {
    el.querySelectorAll('.waste.is-open').forEach((c) => {
      c.classList.remove('is-open');
      c.setAttribute('aria-expanded', 'false');
    });
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    el.addEventListener('click', (e) => {
      const card = e.target.closest('.waste');
      if (!card) return;
      const open = !card.classList.contains('is-open');
      el.querySelectorAll('.waste.is-open').forEach((c) => {
        c.classList.remove('is-open');
        c.setAttribute('aria-expanded', 'false');
      });
      card.classList.toggle('is-open', open);
      card.setAttribute('aria-expanded', String(open));
    });
  },
  html: () => `
    <div class="ws-head">
      <p class="eyebrow" data-r style="--i:0"><b>Муда</b> классификация Тайити Оно</p>
      <h2 class="h1" data-r style="--i:1">7 видов потерь</h2>
      <p class="lead" data-r style="--i:2">Всё, что тратит время и ресурсы, но не делает продукт ценнее для клиента.</p>
    </div>
    <div class="ws-kanji jp" aria-hidden="true" data-r="blur" style="--i:3">無駄</div>
    <p class="ws-hint label" data-r="fade" style="--i:12">Нажмите на карточку — пример</p>

    <ol class="ws-grid">
      ${wastes
        .map(
          (w, i) => `
        <li>
          <button class="waste" type="button" aria-expanded="false" data-r style="--i:${i * 1.6 + 3}">
            <span class="waste__n">${String(i + 1).padStart(2, '0')}</span>
            <span class="waste__icon" style="--draw-delay:${500 + i * 130}ms">${icon(w.icon, { size: 84 })}</span>
            <span class="waste__title">${w.title}</span>
            <span class="waste__text">${w.text}</span>
            <span class="waste__example"><span class="label">Пример</span>${w.example}</span>
          </button>
        </li>`,
        )
        .join('')}
      <li class="ws-extra" data-r style="--i:15">
        <span class="waste__n">+1</span>
        <span class="waste__icon">${icon('talent', { size: 84 })}</span>
        <span class="waste__title">Неиспользованный потенциал людей</span>
        <span class="waste__text">Современное дополнение: идеи сотрудников, которые никто не спросил</span>
      </li>
    </ol>
  `,
};
