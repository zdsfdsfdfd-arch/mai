package com.cleartv.core

/**
 * Decides whether the launcher is crash-looping. A HOME application that crashes repeatedly is restarted
 * by the system over and over; when [threshold] crashes land inside [windowMs] the launcher should fall
 * back to a safe configuration (default order, default wallpaper, no animations) instead of crashing again.
 */
class CrashLoopDetector(private val windowMs: Long = 120_000L, private val threshold: Int = 3) {

    data class Decision(val history: List<Long>, val loopDetected: Boolean)

    /** Records a crash at [now] and returns the trimmed history plus the verdict. */
    fun record(history: List<Long>, now: Long): Decision {
        val recent = (history + now).filter { it > now - windowMs && it <= now }.sorted()
        return Decision(recent, recent.size >= threshold)
    }
}
