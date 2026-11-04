import com.cleartv.launcher.data.AdbClient
import java.io.File

/** JVM test: talks to tools/adbtest/fake_adbd.py. Exit code 0 only when every step matches. */
fun main(args: Array<String>) {
    val port = args[0].toInt()
    val dir = File(args[1]).apply { mkdirs() }
    // 1st connection: key unknown -> signature rejected -> public key offered -> accepted
    AdbClient.connect(dir, port = port, approvalMs = 5_000, onWaitingForApproval = { println("client: waiting for approval") }).use { adb ->
        val echo = adb.shell("echo hello")
        check(echo == "hello\n") { "echo returned '$echo'" }
        val home = adb.shell("cmd package set-home-activity com.cleartv.launcher/.ui.HomeActivity")
        check(home.contains("Success")) { "set-home returned '$home'" }
    }
    // 2nd connection: key now known -> signature path only (no prompt)
    var prompted = false
    AdbClient.connect(dir, port = port, approvalMs = 5_000, onWaitingForApproval = { prompted = true }).use { adb ->
        check(!prompted) { "second connection should not prompt" }
        check(adb.shell("echo again") == "again\n")
        val refused = try { adb.shell("fail"); false } catch (e: AdbClient.AdbException) { true }
        check(refused) { "refused stream must raise" }
    }
    check(File(dir, "adbkey").exists() && File(dir, "adbkey.pub").exists())
    println("ADB_CLIENT_TEST_OK")
}
