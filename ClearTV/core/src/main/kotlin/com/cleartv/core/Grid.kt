package com.cleartv.core

/** Splits items into rows for a fixed-column grid; the last row may be shorter. */
object Grid {
    fun <T> rows(items: List<T>, columns: Int): List<List<T>> {
        require(columns > 0) { "columns must be positive" }
        return items.chunked(columns)
    }

    /** Index in the flat list of the item that sits directly above/below [index] when moving [deltaRows]. */
    fun neighbour(index: Int, columns: Int, deltaRows: Int, size: Int): Int? {
        if (index !in 0 until size) return null
        val target = index + deltaRows * columns
        if (target in 0 until size) return target
        if (deltaRows > 0) {
            val lastRowStart = ((size - 1) / columns) * columns
            if (index < lastRowStart) return size - 1
        }
        return null
    }
}
