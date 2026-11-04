package com.cleartv.launcher.util

import android.os.Handler
import android.os.Looper
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.ThreadFactory
import java.util.concurrent.atomic.AtomicInteger

/**
 * Minimal background/main-thread plumbing. The launcher's asynchronous needs are small (package queries,
 * bitmap decoding), so a two-thread executor plus the main-looper handler is enough and keeps the APK
 * free of extra libraries, which matters on 1 GB TV boxes.
 */
object Async {
    private val counter = AtomicInteger()
    private val factory = ThreadFactory { r ->
        Thread(r, "cleartv-io-" + counter.incrementAndGet()).apply { priority = Thread.NORM_PRIORITY - 1 }
    }
    private val io: ExecutorService = Executors.newFixedThreadPool(2, factory)
    val main: Handler = Handler(Looper.getMainLooper())

    fun io(block: () -> Unit) {
        io.execute {
            try { block() } catch (t: Throwable) { Logs.e("background task failed", t) }
        }
    }

    /** Runs [work] in the background and delivers its result (or failure) on the main thread. */
    fun <T> run(work: () -> T, then: (T?, Throwable?) -> Unit) {
        io.execute {
            var result: T? = null
            var error: Throwable? = null
            try { result = work() } catch (t: Throwable) { error = t }
            main.post { then(result, error) }
        }
    }

    fun ui(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) block() else main.post(block)
    }

    fun uiDelayed(delayMs: Long, block: () -> Unit) { main.postDelayed(block, delayMs) }
}
