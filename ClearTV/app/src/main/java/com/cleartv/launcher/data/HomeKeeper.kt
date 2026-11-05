package com.cleartv.launcher.data

import android.content.Context
import com.cleartv.launcher.ClearTvApp
import com.cleartv.launcher.util.Async
import com.cleartv.launcher.util.Logs
import java.io.IOException

/**
 * Keeps ClearTV the HOME application on firmwares that put their own launcher back at boot (observed on
 * Salute TV / StarkOS, see docs/compatibility.md). Nothing here touches other packages: the only command ever
 * sent is `cmd package set-home-activity <ClearTV>`, and only when the user enabled the option.
 */
object HomeKeeper {
    const val HOME_COMPONENT = "com.cleartv.launcher/.ui.HomeActivity"
    const val EXTRA_KEEP_HOME = "cleartv.keep_home"
    private const val MIN_INTERVAL_MS = 10 * 60 * 1000L

    enum class Status { DISABLED, ALREADY_HOME, RESTORED, ADB_OFF, NOT_APPROVED, FAILED }
    data class Outcome(val status: Status, val detail: String = "")

    @Volatile private var lastRunAt = 0L
    @Volatile var lastOutcome: Outcome? = null
        private set

    /** Non-blocking; [onDone] is called on the main thread. */
    fun runAsync(context: Context, reason: String, interactive: Boolean, onDone: ((Outcome) -> Unit)? = null) {
        val app = context.applicationContext
        Async.run({ run(app, reason, interactive) }) { outcome, error ->
            val result = outcome ?: Outcome(Status.FAILED, error?.toString() ?: "")
            onDone?.invoke(result)
        }
    }

    /** Blocking; call from a background thread. [interactive] waits long enough for the on-screen approval. */
    fun run(context: Context, reason: String, interactive: Boolean): Outcome {
        val app = ClearTvApp.get(context)
        if (!app.prefs.keepHome) return remember(Outcome(Status.DISABLED), reason)
        if (!interactive && (app.prefs.safeMode || app.prefs.crashedRecently())) return remember(Outcome(Status.DISABLED, "recent_crash"), reason)
        if (app.apps.isDefaultHome()) return remember(Outcome(Status.ALREADY_HOME), reason)
        val now = System.currentTimeMillis()
        if (!interactive && now - lastRunAt < MIN_INTERVAL_MS) return remember(Outcome(Status.FAILED, "rate_limited"), reason)
        lastRunAt = now
        return try {
            AdbClient.connect(context.filesDir, approvalMs = if (interactive) 90_000 else 8_000,
                onWaitingForApproval = { Logs.event("home_keeper", "reason" to reason, "waiting_for_approval" to true) }).use { adb ->
                val out = adb.shell("cmd package set-home-activity $HOME_COMPONENT").trim()
                val ok = out.contains("Success") || app.apps.isDefaultHome()
                remember(if (ok) Outcome(Status.RESTORED, out) else Outcome(Status.FAILED, out), reason)
            }
        } catch (e: AdbClient.AdbException) {
            val status = when (e.kind) {
                AdbClient.AdbException.Kind.PORT_CLOSED -> Status.ADB_OFF
                AdbClient.AdbException.Kind.NOT_APPROVED -> Status.NOT_APPROVED
                else -> Status.FAILED
            }
            remember(Outcome(status, e.message ?: e.kind.name), reason)
        } catch (e: IOException) {
            remember(Outcome(Status.FAILED, e.toString()), reason)
        }
    }

    private fun remember(outcome: Outcome, reason: String): Outcome {
        lastOutcome = outcome
        Logs.event("home_keeper", "reason" to reason, "status" to outcome.status, "detail" to outcome.detail.take(80))
        return outcome
    }
}
