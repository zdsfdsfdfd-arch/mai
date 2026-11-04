# Отчёт о сборке ClearTV без Android SDK (облачная сессия, Linux)

Дата: 2026-11-04 18:12 UTC. Сборка выполнена скриптом `scripts/build-nosdk.sh` в контейнере без доступа к
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

- APK: `dist/ClearTV-0.1.0-debug.apk` — 1313906 байт
- SHA-256: `c4c4d8cbe0be24fcb60a3ed89ee75bd952692a0ff8999a9fae9950eed59deb68`
- Подпись: v2 + v3 (debug-ключ `app/debug.keystore`, пароль `android`), `apksigner verify` — Verifies
- minSdk 24, targetSdk 34, versionCode 1, versionName 0.1.0; dex версии 037 (без invokedynamic)
- Классов в dex: 1132, методов: 13146

## DxCompat: методы kotlin-stdlib, заменённые заглушками (invokedynamic не поддерживается dx)

    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.compareBy([Lkotlin/jvm/functions/Function1;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.then(Ljava/util/Comparator;Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.thenDescending(Ljava/util/Comparator;Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.nullsFirst(Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/comparisons/ComparisonsKt__ComparisonsKt.nullsLast(Ljava/util/Comparator;)Ljava/util/Comparator;
    - kotlin/uuid/Uuid.<clinit>()V
    - kotlin/streams/jdk8/StreamsKt.asStream(Lkotlin/sequences/Sequence;)Ljava/util/stream/Stream;

Проверка `DxCompat check`: классы приложения не ссылаются ни на один из этих методов и не содержат
invokedynamic. В сборке через Gradle/D8 (`scripts/build.ps1`) заглушки не нужны и не применяются.

## Что НЕ проверено этой сборкой

- Запуск на устройстве или эмуляторе (в контейнере нет ни телевизора, ни образов эмулятора).
- Поведение прошивки Салют ТВ при замене HOME.
Эти проверки выполняет `scripts/verify.ps1` на реальном телевизоре.
