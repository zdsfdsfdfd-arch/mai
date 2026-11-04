package com.cleartv.launcher.data

import android.content.Context
import android.content.SharedPreferences
import com.cleartv.core.AppOrder
import com.cleartv.core.ClockMode
import com.cleartv.core.StringSetCodec

/**
 * User settings. SharedPreferences is used deliberately: it is part of the platform, needs no library, is
 * synchronous to read on the critical start-up path and trivially inspectable with `adb shell`.
 */
class Prefs(context: Context) {
    private val sp: SharedPreferences = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
    private val listeners = ArrayList<SharedPreferences.OnSharedPreferenceChangeListener>()

    /** Ordered package names shown in the home row. `null` means "never configured" (defaults apply). */
    var favorites: List<String>?
        get() = if (sp.contains(K_FAVORITES)) AppOrder.decode(sp.getString(K_FAVORITES, "")) else null
        set(value) { if (value == null) sp.edit().remove(K_FAVORITES).apply() else sp.edit().putString(K_FAVORITES, AppOrder.encode(value)).apply() }

    var hidden: Set<String>
        get() = StringSetCodec.decode(sp.getString(K_HIDDEN, null))
        set(value) = sp.edit().putString(K_HIDDEN, StringSetCodec.encode(value)).apply()

    var wallpaperId: String
        get() = sp.getString(K_WALLPAPER, DEFAULT_WALLPAPER) ?: DEFAULT_WALLPAPER
        set(value) = sp.edit().putString(K_WALLPAPER, value).apply()

    var clockMode: ClockMode
        get() = ClockMode.fromStorage(sp.getString(K_CLOCK, null))
        set(value) = sp.edit().putString(K_CLOCK, value.storageKey).apply()

    var showLabels: Boolean
        get() = sp.getBoolean(K_LABELS, true)
        set(value) = sp.edit().putBoolean(K_LABELS, value).apply()

    var showInputs: Boolean
        get() = sp.getBoolean(K_INPUTS, true)
        set(value) = sp.edit().putBoolean(K_INPUTS, value).apply()

    var reducedMotion: Boolean
        get() = sp.getBoolean(K_REDUCED_MOTION, false)
        set(value) = sp.edit().putBoolean(K_REDUCED_MOTION, value).apply()

    var safeMode: Boolean
        get() = sp.getBoolean(K_SAFE_MODE, false)
        set(value) = sp.edit().putBoolean(K_SAFE_MODE, value).apply()

    val crashHistory: List<Long>
        get() = (sp.getString(K_CRASHES, "") ?: "").split(',').mapNotNull { it.trim().toLongOrNull() }

    var lastFocusedPackage: String?
        get() = sp.getString(K_LAST_FOCUS, null)
        set(value) = sp.edit().putString(K_LAST_FOCUS, value).apply()

    val launchCount: Int get() = sp.getInt(K_LAUNCHES, 0)
    fun countLaunch() = sp.edit().putInt(K_LAUNCHES, launchCount + 1).apply()

    /** Synchronous writers used from the crash handler, where the process is about to die. */
    fun crashHistorySync(history: List<Long>) { sp.edit().putString(K_CRASHES, history.joinToString(",")).commit() }
    fun safeModeSync(on: Boolean) { sp.edit().putBoolean(K_SAFE_MODE, on).commit() }

    /** Applies the safe-mode defaults and clears the flag so the next start is a normal one. */
    fun applySafeModeDefaults() {
        sp.edit()
            .remove(K_FAVORITES)
            .putString(K_WALLPAPER, DEFAULT_WALLPAPER)
            .putBoolean(K_REDUCED_MOTION, true)
            .putBoolean(K_SAFE_MODE, false)
            .putString(K_CRASHES, "")
            .apply()
    }

    fun resetLayout() { sp.edit().remove(K_FAVORITES).remove(K_HIDDEN).remove(K_LAST_FOCUS).apply() }

    fun addListener(onChange: (String) -> Unit): SharedPreferences.OnSharedPreferenceChangeListener {
        val l = SharedPreferences.OnSharedPreferenceChangeListener { _, key -> if (key != null) onChange(key) }
        listeners += l // keep a strong reference: SharedPreferences stores listeners weakly
        sp.registerOnSharedPreferenceChangeListener(l)
        return l
    }

    fun removeListener(l: SharedPreferences.OnSharedPreferenceChangeListener) {
        listeners -= l
        sp.unregisterOnSharedPreferenceChangeListener(l)
    }

    fun summary(): String = buildString {
        append("favorites=").append(favorites?.size ?: -1)
        append(" hidden=").append(hidden.size)
        append(" wallpaper=").append(wallpaperId)
        append(" clock=").append(clockMode.storageKey)
        append(" labels=").append(showLabels)
        append(" inputs=").append(showInputs)
        append(" reducedMotion=").append(reducedMotion)
        append(" safeMode=").append(safeMode)
        append(" launches=").append(launchCount)
    }

    companion object {
        const val FILE = "cleartv"
        const val DEFAULT_WALLPAPER = "bundled:graphite"
        const val K_FAVORITES = "favorites"
        const val K_HIDDEN = "hidden"
        const val K_WALLPAPER = "wallpaper"
        const val K_CLOCK = "clock_mode"
        const val K_LABELS = "show_labels"
        const val K_INPUTS = "show_inputs"
        const val K_REDUCED_MOTION = "reduced_motion"
        const val K_SAFE_MODE = "safe_mode"
        const val K_CRASHES = "crash_history"
        const val K_LAST_FOCUS = "last_focus"
        const val K_LAUNCHES = "launch_count"
    }
}
