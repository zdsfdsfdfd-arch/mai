# ClearTV — минималистичный домашний экран для СберТВ (Салют ТВ) и Android TV

ClearTV — альтернативное HOME-приложение (лаунчер) для телевизора: крупные часы и дата, один ряд ваших
приложений, при необходимости ряд HDMI-источников, тихие обои, панель настроек. Без рекламы,
рекомендаций и навязанного контента. Управление только пультом (D-pad), фокус виден с дивана.

> Честный статус проекта на момент публикации: **исходный код написан, APK собран и подписан, unit-тесты и
> тесты скриптов выполнены в облачной среде разработки. На реальном телевизоре приложение ещё не
> запускалось** — среда разработки не имеет доступа к вашему телевизору. Все проверки на устройстве
> (`scripts/verify.ps1`) и диагностика (`scripts/diagnose.ps1`) выполняются на вашем ПК с Windows 11.
> Подробно, что проверено и где: `docs/testing.md`.

## Что внутри

```
ClearTV/
├── app/                      Android-приложение (Kotlin, без AndroidX — только платформенные API)
│   ├── src/main/java/com/cleartv/launcher/
│   │   ├── ui/               HomeActivity, AppCardView, FocusRow, SettingsPanel, AllAppsView
│   │   ├── data/             Prefs, AppRepository, WallpaperRepository, TvInputsRepository, NetworkMonitor
│   │   └── util/             Async, Logs, CrashGuard
│   ├── src/main/res/         макеты, строки (ru/en), иконки, обои
│   ├── AndroidManifest.xml   HOME + LEANBACK_LAUNCHER + LAUNCHER
│   └── debug.keystore        отладочный ключ (стабильная подпись между сборками)
├── core/                     чистая Kotlin-логика (порядок плиток, кодеки настроек, детектор циклических падений) + JUnit
├── tools/
│   ├── dxcompat/             DxCompat — совместимость kotlin-stdlib с dx (сборка без SDK)
│   └── assets/               генератор иконок, баннера и обоев (Java2D) — бинарники воспроизводимы
├── scripts/
│   ├── diagnose.ps1          окружение ПК + отчёт о телевизоре + снимок состояния + инвентаризация пакетов
│   ├── build.ps1             сборка APK (Gradle/AGP) на Windows, при необходимости установка SDK
│   ├── install.ps1           установка APK, обои, запуск, назначение HOME (с журналом операций)
│   ├── verify.ps1            17 проверок на телевизоре с доказательствами (PASS/FAIL/SKIP)
│   ├── restore.ps1           откат только тех изменений, что записаны в журнале
│   ├── build-nosdk.sh        сборка без Android SDK (Linux/macOS; использована в облачной сессии)
│   └── tests/                тесты скриптов с подменным adb (PowerShell 7)
├── dist/                     собранный APK + SHA-256
├── reports/                  отчёты (сборка; после запуска скриптов — диагностика, инвентаризация, проверка)
└── docs/                     architecture, compatibility, recovery, testing, build-without-sdk, connect-tv
```

## Быстрый старт (Windows 11, PowerShell)

1. На телевизоре включите отладку по сети (ADB): `docs/connect-tv.md`.
2. Диагностика и снимок состояния **до любых изменений**:
   ```powershell
   .\scripts\diagnose.ps1 -Ip 192.168.1.50
   ```
   Результат: `reports\device-report.md`, `reports\inventory.md`, `reports\backup\<время>\`.
3. Сборка APK (нужна JDK 17+; SDK скачается с официального сайта по флагу `-InstallSdk`):
   ```powershell
   .\scripts\build.ps1 -InstallSdk
   ```
   Можно пропустить и использовать готовый `dist\ClearTV-0.1.0-debug.apk` (собран без SDK, см. `reports\build-report-nosdk.md`).
4. Установка и запуск вручную (ClearTV появится и в списке приложений штатного лаунчера):
   ```powershell
   .\scripts\install.ps1 -Ip 192.168.1.50
   ```
5. Проверка на телевизоре:
   ```powershell
   .\scripts\verify.ps1 -Ip 192.168.1.50
   ```
6. Только после успешной проверки — назначить главным экраном (через штатный механизм `cmd package set-home-activity`, с подтверждением и записью в журнал):
   ```powershell
   .\scripts\install.ps1 -Ip 192.168.1.50 -SetHome
   ```
7. Откат в любой момент:
   ```powershell
   .\scripts\restore.ps1 -Ip 192.168.1.50
   ```

Если на ПК действует политика выполнения скриптов: `powershell -ExecutionPolicy Bypass -File .\scripts\diagnose.ps1 -Ip ...`.

## Управление пультом

| Кнопка | Действие |
|---|---|
| ◀ ▶ ▲ ▼ | перемещение фокуса между плитками, рядами, шестерёнкой настроек |
| OK | открыть приложение / источник / пункт настроек |
| OK (долгое нажатие) | меню плитки: Открыть, Переместить, Убрать/Добавить на главный экран, Скрыть, О приложении, Удалить |
| MENU | панель настроек (также шестерёнка в правом верхнем углу) |
| Назад | закрыть панель/экран «Все приложения», отменить перемещение; на главном экране — ничего |
| HOME | если ClearTV назначен главным экраном — возврат к первой плитке |

Режим перемещения: ◀ ▶ двигают плитку, OK сохраняет, Назад отменяет.

## Принципы безопасности

- Ни root, ни разблокировки загрузчика, ни прошивки. Системные APK не удаляются.
- Замена главного экрана — только штатным механизмом HOME (`cmd package set-home-activity`); если прошивка его не
  поддерживает, ClearTV остаётся доступным из списка приложений, обходные пути не применяются.
- Любое изменение на телевизоре записывается в `reports/operations-journal.json` вместе с командой отката.
  `restore.ps1` возвращает только то, что реально менялось, и не обещает восстановить то, чего не сохранял.
- Инвентаризация пакетов классифицирует по структурным признакам, не по названиям. CRITICAL и UNKNOWN не трогаем.
  Рекламные компоненты фиксируются по факту показа на экране (`diagnose.ps1 -Capture`), а не по догадкам.

## Лицензия

Код проекта — MIT (см. ниже). Иконки нарисованы по общедоступным формам Material Icons (Apache 2.0).

MIT License — Copyright (c) 2026 ClearTV contributors. Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation files, to deal in the Software without restriction,
subject to the standard MIT conditions; THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
