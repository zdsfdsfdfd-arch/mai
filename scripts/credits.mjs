// Regenerates CREDITS.md from src/data/images.js:  npm run credits
import { writeFileSync } from 'node:fs';
import { images } from '../src/data/images.js';

const rows = Object.values(images)
  .map((i) => `| ${i.title} | ${i.author} | ${i.license} | [Wikimedia Commons](${i.source}) |`)
  .join('\n');

const md = `# Источники фотографий

Все фотографии взяты с [Wikimedia Commons](https://commons.wikimedia.org) и используются
на условиях указанных лицензий. Исторические снимки находятся в общественном достоянии (Public domain).
Для снимков под лицензиями CC BY / CC BY-SA указаны авторы; изображения обрезаны,
уменьшены и тонированы (ч/б, затемнение) для оформления слайдов.

| Фото | Автор | Лицензия | Источник |
| --- | --- | --- | --- |
${rows}

## Шрифты

Geologica, Golos Text, JetBrains Mono, Shippori Mincho — SIL Open Font License 1.1
(через [Fontsource](https://fontsource.org) и [Google Fonts](https://github.com/google/fonts)).
`;

writeFileSync(new URL('../CREDITS.md', import.meta.url), md);
console.log('CREDITS.md updated');
