package com.cleartv.launcher.guard

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.Point
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.Toast
import com.cleartv.launcher.R
import com.cleartv.launcher.util.Logs

/**
 * A pointer for phone apps on a TV, driven by the remote through the accessibility service:
 * holding OK (Android's own long-press, ~0.5 s) in any app other than ClearTV shows the cursor; the arrows move
 * it (faster the longer they are held), OK taps where it points, pressing an arrow twice quickly flicks the
 * content that way (scroll), holding OK again hides it. BACK, HOME, volume and everything else pass through
 * untouched. Taps are injected with [AccessibilityService.dispatchGesture]; the cursor is a small overlay window
 * of the accessibility type, so no "draw over other apps" permission is involved. Nothing on screen is read.
 */
class VirtualMouse(private val service: AccessibilityService) {
    var active = false
        private set
    private val wm = service.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private val density = service.resources.displayMetrics.density
    private var cursor: CursorView? = null
    private var lp: WindowManager.LayoutParams? = null
    private var x = 0f
    private var y = 0f
    private var screenW = 1920
    private var screenH = 1080
    private var swallowKey = -1          // after a toggle: eat the rest of that key press (repeats and UP)
    private var lastDirKey = -1
    private var lastDirUpAt = 0L
    private var okDownAt = 0L
    private var heldDir = -1
    private var heldSince = 0L
    private val handler = Handler(Looper.getMainLooper())
    private val mover = object : Runnable {
        override fun run() {
            if (!active || heldDir == -1) return
            step(heldDir, SystemClock.uptimeMillis() - heldSince)
            handler.postDelayed(this, TICK_MS)
        }
    }

    /**
     * Returns true when the event was consumed. [foregroundIsOwn]: ClearTV itself is in front (never intercept there).
     *
     * The accessibility key filter sees only the physical DOWN and UP of a key: auto-repeats are synthesised by the
     * input dispatcher after the filter, so "held" is measured here by the clock (an injected `input keyevent
     * --longpress` does carry FLAG_LONG_PRESS and is honoured too). Movement while an arrow is held is driven by
     * [mover], not by repeats.
     */
    fun onKey(event: KeyEvent, foregroundIsOwn: Boolean, enabled: Boolean): Boolean {
        val code = event.keyCode
        val now = SystemClock.uptimeMillis()
        if (swallowKey == code) { if (event.action == KeyEvent.ACTION_UP) swallowKey = -1; return true }
        val isOk = code == KeyEvent.KEYCODE_DPAD_CENTER || code == KeyEvent.KEYCODE_ENTER || code == KeyEvent.KEYCODE_NUMPAD_ENTER || code == KeyEvent.KEYCODE_BUTTON_A
        val longFlag = event.action == KeyEvent.ACTION_DOWN && (event.flags and KeyEvent.FLAG_LONG_PRESS) != 0
        if (!active) {
            if (!enabled || foregroundIsOwn || !isOk) return false
            if (longFlag) { activate(); swallowKey = code; return true }
            if (event.action == KeyEvent.ACTION_DOWN) { if (event.repeatCount == 0) okDownAt = now; return false }   // the app gets the press as usual
            if (event.action == KeyEvent.ACTION_UP) {
                val held = if (okDownAt > 0) now - okDownAt else 0L
                okDownAt = 0
                if (held >= HOLD_MS) { activate(); return true }   // the app never sees this UP, so the held press is not a click
            }
            return false
        }
        when (code) {
            KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT -> {
                if (event.action == KeyEvent.ACTION_DOWN) {
                    if (event.repeatCount > 0) return true
                    if (code == lastDirKey && now - lastDirUpAt < DOUBLE_PRESS_MS) { lastDirKey = -1; flick(code); return true }
                    heldDir = code; heldSince = now
                    step(code, 0)
                    handler.removeCallbacks(mover); handler.postDelayed(mover, FIRST_TICK_MS)
                } else if (event.action == KeyEvent.ACTION_UP) {
                    if (heldDir == code) { heldDir = -1; handler.removeCallbacks(mover) }
                    lastDirKey = code; lastDirUpAt = now
                }
                return true
            }
        }
        if (isOk) {
            if (longFlag) { deactivate(); swallowKey = code; return true }
            if (event.action == KeyEvent.ACTION_DOWN) { if (event.repeatCount == 0) okDownAt = now; return true }
            if (event.action == KeyEvent.ACTION_UP) {
                val held = if (okDownAt > 0) now - okDownAt else 0L
                okDownAt = 0
                if (held >= HOLD_MS) deactivate() else tap()
            }
            return true
        }
        return false
    }

