# Совместимость и ограничения

Этот документ разделяет то, что известно из кода и платформы Android, и то, что станет известно только после
`scripts/diagnose.ps1` и `scripts/verify.ps1` на вашем телевизоре. Пустые ячейки «На устройстве» заполняются
по результатам проверки — не раньше.

## Требования к устройству

| Параметр | Требование | Как проверяется |
|---|---|---|
| Android | 7.0 (API 24) и новее; собрано под API 34 | `device-report.md` → Android / API |
| Экран | любое разрешение; дизайн на канве 960×540 dp | `device-report.md` → Экран |
| RAM | от 1 ГБ; целевой PSS ClearTV ≤ 120 МБ | `verify.ps1` → ram_usage |
| Пульт | стандартные клавиши D-pad, OK, Назад, HOME; MENU — желательно | `verify.ps1` → dpad_navigation, settings_panel |
| Leanback | не обязателен (`required=false`), но определяет наличие TV-баннеров у приложений | `device-report.md` → Leanback |

## Механизмы замены главного экрана

| Механизм | Где работает | Что делает проект |
|---|---|---|
| Выбор HOME при нажатии кнопки (chooser) | Android TV без закреплённого лаунчера | ничего не нужно — система спросит |
| `Settings.ACTION_HOME_SETTINGS` / `MANAGE_DEFAULT_APPS_SETTINGS` | часть прошивок | ClearTV открывает экран из панели настроек, если он есть |
| `cmd package set-home-activity <component>` | Android 7+ через ADB shell, если прошивка не блокирует | `install.ps1 -SetHome` после подтверждения; откат — `restore.ps1` |
| Роль `android.app.role.HOME` (Android 10+) | управляется системой | только диагностика (`cmd role get-role-holders`) |
| Отключение штатного лаунчера (`pm disable-user`) | везде, где он не защищён | **не выполняется автоматически.** Возможный шаг только после подтверждённой работы ClearTV и отдельного согласия; записывается в журнал с командой `pm enable` |

## Что известно о Салют ТВ из отчётов с реальных устройств (источники: docs/THIRD-PARTY.md)

- Прошивка **возвращает `ru.sberdevices.starlauncher` при каждой загрузке и может сбросить выбор HOME**
  (SaluteTV AT30A6, Android 13 / StarkOS). Поэтому в ClearTV два независимых механизма: «хранитель» HOME
  (после загрузки через ~45 с повторяет `cmd package set-home-activity` через ADB на 127.0.0.1:5555, если
  отладка по сети включена и ключ ClearTV подтверждён) и служба спец. возможностей, которая открывает ClearTV,
  как только на экране появляется штатный лаунчер.
- **Отключать `ru.sberdevices.starlauncher` нельзя**: на части прошивок это даёт recovery-петлю даже со
  сторонним лаунчером (ЧистыйТВ, 4PDA). ClearTV его не трогает.
- `cmd package set-home-activity` на Салют ТВ (Android 13) работает; на Android 10+ дополнительно есть роль
  HOME (`cmd role get-role-holders android.app.role.HOME`), что видно в `device-report.md`.
- Полноэкранные промо поверх всего рисует `ru.sberdevices.services` (`SYSTEM_ALERT_WINDOW`); запрет через
  `appops` убирает их, но и визуальные карточки ассистента (голос работает). Это отдельный флаг `clean.ps1`.
- `ru.sberdevices.SberDevicesServiceSystem` — владелец устройства (device owner); `ru.sberdevices.assistant`,
  `services`, `services.core`, `settings`, `tvinputs`, `starlivetv`, `app.setup`, `app.starkeyboard`,
  `gamepad.service`, `rcfupdater`, `com.cvte.sber.onekey` и пакеты плат (`com.droidlogic.*`, `com.cvte.*`,
  `com.mediatek.*`, `com.realtek.*`) — не трогать: пульт, входы, настройки, ассистент.
- Выбор HOME и ADB **пережили перезагрузку** на обеих проверенных моделях (at30a6 и pb766, CleanYourTV) при
  включённом штатном лаунчере. Хранитель HOME и служба защиты в ClearTV — страховка на случай других прошивок.
