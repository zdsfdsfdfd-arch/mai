package com.cleartv.core

/**
 * Pure, platform-independent ordering logic for the favourites row.
 *
 * The launcher persists the user's order as a list of package names. Whenever the set of installed
 * applications changes, [merge] reconciles the stored order with reality: items that are still
 * installed keep their position, newly installed applications are appended in the order supplied by the
 * platform (alphabetical in the launcher), uninstalled ones disappear.
 */
object AppOrder {
    private const val SEPARATOR = '\n'

    fun merge(saved: List<String>, installed: List<String>): List<String> {
        val installedSet = installed.toSet()
        val result = ArrayList<String>(installed.size)
        val seen = HashSet<String>()
        for (pkg in saved) {
            if (pkg in installedSet && seen.add(pkg)) result += pkg
        }
        for (pkg in installed) {
            if (seen.add(pkg)) result += pkg
        }
        return result
    }

    /** Moves the element at [from] to position [to]; indices outside the list leave it unchanged. */
    fun move(list: List<String>, from: Int, to: Int): List<String> {
        if (from == to || from !in list.indices || to !in list.indices) return list
        val mutable = ArrayList(list)
        val item = mutable.removeAt(from)
        mutable.add(to, item)
        return mutable
    }

    /** Package names never contain line breaks, so a newline-joined string is a safe, readable encoding. */
    fun encode(list: List<String>): String = list.joinToString(SEPARATOR.toString())

    fun decode(encoded: String?): List<String> =
        encoded?.split(SEPARATOR)?.map { it.trim() }?.filter { it.isNotEmpty() }?.distinct() ?: emptyList()
}

/** Favourites semantics: keep only what is still installed, never append. */
fun AppOrder.retain(saved: List<String>, installed: Collection<String>): List<String> {
    val installedSet = installed.toSet()
    return saved.filter { it in installedSet }.distinct()
}
