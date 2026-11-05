# Отчёт о сборке ClearTV без Android SDK (облачная сессия, Linux)

Дата: 2026-11-05 18:20 UTC (сборка 0.2.2; предыдущие: 0.2.1 `8d75656b…7638a`, 0.2.0 `9c646a13…1cb96`, 0.1.9 `24bb4975…35e19`, 0.1.8 `aa1aa5b2…bd084`, 0.1.7 `75a92c41…50acf`, 0.1.6 `911a53f4…240bd`, 0.1.5 `6de71cc8…ee202`, 0.1.4 `dcf093ab…9a0c0`, 0.1.3 `3159ad15…beef9`, 0.1.2 `ede459cd…c15d9c`, 0.1.1 `363ce3ad…958d8`, 0.1.0 `5085922f…3255d6`).
`dl.google.com` (Android SDK, Google Maven), поэтому вместо Gradle + AGP + D8 использована цепочка
kotlinc → aapt2 → DxCompat → dx → zipalign → apksigner. Подробности: `docs/build-without-sdk.md`.

## Инструменты

| Инструмент | Версия / источник |
|---|---|
| Kotlin | kotlinc-jvm 2.0.21 (JRE 21.0.12.1+1-1-24.04.4-Ubuntu) (GitHub releases JetBrains/kotlin) |
| android.jar (compileSdk 34) | org.robolectric:android-all:14-robolectric-10818077 (Maven Central) |
| java.* заглушки Android | Ubuntu android-sdk-platform-23 (6.0.1+r72) — компиляция с `-no-jdk`, чтобы не использовать API, отсутствующие на Android |
| aapt2 | Android Asset Packaging Tool (aapt) 2.19-debian (Ubuntu aapt 1:14~beta1) |
| dx | dx version 1.16 (Ubuntu dalvik-exchange 10.0.0+r36) |
| apksigner / zipalign | Ubuntu apksigner 31.0.2, zipalign 10.0.0+r36 |
| JDK | openjdk version "21.0.12.1" 2026-08-18 |

## Результат

- APK: `dist/ClearTV-0.2.2-debug.apk` — 1375694 байт
- SHA-256: `9468bd2b59f8cb6ad8460daca5f408dc74a4597c1aa9636a2d95e858ff60fe30`
- Подпись: v2 + v3 (debug-ключ `app/debug.keystore`, пароль `android`), `apksigner verify` — Verifies
- minSdk 24, targetSdk 34, versionCode 13, versionName 0.2.2; dex версии 037 (без invokedynamic)
- Классов в dex: 1182, методов: 13578

## DxCompat: методы kotlin-stdlib, заменённые заглушками (invokedynamic не поддерживается dx)

    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.compareBy([Lkotlin/jvm/functions/Function1;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.then(Ljava/util/Comparator;Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.thenDescending(Ljava/util/Comparator;Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.nullsFirst(Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.nullsLast(Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/uuid/Uuid.<clinit>()V
    - kotlin/streams/jdk8/StreamsKt.asStream(Lkotlin/sequences/Sequence;)Ljava/util/stream/Stream;

Проверка `DxCompat check`: классы приложения не ссылаются ни на один из этих методов и не содержат
invokedynamic. С 0.1.4 к списку добавляются 17 псевдонимов: те же методы на фасадах stdlib, которые *наследуют*
части (`ComparisonsKt` → `ComparisonsKt___ComparisonsKt` → `ComparisonsKt__ComparisonsKt`), и методы, делегирующие
заглушкам. Именно через фасад `ComparisonsKt.compareBy` сборки 0.1.2–0.1.3 доходили до заглушки и падали на
телевизоре при каждом запуске, пока проверка оставалась зелёной. Контрольный класс с `compareBy({…}, {…})`
теперь отклоняется проверкой (exit 2). В сборке через Gradle/D8 (`scripts/build.ps1`) заглушки не нужны и не применяются.

## Что НЕ проверено этой сборкой

- Запуск на устройстве или эмуляторе (в контейнере нет ни телевизора, ни образов эмулятора).
- Поведение прошивки Салют ТВ при замене HOME.
Эти проверки выполняет `scripts/verify.ps1` на реальном телевизоре.
