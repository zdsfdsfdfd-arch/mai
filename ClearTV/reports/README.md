# Отчёты

| Файл | Кем создаётся | Содержание |
|---|---|---|
| `build-report-nosdk.md` | облачная сессия (`scripts/build-nosdk.sh`) | инструменты, хэш APK, заглушки DxCompat |
| `build-report.md` | `scripts/build.ps1` на ПК | сборка через Gradle/AGP |
| `environment-report.json` | `scripts/diagnose.ps1` | adb, JDK, SDK, Gradle на ПК |
| `device-report.md` / `.json` | `scripts/diagnose.ps1` | модель, Android/API, прошивка, CPU, RAM, экран, пакеты, HOME, сервисы, CEC, входы, пульт |
| `inventory.md` / `.json` | `scripts/diagnose.ps1` | все пакеты с категорией, причинами, командами отключения/восстановления, риском |
| `focus-captures.json` | `scripts/diagnose.ps1 -Capture` | какой пакет был на экране, когда вы зафиксировали рекламный блок |
| `backup/<время>/` | `diagnose.ps1`, `install.ps1` | снимок состояния до изменений (справочный) |
| `operations-journal.json` | `install.ps1`, `restore.ps1` | журнал изменений с командами отката |
| `verify-report.md` / `.json` | `scripts/verify.ps1` | результаты проверок на телевизоре с доказательствами |
| `raw/<время>/` | `diagnose.ps1`, `verify.ps1` | сырые дампы adb (не коммитятся) |
| `adb-log.txt` | все скрипты | каждая команда adb с кодом выхода (не коммитится) |

Отчёты о реальном устройстве появятся только после запуска скриптов на ПК, подключённом к телевизору.
