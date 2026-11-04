package com.cleartv.launcher.ui

import android.app.AlertDialog
import android.content.Context
import android.graphics.Outline
import android.view.View
import android.view.ViewOutlineProvider
import android.view.animation.Interpolator
import android.view.animation.PathInterpolator
import com.cleartv.launcher.R
import com.cleartv.launcher.data.Prefs

/** Motion profile: full on capable hardware, reduced when the user asks for it or after a crash loop. */
class Motion(val focusMs: Long, val overlayMs: Long, val focusScale: Float, val smoothScroll: Boolean) {
    companion object {
        val FULL = Motion(focusMs = 170, overlayMs = 220, focusScale = 1.10f, smoothScroll = true)
        val REDUCED = Motion(focusMs = 0, overlayMs = 0, focusScale = 1.04f, smoothScroll = false)
    }
}

object Ui {
    /** Material "standard" curve; matches the system's own focus/transition feel. */
    val standard: Interpolator = PathInterpolator(0.4f, 0f, 0.2f, 1f)
    val decelerate: Interpolator = PathInterpolator(0f, 0f, 0.2f, 1f)

    fun dp(context: Context, value: Float): Int = (value * context.resources.displayMetrics.density + 0.5f).toInt()
    fun dpF(context: Context, value: Float): Float = value * context.resources.displayMetrics.density
    fun sp(context: Context, value: Float): Float = value * context.resources.displayMetrics.scaledDensity

    fun motion(prefs: Prefs): Motion = if (prefs.reducedMotion) Motion.REDUCED else Motion.FULL

    fun dialog(context: Context): AlertDialog.Builder = AlertDialog.Builder(context, R.style.Theme_ClearTV_Dialog)

    fun roundedOutline(radiusPx: Float): ViewOutlineProvider = object : ViewOutlineProvider() {
        override fun getOutline(view: View, outline: Outline) {
            outline.setRoundRect(0, 0, view.width, view.height, radiusPx)
        }
    }

    /** Fades a view in from invisible; respects reduced motion. */
    fun appear(view: View, motion: Motion, translateYPx: Float = 0f) {
        view.visibility = View.VISIBLE
        if (motion.overlayMs == 0L) { view.alpha = 1f; view.translationY = 0f; return }
        view.alpha = 0f
        view.translationY = translateYPx
        view.animate().alpha(1f).translationY(0f).setDuration(motion.overlayMs).setInterpolator(decelerate).start()
    }

    fun disappear(view: View, motion: Motion, translateYPx: Float = 0f, onEnd: (() -> Unit)? = null) {
        if (motion.overlayMs == 0L) { view.visibility = View.GONE; onEnd?.invoke(); return }
        view.animate().alpha(0f).translationY(translateYPx).setDuration(motion.overlayMs * 3 / 4).setInterpolator(standard)
            .withEndAction { view.visibility = View.GONE; view.alpha = 1f; view.translationY = 0f; onEnd?.invoke() }.start()
    }
}
