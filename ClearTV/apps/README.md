# Папка для APK-файлов владельца

Что сюда попадает и как (`scripts/data/app-sources.json`, шаг `get-apps.ps1` в `FULL.cmd` / `START.cmd`):

| Приложение | Как | Что ставится |
|---|---|---|
| YouTube → SmartTube | скрипт качает сам с GitHub проекта SmartTube | открытый клиент YouTube для Android TV (запасной вариант) |
| Happ | скрипт качает сам с GitHub Happ-proxy | официальная сборка (пакет `su.happ.proxyutility`) |
| RUTUBE | скрипт качает сам с официальной кнопки rutube.ru/androidtv | официальное приложение для Android TV |
| TV Bro | скрипт качает сам с GitHub разработчика (release-канал из `latest_version.json`) | браузер, сделанный под пульт Android TV (собственный курсор) |
| YouTube (официальный), Netflix, Spotify, HBO Max, Apple TV, Twitch, Chrome | **APKMirror, по решению владельца**: скрипт открывает страницу в браузере ПК, человек нажимает «Download APK», скрипт подхватывает файл из «Загрузок» и кладёт сюда | подписанные разработчиками сборки (APKMirror сверяет подписи); сам сайт автоматике не поддаётся, поэтому одно нажатие — за человеком |

Вариант для этого телевизора (SaluteTV at30a6): **armeabi-v7a** (или universal/noarch), **nodpi или xhdpi** (320 dpi),
Android 13. Лучше «APK»; бандл «.apkm» тоже подойдёт — `install-apps.ps1` распакует его и поставит
`adb install-multiple` только с нужными сплитами (ABI, плотность, язык). Скрипт ждёт файл до 4 минут на
приложение (`-WaitMinutes`), Enter — пропустить; `-NoBrowser` — только напечатать ссылки.

Честно о том, что будет после установки: Netflix, HBO Max и Apple TV проверяют сертификацию устройства и DRM и не
обслуживают Россию — могут не запуститься или работать в SD только с зарубежным аккаунтом и VPN (Happ); Spotify в
России не обслуживает аккаунты; официальный YouTube и Chrome рассчитаны на сервисы Google и могут ругаться.
Проверено на SaluteTV at30a6 (2026-11-05): Spotify для Android TV, Apple TV, HBO Max (`com.wbd.hbomax`), RUTUBE,
SmartTube, Happ, VK Видео запускаются; Netflix для Android TV (`com.netflix.ninja`) — «версия не поддерживается»
(нужна телефонная сборка 8.x или старше); Twitch `tv.twitch.android.viewer` с APKMirror оказался Amazon-сборкой
(нужна обычная `tv.twitch.android.app`). Что из остального заработает, покажет только попытка; ClearTV поставит всё установленное на главный
экран сам (правила `favorites.xml`), а пока приложения нет — карточка веб-версии.

Свои файлы можно положить сюда вручную и запустить `APPS.cmd`. Файлы `*.apk`/`*.apkm` в репозиторий не попадают.
