package com.cleartv.launcher.util

import android.content.Context
import android.os.Process
import com.cleartv.core.CrashLoopDetector
import com.cleartv.launcher.data.Prefs
import java.io.File
import java.io.PrintWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Launcher-grade crash safety net. A HOME application is restarted by the system after every crash; if
 * ClearTV crashes repeatedly we switch on safe mode (default wallpaper, default order, reduced motion) so
 * the TV never ends up in a crash loop, write the stack trace to `files/crash/` for later analysis, and
 * then let the platform handler finish the process as usual.
 */
class CrashGuard(private val context: Context, private val prefs: Prefs) : Thread.UncaughtExceptionHandler {
    private var previous: Thread.UncaughtExceptionHandler? = null
    private val detector = CrashLoopDetector()

    fun install(): CrashGuard {
        previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler(this)
        return this
    }

    override fun uncaughtException(thread: Thread, error: Throwable) {
        try {
            val now = System.currentTimeMillis()
            val decision = detector.record(prefs.crashHistory, now)
            prefs.crashHistorySync(decision.history)
            if (decision.loopDetected) {
                prefs.safeModeSync(true)
                Logs.event("safe_mode", "on" to true, "reason" to "crash_loop")
            }
            writeCrashFile(now, thread, error)
        } catch (_: Throwable) {
            // never let the guard itself fail
        }
        val handler = previous
        if (handler != null) handler.uncaughtException(thread, error) else {
            Process.killProcess(Process.myPid())
            System.exit(10)
        }
    }

    private fun writeCrashFile(now: Long, thread: Thread, error: Throwable) {
        val dir = File(context.filesDir, "crash").apply { mkdirs() }
        dir.listFiles()?.sortedBy { it.name }?.dropLast(MAX_FILES - 1)?.forEach { it.delete() }
        val name = "crash-" + SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date(now)) + ".txt"
        PrintWriter(File(dir, name)).use { w ->
            w.println("ClearTV crash at ${Date(now)} on thread ${thread.name}")
            error.printStackTrace(w)
            w.println()
            w.println("--- last log lines ---")
            Logs.snapshot().forEach { w.println(it) }
        }
    }

    companion object { private const val MAX_FILES = 5 }
}
