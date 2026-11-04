package com.cleartv.launcher.util

import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Thin logging facade. Everything goes to logcat under one tag so `verify.ps1` can follow the launcher
 * with `adb logcat -s ClearTV`, and the last lines are kept in memory for the on-screen diagnostics page.
 *
 * Lines starting with `EVT ` are machine-readable events used by the verification scripts.
 */
object Logs {
    const val TAG = "ClearTV"
    private const val CAPACITY = 400
    private val buffer = ArrayDeque<String>(CAPACITY)
    private val stamp = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)

    fun d(msg: String) { Log.d(TAG, msg); keep('D', msg) }
    fun i(msg: String) { Log.i(TAG, msg); keep('I', msg) }
    fun w(msg: String, t: Throwable? = null) { Log.w(TAG, msg, t); keep('W', if (t == null) msg else "$msg: $t") }
    fun e(msg: String, t: Throwable? = null) { Log.e(TAG, msg, t); keep('E', if (t == null) msg else "$msg: $t") }

    /** Structured event, e.g. `event("launch", "pkg" to "com.x", "ok" to true)` → `EVT launch pkg=com.x ok=true`. */
    fun event(name: String, vararg fields: Pair<String, Any?>) {
        val sb = StringBuilder("EVT ").append(name)
        for ((k, v) in fields) sb.append(' ').append(k).append('=').append(v?.toString()?.replace(' ', '_') ?: "null")
        i(sb.toString())
    }

    @Synchronized
    private fun keep(level: Char, msg: String) {
        if (buffer.size >= CAPACITY) buffer.removeFirst()
        buffer.addLast("${stamp.format(Date())} $level $msg")
    }

    @Synchronized
    fun snapshot(): List<String> = buffer.toList()
}