- **Платформенный сервис** `ru.sberdevices.services` переустанавливает удалённые «обязательные» приложения и включает
  часть пакетов обратно при загрузке (`openbeta`, `starkidsroom`, `parentcontrol`, `startube`, `subscriptions`,
  `smarthome.promo`, `ru.sberdevices.tv`, `rcfupdater`, Okko). ClearTV скрывает их на главном экране (список
  `salute_hidden_default`), а не воюет с ними.
- **«Ротация»**: StarOS удаляет сторонние приложения при нехватке места на /data (порог ~355 МБ). `clean.ps1
  -LowerStorageThreshold` снижает порог Android до 1 %; при малом объёме свободного места скрипт предупреждает.
- **Приложения Сбера** объявляют только категорию `STAR_LAUNCHER`; ClearTV находит их отдельным запросом
  (MAIN без категории) и показывает с читаемыми именами (Салют ТВ, Каталог Сбера, Центр управления, СберTube).
- **Включение ADB.** На Android 11 (pb766) меню разработчика открывается как обычно (7 нажатий на номер сборки),
  запроса «Разрешить отладку» нет (`ro.adb.secure=0`), поэтому отладку надо выключать после работы. На Android 13
  (at30a6) меню разработчика заблокировано, переключатель в Sber Studio порт не открыл; сработал ярлык FactoryMenu
  с 4PDA (`com.stb.factorymenu` → Debug → ADB Enable; в заводском меню больше ничего не трогать). TV Cleaner for
  Salute предлагает `devmenu.apk`, открывающий экран разработчика. Порт 5555 не сохраняется между перезагрузками;
  `setprop persist.adb.tcp.port 5555` оставляет его (нужно для хранителя HOME).
- На Android 14 `adb install` может ждать подтверждения на экране ТВ.

## Функции, зависящие от прошивки

| Функция | ClearTV | Зависимость |
|---|---|---|
| Wi‑Fi, Bluetooth, звук, изображение, обновления, сон | не затрагиваются | системные настройки открываются из панели (`ACTION_SETTINGS`, затем `com.android.tv.settings`) |
| HDMI-входы на главном экране | через `TvInputManager` + `ACTION_VIEW` passthrough-URI | нужен обработчик (Live TV / приложение входов). Если его нет — ряд скрыт, в «О ClearTV» видна диагностика |
| HDMI-CEC | не затрагивается | работает на уровне системы |
| Голосовой помощник (кнопка «Салют») | не затрагивается | обрабатывается прошивкой независимо от лаунчера; если ассистент встроен в штатный лаунчер — после смены HOME может быть недоступен из главного экрана (фиксируется в verify-report) |
| Уведомления/системная панель | не затрагиваются | `com.android.systemui` |
| Установка/удаление приложений | штатные intent'ы (`ACTION_DELETE`, `APPLICATION_DETAILS_SETTINGS`) | требуют наличия системного установщика |
| Выбор файла обоев | `ACTION_OPEN_DOCUMENT` | только если в прошивке есть DocumentsUI; иначе `install.ps1 -Wallpapers` |

## Известные особенности Android, учтённые в коде

- Android 11+ (API 30) фильтрует видимость пакетов: манифест объявляет `<queries>` для LEANBACK_LAUNCHER,
  LAUNCHER, HOME, TV passthrough, настроек и выбора документов.
- Android 13+ (API 33): приёмник `PACKAGE_*` регистрируется с `RECEIVER_NOT_EXPORTED`.
- Android 8+ (API 26): `defaultFocusHighlightEnabled=false`, чтобы не дублировать системную подсветку фокуса.
- Android 14 (API 34): `targetSdk 34`, без сервисов переднего плана, без точных будильников.

## Что заполнить после проверки на телевизоре

| Пункт | Результат на устройстве |
|---|---|
| Модель / Android / API | |
| Текущий HOME и поддержка `set-home-activity` | |
| HDMI-входов в `TvInputManager` / обработчик найден | |
| Кнопка MENU на пульте есть | |
| PSS ClearTV, рывки кадров (%) | |
| Поведение после перезагрузки | |
| Голосовой помощник доступен при ClearTV как HOME | |
