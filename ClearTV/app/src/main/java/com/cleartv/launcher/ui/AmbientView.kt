package com.cleartv.launcher.ui

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.util.AttributeSet
import android.view.View

/**
 * Ambient glow in the colour of the focused app: one radial gradient rising from below the dock. Repainted
 * only while the colour animates (360 ms), so it costs nothing at rest. No blur, no bitmaps.
 */
class AmbientView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null) : View(context, attrs) {
    private val paint = Paint()
    private var color = Color.TRANSPARENT
    private var animator: ValueAnimator? = null
    private var shaderColor = 0
    private var shaderW = 0
    private var shaderH = 0

    fun setColor(target: Int, animate: Boolean) {
        animator?.cancel()
        if (!animate || color == Color.TRANSPARENT) { color = target; invalidate(); return }
        animator = ValueAnimator.ofObject(ArgbEvaluator(), color, target).apply {
            duration = 360
            addUpdateListener { color = it.animatedValue as Int; invalidate() }
            start()
        }
    }

    override fun onDraw(canvas: Canvas) {
        if (width == 0 || height == 0 || Color.alpha(color) == 0) return
        if (shaderColor != color || shaderW != width || shaderH != height) {
            val c = Color.argb(150, Color.red(color), Color.green(color), Color.blue(color))
            paint.shader = RadialGradient(width * 0.5f, height * 1.12f, width * 0.95f,
                intArrayOf(c, Color.argb(60, Color.red(color), Color.green(color), Color.blue(color)), Color.TRANSPARENT),
                floatArrayOf(0f, 0.45f, 1f), Shader.TileMode.CLAMP)
            shaderColor = color; shaderW = width; shaderH = height
        }
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    }

    override fun hasOverlappingRendering(): Boolean = false

    override fun onDetachedFromWindow() { animator?.cancel(); super.onDetachedFromWindow() }
}
