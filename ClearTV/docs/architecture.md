# Архитектура ClearTV

## Цели и ограничения

- Домашний экран уровня потребительской электроники: один ряд, крупные часы, тихий фон, чёткий фокус.
- Мгновенный отклик на пульт на слабом железе (Салют ТВ — как правило 1–1,5 ГБ RAM, Amlogic/MediaTek).
- Нулевая зависимость от сторонних библиотек: сборка возможна даже без доступа к Google Maven.
- Никаких изменений системы: приложение ставится как обычный APK и становится HOME только штатным способом.

## Почему платформенные View, а не Jetpack Compose for TV

Предпочтительным стеком в задании были Compose for TV, AndroidX TV, DataStore и coroutines. В проекте
использованы только API платформы Android (android.view, android.widget, SharedPreferences, Executors):

1. **Проверяемость.** Среда разработки не имела доступа к `dl.google.com`, где лежат AGP, AndroidX и Compose.
   Код на Compose нельзя было бы даже скомпилировать, а поставлять непроверенный код запрещено условиями
   задания. Платформенный стек собран и проверен здесь полностью (см. `docs/build-without-sdk.md`).
2. **Ресурсы.** Compose-лаунчер на 1 ГБ устройстве стартует 1,5–3 с и занимает 80–120 МБ; ClearTV — один
   процесс без фреймворков, dex 2,6 МБ, 13 тыс. методов, ожидаемый PSS 40–60 МБ (замеряется `verify.ps1`).
3. **Зрелость фокуса.** Система фокуса платформы (FocusFinder, D-pad, `nextFocus*`) — та же, что в системных
   приложениях Android TV; она не требует обходов и одинаково ведёт себя на Android 7–14.

Миграция на Compose при желании тривиальна по структуре: слой `data/` и модуль `core/` не зависят от UI,
`HomeActivity` можно заменить на `ComponentActivity` с `setContent {}`, сохранив репозитории.

## Модули

- `core/` (JVM, без Android): `AppOrder` (merge/retain/move/кодек порядка), `StringSetCodec`, `ClockMode`,
  `CrashLoopDetector`, `Grid`, `Scrolling`. Покрыт JUnit 5 (13 тестов).
- `app/` (Android, minSdk 24, compileSdk/targetSdk 34):
  - `ClearTvApp` — создаёт репозитории, ставит `CrashGuard`, применяет безопасный режим после цикла падений.
  - `data/Prefs` — SharedPreferences: избранное (порядок), скрытые, обои, часы, подписи, входы, анимация.
  - `data/AppRepository` — `PackageManager.queryIntentActivities` для LEANBACK_LAUNCHER и LAUNCHER, кэш
    карточек (LruCache по байтам, 24 МБ, масштаб ≤ 2x), баннер или иконка на фоне доминирующего цвета,
    слушатель `PACKAGE_*`, определение текущего HOME.
  - `data/WallpaperRepository` — 4 встроенных фона + папка `Android/data/com.cleartv.launcher/files/wallpapers`
    (без разрешений на хранилище) + импорт через системный выбор документов, если он есть в прошивке.
  - `data/TvInputsRepository` — `TvInputManager.getTvInputList()` → passthrough-входы → `ACTION_VIEW` на
    `TvContract.buildChannelUriForPassthroughInput`; ряд показывается только если есть обработчик.
  - `data/NetworkMonitor` — `registerDefaultNetworkCallback`: Wi‑Fi/Ethernet/нет сети + VALIDATED.
  - `ui/HomeActivity` — оркестрация: ряды, клавиши, режим перемещения, оверлеи, обои, часы, сеть.
  - `ui/AppCardView` — карточка 16:9: масштаб 1.10, анимированное кольцо фокуса, подпись, бейдж выбора.
  - `ui/FocusRow` — `HorizontalScrollView` с плавной прокруткой по фокусу, отступом от края и памятью позиции.
  - `ui/SettingsPanel` — правая панель со стеком страниц (обои, скрытые, о системе/диагностика).
  - `ui/AllAppsView` — сетка 5 колонок всех видимых приложений.
  - `util/CrashGuard` — пишет стек в `files/crash/`, при 3 падениях за 2 минуты включает безопасный режим.
  - `util/Logs` — единый тег `ClearTV`; строки `EVT name k=v` читает `verify.ps1` через logcat.

