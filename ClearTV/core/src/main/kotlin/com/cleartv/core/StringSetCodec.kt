package com.cleartv.core

/** Encodes a set of package names for SharedPreferences-style string storage. */
object StringSetCodec {
    private const val SEPARATOR = '\n'

    fun encode(set: Set<String>): String = set.filter { it.isNotBlank() }.sorted().joinToString(SEPARATOR.toString())

    fun decode(encoded: String?): Set<String> =
        encoded?.split(SEPARATOR)?.map { it.trim() }?.filter { it.isNotEmpty() }?.toSet() ?: emptySet()
}
