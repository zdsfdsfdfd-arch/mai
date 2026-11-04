# Восстановление

## Что меняет проект на телевизоре

Только то, что записано в `reports/operations-journal.json`. Возможные записи:

| Action | Что сделано | Команда отката |
|---|---|---|
| `install-apk` | установлен ClearTV | `pm uninstall com.cleartv.launcher` |
| `update-apk` | обновлена версия ClearTV | — (откат не требуется) |
| `push-wallpapers` | скопированы обои в папку приложения | `rm -rf /sdcard/Android/data/com.cleartv.launcher/files/wallpapers` |
| `set-home` | ClearTV назначен HOME вместо `<прежний компонент>`; включён хранитель HOME | сначала `am start … --ez cleartv.keep_home false` (выключает хранитель), затем `cmd package set-home-activity <прежний компонент>` |
| `disable-package` (`clean.ps1`) | `pm disable-user --user 0 <pkg>` | `pm enable <pkg>` |
| `appops-overlay` (`clean.ps1 -BlockOverlays`) | запрет `SYSTEM_ALERT_WINDOW` службе Сбера | `appops set … <прежний режим>` |
| `screensaver` (`clean.ps1 -Screensaver`) | заставка ClearTV | прежнее `screensaver_components` (или удаление ключа) |
| `home-guard` (`clean.ps1 -HomeGuard`) | служба спец. возможностей ClearTV | прежний `enabled_accessibility_services` |
| `auto-updates` (`clean.ps1 -DisableAutoUpdates`, по умолчанию не используется) | автообновления выкл. | прежние значения |

Ничего другого проект не трогает: системные APK не удаляются, настройки системы не меняются, root не нужен.

## Откат

```powershell
.\scripts\restore.ps1 -Ip 192.168.1.50            # вернуть HOME и прочие записанные изменения, ClearTV остаётся
.\scripts\restore.ps1 -Ip 192.168.1.50 -Uninstall # плюс удалить ClearTV
.\scripts\restore.ps1 -List                        # только показать журнал
```

Скрипт выполняет команды отката в обратном порядке, проверяет результат (например, что HOME снова равен
прежнему компоненту) и помечает запись как восстановленную. Если журнала нет — он сообщает, что
восстанавливать нечего, и не делает ничего.

## Вручную, без скриптов

```powershell
adb connect 192.168.1.50
adb shell cmd package set-home-activity <прежний компонент из reports\backup\<время>\home-activity.txt>
adb uninstall com.cleartv.launcher
```

Прежний компонент HOME также виден в `reports\device-report.md` (раздел «Главный экран»).

## Снимки состояния (`reports/backup/<время>/`)

Списки пакетов (все / пользовательские / отключённые), компонент HOME, кандидаты HOME, версия прошивки,
`settings list global|secure|system`. Это **справочные** данные для сравнения «до/после» — не резервная
копия приложений или их данных. `restore.ps1` на них не опирается и не заявляет восстановления данных,
которых не сохранял.

## Безопасный режим ClearTV

Если ClearTV падает 3 раза за 2 минуты (система перезапускает HOME автоматически), при следующем старте он
сбрасывает обои, порядок плиток и включает «Меньше анимации», показывает уведомление и пишет стек в
`/data/data/com.cleartv.launcher/files/crash/` (доступен через `adb shell run-as` только для debug-сборки;
содержимое также попадает в logcat под тегом `ClearTV`).

## Если телевизор не показывает главный экран

1. Нажмите HOME на пульте; подождите 10 с.
2. С ПК: `adb shell am start -n com.cleartv.launcher/.ui.HomeActivity` — если ClearTV поднимается, проблема в
   назначении HOME: выполните `restore.ps1`.
3. Если ADB недоступен, перезагрузите телевизор с пульта (долгое нажатие питания) или выключив из розетки.
4. Крайняя мера — сброс к заводским настройкам из системных настроек (удаляет все пользовательские данные);
   проект к такому состоянию не приводит, но этот путь всегда остаётся у прошивки.