## Поток данных

```
PackageManager ──load()──▶ AppRepository.cached ──▶ HomeActivity.rebuildFavorites()
                                                    │   prefs.favorites (порядок) ∩ установленные
                                                    ▼
                                             FocusRow(appsRow) ← AppCardView × N + «Все приложения»
TvInputManager ──list()──▶ inputs(resolvable) ──▶ FocusRow(inputsRow) (скрыт, если пусто)
ConnectivityManager ─callback─▶ NetworkMonitor ──▶ иконка + подпись
Prefs.OnSharedPreferenceChangeListener ──▶ onPrefChanged(key) → точечное обновление UI
```

Всё тяжёлое (запросы PackageManager, декодирование bitmap) выполняется в `Async.io` (2 потока), результат
доставляется в главный поток. На старте: inflate → фоновая загрузка списка → отрисовка ряда → ленивая
отрисовка карточек; событие `EVT first_frame ms=…` фиксирует время до первого ряда.

## Фокус и клавиши

- Все интерактивные элементы — `focusable`; `defaultFocusHighlightEnabled=false`, своё кольцо фокуса.
- Переходы между рядами — штатный FocusFinder; `FocusRow.onRequestFocusInDescendants` возвращает фокус на
  последнюю карточку ряда.
- `dispatchKeyEvent` перехватывает D-pad только в режиме перемещения; MENU — в `onKeyDown`; BACK — `onBackPressed`.
- Оверлеи блокируют фокус основного экрана через `descendantFocusability = FOCUS_BLOCK_DESCENDANTS`.
- Долгое нажатие OK — стандартный `performLongClick` платформы (KEYCODE_DPAD_CENTER/ENTER).

## Главный экран (как в ролике «Превращаю СберТВ в Apple TV»)

Компоновка повторяет лаунчер CleanYourTV, который показан в ролике: чёрный фон; слева приветствие капителью,
тонкие часы (Outfit 300) и дата; справа три «пилюли» (Источники — список HDMI/AV через `TvInputManager`, сеть —
открывает настройки Wi‑Fi, Настройки — панель ClearTV); внизу имя сфокусированного приложения крупным тонким
шрифтом над скруглённой полосой дока; за всем — `AmbientView`, радиальное свечение в доминирующем цвете
артворка выбранного приложения (цвет считается один раз при рендере карточки и кэшируется). Кнопка ▼ с дока
поднимает сетку всех приложений, ▲ в первом ряду сетки возвращает док. Обои с изображением остаются как опция.

## Дизайн-система

- Канва 960×540 dp (1080p при 320 dpi и 4K при 640 dpi дают одинаковые dp).
- Цвета: фон `#0E1013`, поверхность `#16191D`, текст `#F2F4F7` / `#9AA3AD`, акцент `#4F8CFF` (только для
  режима перемещения), кольцо фокуса — белое. Градиентов нет, кроме функционального скрима под рядами и за
  часами для читаемости на светлых обоях.
- Типографика: системная Roboto (`sans-serif-light` 88sp часы, `sans-serif-medium` подписи 15sp, заголовки 17sp).
- Радиусы 10 dp, тень только у сфокусированной карточки (translationZ 6 dp), анимации 170/220 мс по
  кривой Material standard; режим «Меньше анимации» отключает их полностью (и включается автоматически в
  безопасном режиме).

## Сборка

Две равноправные цепочки компилируют одни и те же исходники и ресурсы:

| | `scripts/build.ps1` (Windows) | `scripts/build-nosdk.sh` (эта сессия) |
|---|---|---|
| Компилятор | Kotlin 2.0.21 через KGP | kotlinc 2.0.21 |
| Ресурсы | AGP 8.11 / aapt2 | aapt2 (Ubuntu) |
| Dex | D8 | dx + DxCompat |
| android.jar | SDK platforms;android-34 | robolectric android-all 14 + java.* заглушки API 23 |
| Подпись | apksig (AGP) | apksigner |

`version.properties` — единый источник версии для обеих.
