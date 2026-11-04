# Сторонний код и источники данных

## Код

- `app/src/main/java/com/cleartv/launcher/data/AdbClient.kt` — перевод на Kotlin файла `Adb.java` из проекта
  **Sber TV AT30A6 debloat project** (https://github.com/kryzhukov/sber-tv-at30a6-free-my-tv), лицензия MIT,
  © 2026 its contributors. Текст лицензии: https://github.com/kryzhukov/sber-tv-at30a6-free-my-tv/blob/main/LICENSE.
  Изменения: Kotlin, настраиваемые хост/порт (для тестов), типизированные ошибки, имя ключа `cleartv@tv`.
- Иконки в `app/src/main/res/drawable/` нарисованы по формам Material Icons (Apache 2.0).
- Шрифт **Outfit** (`app/src/main/assets/fonts/Outfit.ttf`, SIL Open Font License 1.1, © 2021 The Outfit Project
  Authors; текст лицензии рядом: `OFL-Outfit.txt`). Используется для часов и латинского текста; кириллица — системный
  шрифт (у Outfit её нет).
- Визуальная схема главного экрана (чёрный фон, приветствие, тонкие часы, «пилюли» справа, имя приложения над доком,
  док в скруглённой полосе, свечение в цвете приложения, сетка по кнопке ▼) повторяет лаунчер проекта
  **CleanYourTV** (https://github.com/Gathin23/cleanyourtv, MIT) — тот, что показан в ролике «Превращаю СберТВ в
  Apple TV». Код не заимствован (их лаунчер на AndroidX/RecyclerView), реализация своя.

## Данные (scripts/data/salute-packages.json)

Каждая запись подтверждена хотя бы одним списком пакетов с реального Салют ТВ из этих проектов:

- **CleanYourTV** (MIT) — https://github.com/Gathin23/cleanyourtv, `examples/sber-salute-tv-at30a6` (Android 13,
  Amlogic T962D4) и `examples/sber-salute-tv-pb766` (Android 11, MediaTek MT9256): списки с проверкой перезагрузками
  19–23.10.2026, заметки о платформенном сервисе Сбера, «ротации» приложений, заставке, включении ADB.
- **ЧистыйТВ** (MIT) — https://github.com/by-sonic/chistytv, `data/packages.json`; первоисточники: официальный
  список безопасных к отключению пакетов SberBox на 4PDA, тема Sber SBX на 4PDA, документация Сбера по ADB.
- **TV Cleaner for Salute** — https://github.com/Slim1694/TV-Cleaner-for-Salute, `packages.json` (модель
  SBER_55_CV9632-N55, Realtek), список защищённых пакетов (`Blocklist.cs`), проверка состояния (`HealthCheck.cs`).
- **Free My TV для SaluteTV AT30A6** (MIT) — https://github.com/kryzhukov/sber-tv-at30a6-free-my-tv,
  `docs/ИНСТРУКЦИЯ.md`, `backup/installed_packages.txt` (Amlogic T5W, Android 13 / StarkOS).

Приёмы, взятые из этих проектов и адаптированные:

| Приём | Откуда | Как применено в ClearTV |
|---|---|---|
| Возврат HOME через ADB на самом ТВ (127.0.0.1:5555) после загрузки | Free My TV / «Сбер-Стоп» | `HomeKeeper` + `BootReceiver`/`HomeKeeperJob`, только `cmd package set-home-activity` |
| Запрет промо-оверлея `ru.sberdevices.services` (appops) | Free My TV | `clean.ps1 -BlockOverlays`, с откатом |
| Своя заставка через `screensaver_components` | Free My TV | `ClearDream` + `clean.ps1 -Screensaver` |
| Проверка после каждого изменения: ответ ТВ, HOME на месте, сеть | TV Cleaner for Salute | `Test-DeviceHealth` в `clean.ps1` |
| Не отключать пакет, владеющий сохранённой сетью Wi‑Fi (`dumpsys wifi cname=`) | ЧистыйТВ | `clean.ps1` |
| Штатный лаунчер не отключать (recovery-петля на части прошивок) | ЧистыйТВ (4PDA) | база знаний: `keep` |
| Сначала выбрать свою заставку, потом отключать заставку Сбера (иначе StarOS включает её при загрузке) | CleanYourTV | порядок шагов в `clean.ps1` |
| Понизить порог нехватки места (`sys_storage_threshold_percentage`) против «ротации» приложений | CleanYourTV | `clean.ps1 -LowerStorageThreshold` |
| Пакеты, которые платформа включает при загрузке, скрывать, а не отключать в цикле | CleanYourTV | `SaluteDefaults` (скрытые по умолчанию) |
| Приложения Сбера только с категорией STAR_LAUNCHER | CleanYourTV | `AppRepository.queryVendorEntries` |

Отличия ClearTV от этих проектов: ничего не удаляется (`pm uninstall` не используется), автообновления
прошивки по умолчанию не отключаются, штатный лаунчер остаётся установленным, каждое действие записано в
журнал с командой отката.
