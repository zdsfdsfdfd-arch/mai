package com.cleartv.launcher.data

import android.content.ComponentName

/** One launchable application as seen by the launcher. */
data class AppEntry(
    val packageName: String,
    val component: ComponentName,
    val label: String,
    /** Declared a LEANBACK_LAUNCHER activity, i.e. designed for TV. */
    val leanback: Boolean,
    /** Part of the system image (cannot be uninstalled, only disabled by the user/ADB). */
    val system: Boolean,
    /** Which launcher entry was found: "leanback", "launcher", the vendor category (e.g. Salute TV's STAR_LAUNCHER) or "web". */
    val entry: String = "leanback",
    /** For "web" entries: the address opened in the browser ([component] is the browser's activity, [packageName] is "web:<id>"). */
    val url: String? = null,
    /** For "web" entries: the brand colour of the card. */
    val color: Int? = null,
) {
    val isWeb: Boolean get() = entry == WEB

    companion object { const val WEB = "web" }
}
