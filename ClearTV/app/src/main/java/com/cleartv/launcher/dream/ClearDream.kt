package com.cleartv.launcher.dream

import android.graphics.Bitmap
import android.graphics.Point
import android.os.Handler
import android.os.Looper
import android.service.dreams.DreamService
import android.text.format.DateFormat
import android.widget.ImageView
import android.widget.TextClock
import android.widget.TextView
import com.cleartv.launcher.ClearTvApp
import com.cleartv.launcher.R
import com.cleartv.launcher.util.Async
import com.cleartv.launcher.util.Logs
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Screensaver (Android "dream"): the current wallpaper, dimmed, with a large clock that drifts slowly so static
 * pixels never burn in. No content, no promotions. Selected with
 * `settings put secure screensaver_components com.cleartv.launcher/.dream.ClearDream` (scripts/clean.ps1 -Screensaver)
 * or from the TV's screensaver settings where the firmware offers them.
 */
class ClearDream : DreamService() {
    private val handler = Handler(Looper.getMainLooper())
    private var clock: TextClock? = null
    private var date: TextView? = null
    private var step = 0
    private val drift = object : Runnable {
        override fun run() {
            val c = clock ?: return
            step = (step + 1) % 8
            val dx = (step % 4 - 1.5f) * 18f * resources.displayMetrics.density
            val dy = (step / 4 - 0.5f) * 14f * resources.displayMetrics.density
            c.animate().translationX(dx).translationY(dy).setDuration(4000).start()
            date?.animate()?.translationX(dx)?.translationY(dy)?.setDuration(4000)?.start()
            handler.postDelayed(this, 60_000L)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        isInteractive = false
        isFullscreen = true
        isScreenBright = false
        setContentView(R.layout.dream_clock)
        clock = findViewById(R.id.dream_clock)
        date = findViewById(R.id.dream_date)
        val app = ClearTvApp.get(this)
        val pattern = app.prefs.clockMode.timePattern(DateFormat.is24HourFormat(this))
        clock?.format12Hour = pattern
        clock?.format24Hour = pattern
        val locale = Locale.getDefault()
        val dateText = SimpleDateFormat(DateFormat.getBestDateTimePattern(locale, "EEEEdMMMM"), locale).format(Date())
        date?.text = if (dateText.isEmpty()) dateText else dateText.substring(0, 1).uppercase(locale) + dateText.substring(1)
        val size = Point().also { windowManager.defaultDisplay.getRealSize(it) }
        val wp = app.wallpapers.find(app.prefs.wallpaperId)
        val image = findViewById<ImageView>(R.id.dream_wallpaper)
        Async.run({ app.wallpapers.decode(wp, minOf(size.x, 1920).coerceAtLeast(1), minOf(size.y, 1080).coerceAtLeast(1)) }) { bmp: Bitmap?, _ ->
            if (bmp != null && clock != null) image.setImageBitmap(bmp)
        }
        Logs.event("dream", "started" to true)
    }

    override fun onDreamingStarted() {
        super.onDreamingStarted()
        handler.postDelayed(drift, 60_000L)
    }

    override fun onDetachedFromWindow() {
        handler.removeCallbacks(drift)
        clock = null
        date = null
        super.onDetachedFromWindow()
    }
}
