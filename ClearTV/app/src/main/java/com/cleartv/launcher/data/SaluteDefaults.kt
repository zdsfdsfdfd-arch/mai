package com.cleartv.launcher.data

import android.content.Context
import com.cleartv.launcher.R
import com.cleartv.launcher.util.Logs

/**
 * First-run defaults for Salute TV (StarOS), from lists verified on real sets (docs/THIRD-PARTY.md): factory
 * menus and helper apps are hidden, and a few Sber packages get readable names. Nothing is disabled here.
 */
object SaluteDefaults {
    fun detected(context: Context, installed: Collection<String>): Boolean =
        context.resources.getStringArray(R.array.salute_detect_packages).any { it in installed }

    fun labels(context: Context): Map<String, String> =
        context.resources.getStringArray(R.array.salute_labels).mapNotNull { line ->
            val i = line.indexOf('=')
            if (i <= 0) null else line.substring(0, i) to line.substring(i + 1)
        }.toMap()

    /** Hides the default set once; afterwards the user's own choices in Settings → Hidden apps win. */
    fun applyFirstRun(context: Context, prefs: Prefs, installed: Collection<String>) {
        if (prefs.hiddenConfigured) return
        if (!detected(context, installed)) { prefs.hidden = emptySet(); return }
        val hide = context.resources.getStringArray(R.array.salute_hidden_default).filter { it in installed }.toSet()
        prefs.hidden = hide
        Logs.event("salute_defaults", "hidden" to hide.size)
    }
}
