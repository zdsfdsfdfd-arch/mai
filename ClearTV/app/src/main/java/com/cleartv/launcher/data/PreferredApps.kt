package com.cleartv.launcher.data

import android.content.Context
import com.cleartv.launcher.R

/**
 * The owner's preferred apps (res/values/favorites.xml): they lead the home row in the given order whenever
 * they are installed, matched by package name first and by label keyword as a fallback (store builds and
 * sideloaded builds of the same service carry different package names).
 */
object PreferredApps {
    class Rule(val keywords: List<String>, val packages: List<String>)

    fun rules(context: Context): List<Rule> =
        context.resources.getStringArray(R.array.preferred_apps).mapNotNull { line ->
            val i = line.indexOf('=')
            if (i <= 0) return@mapNotNull null
            val keywords = line.substring(0, i).split('|').map { it.trim().lowercase() }.filter { it.isNotEmpty() }
            val packages = line.substring(i + 1).split(',').map { it.trim() }.filter { it.isNotEmpty() }
            Rule(keywords, packages)
        }

    /** Installed entries that match a rule, one per rule, in rule order. */
    fun pick(context: Context, entries: List<AppEntry>): List<AppEntry> {
        val byPkg = entries.associateBy { it.packageName }
        val result = ArrayList<AppEntry>()
        for (rule in rules(context)) {
            val match = rule.packages.firstNotNullOfOrNull { byPkg[it] }
                ?: entries.firstOrNull { e -> val l = e.label.lowercase(); rule.keywords.any { it in l } }
            if (match != null && result.none { it.packageName == match.packageName }) result += match
        }
        return result
    }
}
