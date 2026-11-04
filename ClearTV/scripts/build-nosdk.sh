#!/usr/bin/env bash
# ClearTV — build the debug APK WITHOUT the Android SDK / Gradle / AGP.
#
# Used when Google's servers (dl.google.com) are unreachable, e.g. in a locked-down CI container. The
# normal path is scripts/build.ps1 (Gradle + Android Gradle Plugin + D8). Both paths compile the same
# sources and resources; this one swaps D8 for the legacy `dx` dexer with the DxCompat shim.
#
# Requirements (all obtainable from Maven Central, GitHub releases and Ubuntu packages):
#   KOTLINC_HOME   kotlinc distribution (kotlin-compiler-2.0.21.zip from github.com/JetBrains/kotlin/releases)
#   ANDROID_JAR    an API-34 android.jar; org.robolectric:android-all:14-robolectric-10818077 works
#   JAVA_STUBS_JAR (optional) a jar with Android's java.* stubs, e.g. Ubuntu's android-sdk-platform-23
#                  (/usr/lib/android-sdk/platforms/android-23/android.jar). When set, Kotlin is compiled
#                  with -no-jdk so only APIs that exist on Android can be referenced; otherwise the host JDK
#                  provides java.* and the author must keep to Android-available APIs by hand.
#   aapt2, dalvik-exchange (dx), zipalign, apksigner on PATH (Ubuntu: apt install aapt dalvik-exchange zipalign apksigner)
#   JDK 17+ on PATH
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${KOTLINC_HOME:?set KOTLINC_HOME to a kotlinc distribution directory}"
: "${ANDROID_JAR:?set ANDROID_JAR to an API-34 android.jar}"
AAPT2=${AAPT2:-aapt2}; DX=${DX:-dalvik-exchange}; ZIPALIGN=${ZIPALIGN:-zipalign}; APKSIGNER=${APKSIGNER:-apksigner}
MIN_SDK=24; TARGET_SDK=34
APP_ID="com.cleartv.launcher"
VERSION_CODE=$(sed -n 's/^versionCode=//p' "$ROOT/version.properties")
VERSION_NAME=$(sed -n 's/^versionName=//p' "$ROOT/version.properties")
KEYSTORE=${KEYSTORE:-$ROOT/app/debug.keystore}
KS_PASS=${KS_PASS:-android}; KEY_ALIAS=${KEY_ALIAS:-androiddebugkey}

APP="$ROOT/app/src/main"
BUILD="$ROOT/app/build/nosdk"
DIST="$ROOT/dist"
rm -rf "$BUILD"; mkdir -p "$BUILD/gen" "$BUILD/classes" "$BUILD/apk" "$DIST"
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Dfile.encoding=UTF-8"
log() { printf '\n== %s\n' "$*"; }
t0=$(date +%s)

log "aapt2 compile"
"$AAPT2" compile --dir "$APP/res" -o "$BUILD/res.zip"

log "aapt2 link (minSdk $MIN_SDK, targetSdk $TARGET_SDK, version $VERSION_NAME ($VERSION_CODE))"
# AGP sets the namespace from build.gradle.kts; aapt2 needs it in the manifest, so inject it into a copy
sed "s#<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\">#<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" package=\"$APP_ID\">#" "$APP/AndroidManifest.xml" > "$BUILD/AndroidManifest.xml"
grep -q "package=\"$APP_ID\"" "$BUILD/AndroidManifest.xml" || { echo "manifest package injection failed"; exit 1; }
"$AAPT2" link -o "$BUILD/apk/unsigned.apk" -I "$ANDROID_JAR" --manifest "$BUILD/AndroidManifest.xml" \
  --min-sdk-version "$MIN_SDK" --target-sdk-version "$TARGET_SDK" \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" \
  --java "$BUILD/gen" -R "$BUILD/res.zip" --auto-add-overlay --no-version-vectors

log "javac R.java"
javac --release 8 -nowarn -cp "$ANDROID_JAR" -d "$BUILD/classes" $(find "$BUILD/gen" -name '*.java')

log "kotlinc (core + app)"
KT_JDK_FLAGS=""; KT_CP="$ANDROID_JAR"
if [ -n "${JAVA_STUBS_JAR:-}" ]; then KT_JDK_FLAGS="-no-jdk"; KT_CP="$ANDROID_JAR:$JAVA_STUBS_JAR"; echo "   using Android java.* stubs: $JAVA_STUBS_JAR"; fi
# shellcheck disable=SC2086
"$KOTLINC_HOME/bin/kotlinc" -jvm-target 1.8 $KT_JDK_FLAGS -no-reflect -nowarn \
  -Xlambdas=class -Xsam-conversions=class \
  -classpath "$KT_CP:$BUILD/classes:$KOTLINC_HOME/lib/kotlin-stdlib.jar" \
  "$ROOT/core/src/main/kotlin" "$APP/java" -d "$BUILD/classes"

log "DxCompat: make kotlin-stdlib dx-compatible"
DXCOMPAT="$BUILD/dxcompat.jar"
"$KOTLINC_HOME/bin/kotlinc" -nowarn -cp "$KOTLINC_HOME/lib/kotlin-compiler.jar" "$ROOT/tools/dxcompat/DxCompat.kt" -d "$DXCOMPAT"
DXCP="$DXCOMPAT:$KOTLINC_HOME/lib/kotlin-compiler.jar:$KOTLINC_HOME/lib/kotlin-stdlib.jar"
rm -f "$BUILD/stubs.txt"
java -cp "$DXCP" DxCompatKt stub "$KOTLINC_HOME/lib/kotlin-stdlib.jar" "$BUILD/kotlin-stdlib-dxcompat.jar" "$BUILD/stubs.txt"
java -cp "$DXCP" DxCompatKt check "$BUILD/classes" "$BUILD/stubs.txt"

log "dx"
"$DX" --dex --min-sdk-version="$MIN_SDK" --output="$BUILD/classes.dex" "$BUILD/classes" "$BUILD/kotlin-stdlib-dxcompat.jar"

log "package + zipalign"
(cd "$BUILD" && zip -q -j apk/unsigned.apk classes.dex)
"$ZIPALIGN" -p -f 4 "$BUILD/apk/unsigned.apk" "$BUILD/apk/aligned.apk"
"$ZIPALIGN" -c -p 4 "$BUILD/apk/aligned.apk"

log "sign"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storepass "$KS_PASS" -keypass "$KS_PASS" -alias "$KEY_ALIAS" \
    -dname "CN=ClearTV Debug,O=ClearTV,C=RU" -keyalg RSA -keysize 2048 -validity 10000
fi
OUT="$DIST/ClearTV-$VERSION_NAME-debug.apk"
"$APKSIGNER" sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" --ks-key-alias "$KEY_ALIAS" --out "$OUT" "$BUILD/apk/aligned.apk"
"$APKSIGNER" verify --verbose "$OUT" | head -4
(cd "$DIST" && sha256sum "$(basename "$OUT")" > "$(basename "$OUT").sha256")

log "done in $(( $(date +%s) - t0 ))s"
"$AAPT2" dump badging "$OUT" | grep -E "^package|sdkVersion|launchable|leanback" || true
ls -la "$OUT"
