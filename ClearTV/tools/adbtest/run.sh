#!/usr/bin/env bash
# Protocol test of the embedded ADB client against tools/adbtest/fake_adbd.py (no device needed).
#   KOTLINC_HOME=... ANDROID_JAR=... tools/adbtest/run.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
: "${KOTLINC_HOME:?}"; : "${ANDROID_JAR:?}"
T="${TMPDIR:-/tmp}/cleartv-adbtest-$$"; mkdir -p "$T/classes" "$T/keys"
"$KOTLINC_HOME/bin/kotlinc" -nowarn -jvm-target 1.8 -classpath "$ANDROID_JAR" \
  "$ROOT/app/src/main/java/com/cleartv/launcher/data/AdbClient.kt" "$ROOT/tools/adbtest/AdbClientTest.kt" -d "$T/classes"
PORT=${PORT:-15555}
python3 -I "$ROOT/tools/adbtest/fake_adbd.py" "$PORT" accept 2 > "$T/adbd.log" 2>&1 &
APID=$!; sleep 1
set +e
java -cp "$T/classes:$ANDROID_JAR:$KOTLINC_HOME/lib/kotlin-stdlib.jar" AdbClientTestKt "$PORT" "$T/keys"
RC=$?
set -e
wait "$APID" || true
echo "--- fake adbd log ---"; cat "$T/adbd.log"
rm -rf "$T"
exit $RC
