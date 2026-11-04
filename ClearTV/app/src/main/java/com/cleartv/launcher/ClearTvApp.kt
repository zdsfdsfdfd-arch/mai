package com.cleartv.launcher

import android.app.Application
import android.content.Context
import com.cleartv.launcher.data.AppRepository
import com.cleartv.launcher.data.Prefs
import com.cleartv.launcher.data.TvInputsRepository
import com.cleartv.launcher.data.WallpaperRepository
import com.cleartv.launcher.util.CrashGuard
import com.cleartv.launcher.util.Logs

class ClearTvApp : Application() {
    lateinit var prefs: Prefs
    lateinit var apps: AppRepository
    lateinit var wallpapers: WallpaperRepository
    lateinit var inputs: TvInputsRepository
    val startedAt: Long = System.currentTimeMillis()

    override fun onCreate() {
        super.onCreate()
        prefs = Prefs(this)
        CrashGuard(this, prefs).install()
        if (prefs.safeMode) {
            Logs.event("safe_mode", "applied" to true)
            prefs.applySafeModeDefaults()
            safeModeNotice = true
        }
        apps = AppRepository(this)
        wallpapers = WallpaperRepository(this)
        inputs = TvInputsRepository(this)
        Logs.i("ClearTV process started; prefs: " + prefs.summary())
    }

    /** True for the first home-screen start after a crash loop so the UI can tell the user what happened. */
    var safeModeNotice: Boolean = false

    companion object {
        fun get(context: Context): ClearTvApp = context.applicationContext as ClearTvApp
    }
}
