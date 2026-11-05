# Тестирование

Тест считается пройденным только там, где он реально выполнен. Три колонки: облачная среда разработки
(Linux, без телевизора и эмулятора), ПК с Windows (скрипты), телевизор (`verify.ps1`).

## Выполнено в облачной среде разработки (эта сессия)

| Проверка | Результат |
|---|---|
| Компиляция всех исходников Kotlin против API 34 с заглушками Android `java.*` (только API, существующие на Android) | OK, предупреждений об отсутствующих API нет |
| Ресурсы: `aapt2 compile/link`, манифест, 18 векторных иконок, 2 локали | OK |
| Dex: `dx` + DxCompat, проверка отсутствия ссылок на заглушки и `invokedynamic` | OK, 1170 классов, 13 474 метода (сборка 0.1.1) |
| Подпись и выравнивание: `zipalign -c`, `apksigner verify` (v2, v3) | OK |
| `aapt2 dump badging`: HOME/LEANBACK/LAUNCHER-активности, баннер, иконки 160–640 dpi, minSdk 24 | OK |
| JUnit (модуль `core`, через `gradlew :core:test`, Gradle 8.14.3, Kotlin 2.0.21) | 13 тестов, 0 падений |
| Встроенный ADB-клиент против поддельного adbd (`tools/adbtest/run.sh`: CNXN/AUTH TOKEN→SIGNATURE→RSAPUBLICKEY, shell, отказ потока) | OK, оба сценария (неизвестный ключ с подтверждением, известный ключ без запроса) |
| Тесты PowerShell-скриптов (`scripts/tests/run-tests.ps1`, PowerShell 7.4, подменный adb) | 82 проверки, 0 падений; см. ниже |
| Генерация растровых ассетов (иконки, баннер, 4 обоев) и визуальный просмотр баннера/обоев | OK |

Тесты скриптов покрывают: разбор `getprop`, списков пакетов, `dumpsys package packages`, `meminfo`, `gfxinfo`,
`tv_input` (формат AOSP и формат Салют ТВ/Android 13 без `type=`), `hdmi_control` (оба формата), событий logcat;
правила классификации (структурные + база знаний Салют ТВ, RRO-оверлеи); `diagnose.ps1` целиком
(отчёты, снимок, инвентаризация); `install.ps1` (журнал, `-SetHome` с хранителем); `clean.ps1` (план, отключение,
заставка до отключения, оверлей, защита, порог места, проверка здоровья); `verify.ps1` (поток управления, отчёт);
`restore.ps1` (откат HOME, пакетов, настроек, `-Uninstall`, пустой журнал); `run-all.ps1` (безопасный и полный
режим с проверкой-воротами).

## Выполнено на реальном телевизоре (отчёт друга, 2026-11-05)

SaluteTV `at30a6`, Android 13 (API 33), StarOS, Amlogic T5W, 2 ГБ RAM, 1920×1080 / 320 dpi, ADB по Wi-Fi.
Запуск `FULL.cmd` версии 0.1.0 (сводка — `reports/field-run-20261105.md`):

| Тест | Результат | Примечание |
|---|---|---|
| installed, cold_start, warm_start | PASS | `am start -W` TotalTime 561 мс, первый кадр 308 мс |
| all_apps, system_settings, hdmi_inputs, ram_usage, crash_recovery | PASS | PSS 56,1 МБ; HDMI открывает `ru.sberdevices.tvinputs` |
| dpad_navigation, open_app, reorder | FAIL / SKIP | ряд избранного пуст из-за гонки при первом запуске — исправлено в 0.1.1 (`favorites_touched`) |
| settings_panel | FAIL | клавиша MENU не доходит до приложения на пульте/прошивке Сбера — тест переписан на путь пультом ▲ ▶▶▶ OK |
| frame_stats | WARN | 57 % рывков, GPU ~15 мс/кадр — убраны дубликат фона, тени и полноэкранный градиент (0.1.1); требует повторного замера |
| home_key | SKIP | ClearTV ещё не назначен HOME (ворота run-all не пропустили полную настройку) |

## Не выполнено (невозможно в облачной среде)

- Запуск ClearTV на устройстве или эмуляторе: нет образов эмулятора (dl.google.com закрыт) и нет KVM.
- Сборка через Gradle/AGP: AGP и AndroidX лежат только на Google Maven. `build.ps1` выполняет её на вашем ПК.
- Любые измерения RAM/CPU/FPS, поведение прошивки Салют ТВ при смене HOME, HDMI, пульт, перезагрузка.

## На телевизоре: `scripts/verify.ps1`

| Требование задания | Тест verify.ps1 | Метод |
|---|---|---|
| Запуск приложения | `installed`, `cold_start`, `warm_start` | `am start -W`, `EVT first_frame`, resumed activity |
| Навигация с пульта | `dpad_navigation` | `input keyevent` + события `EVT focus` в logcat |
| Открытие установленных приложений | `open_app` | OK на первой плитке → `EVT launch ok=true` + смена resumed activity |
| Изменение порядка плиток | `reorder` | долгое OK → «Переместить» → ▶ → OK → `EVT order_saved`; затем возврат на место |
| Возврат на главный экран | `home_key` | KEYCODE_HOME → resumed activity (SKIP, если ClearTV не HOME) |
| Перезагрузка телевизора | `reboot` (`-Reboot`) | `adb reboot`, ожидание `sys.boot_completed`, resumed activity |
| Повторное подключение к Wi‑Fi | `wifi_cycle` (`-WifiCycle`, не по Wi‑Fi-ADB) | `svc wifi disable/enable` + `EVT network` |
| Проверка системных настроек | `system_settings` | `am start -a android.settings.SETTINGS` |
| Проверка HDMI | `hdmi_inputs` | `dumpsys tv_input` → `am start -a VIEW -d content://android.media.tv/passthrough/…` |
| Проверка расхода RAM | `ram_usage`, `soak` (`-SoakMinutes`) | `dumpsys meminfo` PSS, рост за время |
| Плавность | `frame_stats` | `dumpsys gfxinfo` после серии нажатий |
| Восстановление после аварийного завершения | `crash_recovery` | `am crash` (API 26+) / `force-stop`, затем HOME |
| Панель настроек, «Все приложения» | `settings_panel`, `all_apps` | пультом ▲ ▶▶▶ OK (на пультах Сбера нет MENU), запасные пути MENU и `am start --ez cleartv.open_settings true`; BACK; события `EVT overlay` |

Результат — `reports/verify-report.md` с колонкой доказательств (строки logcat, вывод `am start`).

## Ручные проверки (после verify.ps1)

- Читаемость подписей и часов с 3 м; контраст кольца фокуса на светлых обоях.
- Долгое нажатие OK на разных пультах (ИК и Bluetooth) открывает меню.
- Поведение кнопки голосового помощника при ClearTV как HOME.
- Сон/пробуждение: главный экран остаётся на месте, часы актуальны (приёмник TIME_TICK).
