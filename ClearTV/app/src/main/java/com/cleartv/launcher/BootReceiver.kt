package com.cleartv.launcher

import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.cleartv.launcher.data.HomeKeeper
import com.cleartv.launcher.util.Async
import com.cleartv.launcher.util.Logs

/**
 * After boot (and after ClearTV itself is updated) schedule one [HomeKeeperJob] run ~45 s later: the Salute TV
 * firmware re-installs its launcher early in the boot and may reset the HOME choice, so the check must come after
 * that. Nothing happens unless the user enabled "keep home screen" in settings.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) return
        Logs.event("boot", "action" to action.substringAfterLast('.'))
        if (!ClearTvApp.get(context).prefs.keepHome) return
        HomeKeeperJob.schedule(context, delayMs = if (action == Intent.ACTION_BOOT_COMPLETED) 45_000L else 5_000L)
    }
}

class HomeKeeperJob : JobService() {
    override fun onStartJob(params: JobParameters): Boolean {
        Async.io {
            try { HomeKeeper.run(this, "job", interactive = false) } finally { jobFinished(params, false) }
        }
        return true
    }

    override fun onStopJob(params: JobParameters): Boolean = false

    companion object {
        private const val JOB_ID = 7101

        fun schedule(context: Context, delayMs: Long) {
            val scheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as? JobScheduler ?: return
            val job = JobInfo.Builder(JOB_ID, ComponentName(context, HomeKeeperJob::class.java))
                .setMinimumLatency(delayMs)
                .setOverrideDeadline(delayMs + 60_000L)
                .build()
            scheduler.schedule(job)
        }
    }
}
