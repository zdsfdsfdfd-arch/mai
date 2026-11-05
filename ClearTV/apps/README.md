# Папка для APK-файлов владельца

Сюда `get-apps.ps1` (шаг `FULL.cmd` / `START.cmd`, отдельно — через `scripts\get-apps.ps1`) скачивает установщики
приложений владельца **только из официальных источников разработчиков** (`scripts/data/app-sources.json`):

| Приложение | Откуда | Что ставится |
|---|---|---|
| YouTube | GitHub Releases проекта SmartTube (ссылка из его README) | SmartTube — открытый клиент YouTube для Android TV; официального YouTube на Салют ТВ нет (нет сервисов Google) |
| Twitch | GitHub Releases проекта Xtra (тег `latest`) | Xtra — открытый клиент Twitch с поддержкой Android TV; официальный Twitch есть только в Google Play |
| Happ | GitHub Releases Happ-proxy/happ-android (ссылка из README) | официальная сборка Happ (пакет `su.happ.proxyutility`); серверы не входят |
| RUTUBE | официальная страница rutube.ru/androidtv (ссылка на .apk берётся со страницы, только домен rutube.ru) | официальное приложение RUTUBE для Android TV |
| VK Видео | — | уже стоит на телевизоре |
| Netflix, HBO Max, Apple TV, Spotify, Chrome | — | официально вне магазинов не раздаются; на Салют ТВ легального способа нет, APK-агрегаторы не используются |

Скрипт проверяет, что итоговый адрес после переадресаций принадлежит домену разработчика, что файл — zip с
`AndroidManifest.xml`, и записывает SHA-256 в `reports/apps-download.md`. Хэши заранее не закреплены: ссылки ведут
на последнюю версию. Затем `install-apps.ps1` устанавливает всё из этой папки (`adb install -r -t`).

Свои APK можно положить сюда вручную и запустить `APPS.cmd`. Файлы `*.apk` в репозиторий не попадают.

ClearTV ставит приложения из списка владельца первыми на главный экран (пока порядок ряда автоматический);
`clean.ps1` их никогда не отключает.
