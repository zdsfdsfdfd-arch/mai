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

    /**
     * True once the user has edited the home row themselves (added, removed or moved an app). An empty row that was
     * never touched is treated as "not configured" so defaults can be re-applied — this also heals installs where an
     * earlier build persisted an empty list before the app list had loaded.
     */
    var favoritesTouched: Boolean
        get() = sp.getBoolean(K_FAV_TOUCHED, false)
        set(value) = sp.edit().putBoolean(K_FAV_TOUCHED, value).apply()

    /** Show only the owner's preferred apps (res/values/favorites.xml); everything else waits in Settings → Hidden apps. */
    var onlyPreferred: Boolean
        get() = sp.getBoolean(K_ONLY_PREFERRED, true)
        set(value) = sp.edit().putBoolean(K_ONLY_PREFERRED, value).apply()

    /** Apps the owner re-admitted while "only my apps" is on. */
    var allowed: Set<String>
        get() = StringSetCodec.decode(sp.getString(K_ALLOWED, null))
        set(value) = sp.edit().putString(K_ALLOWED, StringSetCodec.encode(value)).apply()

    var hidden: Set<String>
        get() = StringSetCodec.decode(sp.getString(K_HIDDEN, null))
        set(value) = sp.edit().putString(K_HIDDEN, StringSetCodec.encode(value)).apply()
    val hiddenConfigured: Boolean get() = sp.contains(K_HIDDEN)

    var wallpaperId: String
        get() = sp.getString(K_WALLPAPER, DEFAULT_WALLPAPER) ?: DEFAULT_WALLPAPER
        set(value) = sp.edit().putString(K_WALLPAPER, value).apply()

    var clockMode: ClockMode
        get() = ClockMode.fromStorage(sp.getString(K_CLOCK, null))
        set(value) = sp.edit().putString(K_CLOCK, value.storageKey).apply()

    var showLabels: Boolean
        get() = sp.getBoolean(K_LABELS, false)
        set(value) = sp.edit().putBoolean(K_LABELS, value).apply()

    var showInputs: Boolean
        get() = sp.getBoolean(K_INPUTS, true)
        set(value) = sp.edit().putBoolean(K_INPUTS, value).apply()

    var reducedMotion: Boolean
        get() = sp.getBoolean(K_REDUCED_MOTION, false)
        set(value) = sp.edit().putBoolean(K_REDUCED_MOTION, value).apply()

    /** True once the owner toggled "reduce motion" themselves (then an update must not undo it). */
    var reducedMotionUserSet: Boolean
        get() = sp.getBoolean(K_REDUCED_USER, false)
        set(value) = sp.edit().putBoolean(K_REDUCED_USER, value).apply()

    /** versionCode of the build that applied safe-mode defaults, 0 when none. */
    val safeModeAppliedVersion: Int get() = sp.getInt(K_SAFE_APPLIED_VERSION, 0)

    var safeMode: Boolean
        get() = sp.getBoolean(K_SAFE_MODE, false)
        set(value) = sp.edit().putBoolean(K_SAFE_MODE, value).apply()

    /** Re-apply the HOME choice after boot through the TV's own ADB (opt-in; needs network debugging on). */
    var keepHome: Boolean
        get() = sp.getBoolean(K_KEEP_HOME, false)
        set(value) = sp.edit().putBoolean(K_KEEP_HOME, value).apply()

    /** The accessibility guard may be enabled system-wide; this switch lets the user pause its effect. */
    var homeGuard: Boolean
        get() = sp.getBoolean(K_HOME_GUARD, true)
        set(value) = sp.edit().putBoolean(K_HOME_GUARD, value).apply()

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
    fun applySafeModeDefaults(versionCode: Int) {
        sp.edit()
            .remove(K_FAVORITES)
            .remove(K_FAV_TOUCHED)
            .putString(K_WALLPAPER, DEFAULT_WALLPAPER)
            .putBoolean(K_REDUCED_MOTION, true)
            .putInt(K_SAFE_APPLIED_VERSION, versionCode)
            .putBoolean(K_SAFE_MODE, false)
            .putString(K_CRASHES, "")
            .apply()
    }

    /**
     * Safe mode is a reaction to a broken build. Once a *different* build runs, its defaults are undone — unless the
     * owner changed the setting themselves meanwhile. Returns true when something was undone.
     */
    fun undoSafeModeAfterUpdate(versionCode: Int): Boolean {
        val applied = safeModeAppliedVersion
        // Builds before 0.1.5 did not record which version applied safe mode; "reduce motion" that the owner never
        // touched can only have come from it, so it is undone once (sets the marker so a real choice later stays).
        val leftover = applied == 0 && reducedMotion && !reducedMotionUserSet && !sp.getBoolean(K_MOTION_MIGRATED, false)
        if (!leftover && (applied == 0 || applied == versionCode)) return false
        val e = sp.edit().remove(K_SAFE_APPLIED_VERSION).putString(K_CRASHES, "").putBoolean(K_MOTION_MIGRATED, true)
        var undone = false
        if (!reducedMotionUserSet && reducedMotion) { e.putBoolean(K_REDUCED_MOTION, false); undone = true }
        e.apply()
        return undone
    }

    fun resetLayout() { sp.edit().remove(K_FAVORITES).remove(K_FAV_TOUCHED).remove(K_HIDDEN).remove(K_LAST_FOCUS).apply() }

    /** Back to the automatic row order (preferred apps first); hidden apps are kept. */
    fun autoLayout() { sp.edit().remove(K_FAVORITES).remove(K_FAV_TOUCHED).apply() }

    /**
     * True when the process crashed at least twice within [withinMs]: the guard and the keeper stand down so a broken
     * build cannot fight the TV. A single crash does not count — Android itself drops the HOME choice when a
     * third-party HOME process crashes, and the keeper must be free to put it back.
     */
    fun crashedRecently(withinMs: Long = 2 * 60 * 1000L): Boolean {
        val now = System.currentTimeMillis()
        return crashHistory.count { now - it < withinMs } >= 2
    }

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
        append(" favoritesTouched=").append(favoritesTouched)
        append(" hidden=").append(hidden.size)
        append(" onlyPreferred=").append(onlyPreferred).append(" allowed=").append(allowed.size)
        append(" wallpaper=").append(wallpaperId)
        append(" clock=").append(clockMode.storageKey)
        append(" labels=").append(showLabels)
        append(" inputs=").append(showInputs)
        append(" reducedMotion=").append(reducedMotion)
        append(" safeMode=").append(safeMode)
        append(" keepHome=").append(keepHome)
        append(" homeGuard=").append(homeGuard)
        append(" launches=").append(launchCount)
    }

    companion object {
        const val FILE = "cleartv"
        const val DEFAULT_WALLPAPER = "bundled:black"
        const val K_FAVORITES = "favorites"
        const val K_FAV_TOUCHED = "favorites_touched"
        const val K_HIDDEN = "hidden"
        const val K_ONLY_PREFERRED = "only_preferred"
        const val K_ALLOWED = "allowed"
        const val K_WALLPAPER = "wallpaper"
        const val K_CLOCK = "clock_mode"
        const val K_LABELS = "show_labels"
        const val K_INPUTS = "show_inputs"
        const val K_REDUCED_MOTION = "reduced_motion"
        const val K_REDUCED_USER = "reduced_motion_user"
        const val K_SAFE_APPLIED_VERSION = "safe_mode_applied_version"
        const val K_MOTION_MIGRATED = "motion_migrated"
        const val K_SAFE_MODE = "safe_mode"
        const val K_CRASHES = "crash_history"
        const val K_LAST_FOCUS = "last_focus"
        const val K_LAUNCHES = "launch_count"
        const val K_KEEP_HOME = "keep_home"
        const val K_HOME_GUARD = "home_guard"
    }
}
