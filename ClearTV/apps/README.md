# Папка для APK-файлов владельца

Сюда `get-apps.ps1` (шаг `FULL.cmd` / `START.cmd`, отдельно — через `scripts\get-apps.ps1`) скачивает установщики
приложений владельца **только из официальных источников разработчиков** (`scripts/data/app-sources.json`):

| Приложение | Откуда | Что ставится |
|---|---|---|
| YouTube | GitHub Releases проекта SmartTube (ссылка из его README) | SmartTube — открытый клиент YouTube для Android TV; официального YouTube на Салют ТВ нет (нет сервисов Google) |
| Twitch | вручную: официальный APK для Android TV (пакет `tv.twitch.android.app`) в эту папку | Twitch Interactive раздаёт приложение только через Google Play и Amazon Appstore; сторонний клиент Xtra по решению владельца убран и удаляется с телевизора |
| Happ | GitHub Releases Happ-proxy/happ-android (ссылка из README) | официальная сборка Happ (пакет `su.happ.proxyutility`); серверы не входят |
| RUTUBE | официальная кнопка «Скачать» на rutube.ru/androidtv → `rutube.ru/androidtv/latest/` → `promo.rutubelist.ru` (домены RUTUBE) | официальное приложение RUTUBE для Android TV |
| VK Видео | — | уже стоит на телевизоре |
| Netflix, HBO Max, Apple TV, Spotify, Chrome | — | официально вне магазинов не раздаются; на Салют ТВ (без сервисов Google, без сертификации, без DRM L1) и в России эти сервисы не работают — ни один лаунчер или APK этого не меняет. Единственный честный путь: сертифицированная приставка (Google TV / Apple TV) в HDMI-вход плюс зарубежный аккаунт и VPN |

Скрипт проверяет, что итоговый адрес после переадресаций принадлежит домену разработчика, что файл — zip с
`AndroidManifest.xml`, и записывает SHA-256 в `reports/apps-download.md`. Хэши заранее не закреплены: ссылки ведут
на последнюю версию. Затем `install-apps.ps1` устанавливает всё из этой папки (`adb install -r -t`).

Свои APK можно положить сюда вручную и запустить `APPS.cmd`. Файлы `*.apk` в репозиторий не попадают.
Для Twitch: нужен именно официальный APK-файл (не `.apkm`/bundle), версия для Android TV; после установки ClearTV
сам поставит его на главный экран (правило `twitch` = `tv.twitch.android.app`).

ClearTV ставит приложения из списка владельца первыми на главный экран (пока порядок ряда автоматический);
`clean.ps1` их никогда не отключает.