    fun activate() {
        if (active) return
        try {
            val size = Point()
            @Suppress("DEPRECATION") wm.defaultDisplay.getRealSize(size)
            if (size.x > 0 && size.y > 0) { screenW = size.x; screenH = size.y }
            if (x <= 0f || y <= 0f || x > screenW || y > screenH) { x = screenW / 2f; y = screenH / 2f }
            val view = CursorView(service, density)
            val type = if (Build.VERSION.SDK_INT >= 22) WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY
            val params = WindowManager.LayoutParams(view.sizePx, view.sizePx, type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT)
            params.gravity = Gravity.TOP or Gravity.START
            params.x = x.toInt(); params.y = y.toInt()
            wm.addView(view, params)
            cursor = view; lp = params
            active = true
            Logs.event("mouse", "on" to true)
            toast(service.getString(R.string.mouse_on))
        } catch (t: Throwable) {
            Logs.w("virtual mouse could not show the cursor", t)
            active = false; cursor = null; lp = null
        }
    }

    fun deactivate() {
        if (!active) return
        active = false
        heldDir = -1; handler.removeCallbacks(mover)
        try { cursor?.let { wm.removeViewImmediate(it) } } catch (t: Throwable) { Logs.w("virtual mouse overlay removal", t) }
        cursor = null; lp = null
        Logs.event("mouse", "on" to false)
        toast(service.getString(R.string.mouse_off))
    }

    /** One movement tick; the longer the arrow has been held ([heldMs]), the faster the cursor goes. */
    private fun step(code: Int, heldMs: Long) {
        val ramp = minOf(heldMs, RAMP_MS).toFloat() / RAMP_MS
        val px = density * (4f + 16f * ramp)
        when (code) {
            KeyEvent.KEYCODE_DPAD_UP -> y -= px
            KeyEvent.KEYCODE_DPAD_DOWN -> y += px
            KeyEvent.KEYCODE_DPAD_LEFT -> x -= px
            KeyEvent.KEYCODE_DPAD_RIGHT -> x += px
        }
        x = x.coerceIn(0f, screenW - 1f); y = y.coerceIn(0f, screenH - 1f)
        val p = lp ?: return
        p.x = x.toInt(); p.y = y.toInt()
        try { cursor?.let { wm.updateViewLayout(it, p) } } catch (t: Throwable) { Logs.w("virtual mouse move", t) }
    }

    private fun tap() {
        val path = Path().apply { moveTo(x, y) }
        dispatch(GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 60)).build(), "tap")
    }

    /** A flick in the direction of the arrow: content scrolls that way, like a finger swipe. */
    private fun flick(code: Int) {
        val d = density * 140f
        val (dx, dy) = when (code) {
            KeyEvent.KEYCODE_DPAD_UP -> 0f to d
            KeyEvent.KEYCODE_DPAD_DOWN -> 0f to -d
            KeyEvent.KEYCODE_DPAD_LEFT -> d to 0f
            else -> -d to 0f
        }
        val sx = (x - dx).coerceIn(1f, screenW - 2f); val sy = (y - dy).coerceIn(1f, screenH - 2f)
        val ex = (x + dx).coerceIn(1f, screenW - 2f); val ey = (y + dy).coerceIn(1f, screenH - 2f)
        val path = Path().apply { moveTo(sx, sy); lineTo(ex, ey) }
        dispatch(GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 180)).build(), "flick")
    }

    private fun dispatch(gesture: GestureDescription, what: String) {
        val ok = try { service.dispatchGesture(gesture, null, null) } catch (t: Throwable) { Logs.w("virtual mouse $what", t); false }
        Logs.event("mouse", "gesture" to what, "ok" to ok, "x" to x.toInt(), "y" to y.toInt())
    }

    private fun toast(text: CharSequence) { try { Toast.makeText(service, text, Toast.LENGTH_SHORT).show() } catch (_: Throwable) {} }

    /** The arrow: white with a dark outline so it reads on any app. */
    private class CursorView(context: Context, density: Float) : View(context) {
        val sizePx = (28f * density).toInt()
        private val path = Path()
        private val fill = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE; style = Paint.Style.FILL }
        private val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(230, 20, 20, 20); style = Paint.Style.STROKE; strokeWidth = 1.6f * density; strokeJoin = Paint.Join.ROUND }
        init {
            val s = sizePx / 28f
            path.moveTo(2f * s, 2f * s); path.lineTo(2f * s, 22f * s); path.lineTo(7f * s, 17.5f * s); path.lineTo(10.5f * s, 25f * s)
            path.lineTo(13.5f * s, 23.7f * s); path.lineTo(10f * s, 16.5f * s); path.lineTo(17f * s, 16.5f * s); path.close()
        }
        override fun onDraw(canvas: Canvas) { canvas.drawPath(path, fill); canvas.drawPath(path, stroke) }
    }

    companion object {
        private const val DOUBLE_PRESS_MS = 320L
        private const val HOLD_MS = 550L
        private const val TICK_MS = 28L
        private const val FIRST_TICK_MS = 120L
        private const val RAMP_MS = 1400L
    }
}
