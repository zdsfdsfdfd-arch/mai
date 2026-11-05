# Сборка без Android SDK

Используется, когда недоступны `dl.google.com` и `maven.google.com` (Android SDK, AGP, AndroidX). Так был
собран `dist/ClearTV-0.1.6-debug.apk` в облачной сессии (отчёт: `reports/build-report-nosdk.md`).

## Источники инструментов (все официальные или дистрибутивные)

| Что | Откуда |
|---|---|
| kotlinc 2.0.21 | https://github.com/JetBrains/kotlin/releases (kotlin-compiler-2.0.21.zip) |
| android.jar API 34 | Maven Central, `org.robolectric:android-all:14-robolectric-10818077` (полный framework + resources.arsc) |
| java.* заглушки Android | Ubuntu `android-sdk-platform-23` → `/usr/lib/android-sdk/platforms/android-23/android.jar` |
| aapt2, dx, zipalign, apksigner | Ubuntu: `apt install aapt dalvik-exchange zipalign apksigner` |
| JDK 17+ | дистрибутив |

## Команда

```bash
export KOTLINC_HOME=/path/kotlinc
export ANDROID_JAR=/path/android-all-14-robolectric-10818077.jar
export JAVA_STUBS_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar   # необязательно, но рекомендуется
./scripts/build-nosdk.sh
```

Шаги скрипта: `aapt2 compile` → `aapt2 link` (в копию манифеста подставляется `package=`) → `javac R.java` →
`kotlinc` (core + app, `-jvm-target 1.8 -no-jdk -Xlambdas=class -Xsam-conversions=class`) → `DxCompat stub`
(kotlin-stdlib) → `DxCompat check` (классы приложения) → `dx --min-sdk-version=24` → `zipalign` → `apksigner`.

## DxCompat

`dx` не поддерживает `invokedynamic`, а kotlin-stdlib 2.0.21 содержит его в 7 методах (vararg `compareBy`,
`then`, `thenDescending`, `nullsFirst`, `nullsLast`, `Uuid.<clinit>`, `asStream`). `tools/dxcompat/DxCompat.kt`
(ASM из kotlin-compiler.jar) заменяет тела этих методов на `throw UnsupportedOperationException`, удаляет
`META-INF/versions/` и затем проверяет, что ни один класс приложения эти методы не вызывает и сам не содержит
`invokedynamic`. Сборка падает, если проверка не проходит.

Почему `-no-jdk` с заглушками API 23: `android-all` не содержит `java.*`, а компиляция против JDK хоста
позволила бы случайно использовать API, которых нет на телевизоре. Заглушки API 23 — подмножество API 24,
поэтому всё, что скомпилировалось, существует на целевых устройствах.

## Ограничения

- Нет R8: dex содержит весь kotlin-stdlib (2,6 МБ). Для релиза используйте `build.ps1 -Release`.
- Ресурсы без `--no-version-vectors`-ограничений AGP; lint не выполняется.
- Эта сборка проверена структурно (`apksigner verify`, `aapt2 dump badging`), но не запускалась на устройстве.
