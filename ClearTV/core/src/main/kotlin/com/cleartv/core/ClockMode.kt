package com.cleartv.core

/** How the home-screen clock should be displayed. */
enum class ClockMode(val storageKey: String) {
    SYSTEM("system"), H24("24h"), H12("12h");

    /** Returns the time pattern for this mode; [systemIs24h] resolves [SYSTEM]. */
    fun timePattern(systemIs24h: Boolean): String = when (this) {
        H24 -> PATTERN_24H
        H12 -> PATTERN_12H
        SYSTEM -> if (systemIs24h) PATTERN_24H else PATTERN_12H
    }

    fun next(): ClockMode = values()[(ordinal + 1) % values().size]

    companion object {
        const val PATTERN_24H = "HH:mm"
        const val PATTERN_12H = "h:mm"

        fun fromStorage(key: String?): ClockMode = values().firstOrNull { it.storageKey == key } ?: SYSTEM
    }
}
