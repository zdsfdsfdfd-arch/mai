package com.cleartv.core

/** Geometry helpers for keeping the focused card in view in a horizontally scrolling row. */
object Scrolling {
    /**
     * Scroll offset that centres a child ([childLeft], [childWidth]) inside a viewport of [viewportWidth],
     * clamped to the scrollable range [0, maxScroll].
     */
    fun centeredScroll(childLeft: Int, childWidth: Int, viewportWidth: Int, maxScroll: Int): Int {
        val target = childLeft + childWidth / 2 - viewportWidth / 2
        return target.coerceIn(0, maxOf(0, maxScroll))
    }
}
