import './05-ford.css';

export default {
  id: 'ford',
  chapter: 'Генри Форд',
  title: 'Генри Форд и массовое производство',
  theme: 'dark',
  notes: `
    В 1908 году Ford выпустил Model T — простой, надёжный и доступный автомобиль.
    В 1913 году на заводе в Хайленд-Парке заработал движущийся сборочный конвейер:
    машина сама ехала мимо рабочих, а каждый выполнял одну простую операцию.

    К 1914 году время сборки шасси сократилось примерно с 12,5 часа до 93 минут. Это меньше,
    чем полнометражный фильм: Форд за это время собирал шасси, а мы обычно только выбираем, что посмотреть.
    Всего выпустили около 15 миллионов Model T, а цена упала с 850 до менее чем 300 долларов.

    Форд заложил основу современной эффективности: конвейер, стандартизация, разделение операций.
    Но его система была рассчитана на огромные партии одинаковых машин. Цитату про чёрный цвет
    читай голосом человека, у которого 15 миллионов одинаковых машин и ноль сомнений:
    минимализм уровня «я художник, я так вижу».
  `,
  html: ({ img }) => `
    <figure class="ford-photo photo photo--archive kb grain" data-r="mask" style="--i:0">
      ${img('fordline')}
      <figcaption class="caption"><b>Сборочный конвейер Ford</b><br>Хайленд-Парк, Мичиган, 1913</figcaption>
    </figure>

    <figure class="ford-car photo photo--archive grain" data-r="mask-up" style="--i:6">
      ${img('modelt')}
      <figcaption class="caption"><b>Ford Model T</b> · 1908–1927</figcaption>
    </figure>

    <div class="ford-main">
      <p class="eyebrow" data-r style="--i:1"><b>1908–1927</b> США</p>

      <div class="ford-person" data-r style="--i:2">
        <div class="ford-portrait photo photo--archive">${img('ford')}</div>
        <div>
          <h2 class="h1">Генри Форд<br>и конвейер</h2>
          <p class="ford-who">1863–1947 · основатель Ford Motor Company</p>
        </div>
      </div>

      <div class="ford-stats">
        <div class="ford-stat" data-r style="--i:3">
          <div class="num-l"><span data-count="93" data-from="750" data-duration="1800">93</span><small>мин</small></div>
          <p>на сборку одного шасси к 1914 году — вместо 12,5 часа до конвейера</p>
        </div>
        <div class="ford-stat" data-r style="--i:4">
          <div class="num-l"><span data-count="15">15</span><small>млн</small></div>
          <p>автомобилей Model T — первого по-настоящему массового автомобиля</p>
        </div>
      </div>

      <ul class="chips" data-r style="--i:5">
        <li class="chip"><i></i>Движущийся конвейер</li>
        <li class="chip"><i></i>Стандартизация</li>
        <li class="chip"><i></i>Разделение операций</li>
      </ul>

      <blockquote class="ford-quote" data-r style="--i:7">
        <p>«Автомобиль может быть любого цвета, если этот цвет — чёрный»</p>
        <footer>Генри Форд о Model T · <span>мощная система, но только для огромных партий одинаковых машин</span></footer>
      </blockquote>
    </div>
  `,
};
