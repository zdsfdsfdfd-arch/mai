package com.cleartv.launcher.ui

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader
import android.util.AttributeSet
import android.view.View

/**
 * Ambient glow in the colour of the focused app: one radial gradient rising from below the dock.
 *
 * Cost matters here. A Salute TV (Amlogic T5W, Mali-G31) spent ~15 ms of GPU time per frame when this view
 * blended a gradient over the whole 1080p screen on top of two more full-screen fills; every colour change
 * repaints it for the whole animation. So the view measures itself to the lower [HEIGHT_FRACTION] of the
 * screen only, the gradient reaches exactly zero at its top edge (no visible seam against the black window),
 * and the ellipse is stretched horizontally so the wash still spans the full width. Repainted only while the
 * colour animates; it costs nothing at rest. No blur, no bitmaps.
 */
class AmbientView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null) : View(context, attrs) {
    private val paint = Paint()
    private val matrix = Matrix()
    private var color = Color.TRANSPARENT
    private var animator: ValueAnimator? = null
    private var shaderColor = 0
    private var shaderW = 0
    private var shaderH = 0

    fun setColor(target: Int, animate: Boolean) {
        animator?.cancel()
        if (!animate || color == Color.TRANSPARENT) { color = target; invalidate(); return }
        animator = ValueAnimator.ofObject(ArgbEvaluator(), color, target).apply {
            duration = DURATION_MS
            addUpdateListener { color = it.animatedValue as Int; invalidate() }
            start()
        }
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val w = MeasureSpec.getSize(widthMeasureSpec)
        val h = MeasureSpec.getSize(heightMeasureSpec)
        setMeasuredDimension(w, (h * HEIGHT_FRACTION).toInt().coerceAtLeast(1))
    }

    override fun onDraw(canvas: Canvas) {
        if (width == 0 || height == 0 || Color.alpha(color) == 0) return
        if (shaderColor != color || shaderW != width || shaderH != height) {
            val r = Color.red(color); val g = Color.green(color); val b = Color.blue(color)
            val cx = width * 0.5f
            val cy = height * CENTER_Y             // below the bottom edge: the dock sits in the brightest part
            val radius = height * CENTER_Y         // ...and the gradient is fully transparent at the top edge
            val shader = RadialGradient(cx, cy, radius,
                intArrayOf(Color.argb(150, r, g, b), Color.argb(60, r, g, b), Color.TRANSPARENT),
                floatArrayOf(0f, 0.45f, 1f), Shader.TileMode.CLAMP)
            matrix.setScale(STRETCH_X, 1f, cx, cy)
            shader.setLocalMatrix(matrix)
            paint.shader = shader
            shaderColor = color; shaderW = width; shaderH = height
        }
        canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
    }

    override fun hasOverlappingRendering(): Boolean = false

    override fun onDetachedFromWindow() { animator?.cancel(); super.onDetachedFromWindow() }

    companion object {
        const val HEIGHT_FRACTION = 0.62f
        private const val CENTER_Y = 1.15f
        private const val STRETCH_X = 2.2f
        private const val DURATION_MS = 280L
    }
}
