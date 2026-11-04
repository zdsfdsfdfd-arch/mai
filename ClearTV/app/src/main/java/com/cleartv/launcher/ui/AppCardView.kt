package com.cleartv.launcher.ui

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.Build
import android.text.TextUtils
import android.view.Gravity
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.cleartv.launcher.R
import com.cleartv.launcher.data.AppEntry

/**
 * A focusable 16:9 card with a label underneath. Focus is expressed with three cheap, GPU-friendly
 * properties: a scale animation, an animated 2.5 dp ring drawn around the artwork and a slightly brighter
 * label. The ring turns to the accent colour while the card is being moved.
 */
class AppCardView(context: Context, val size: Size) : FrameLayout(context) {

    enum class Size(val wDp: Int, val hDp: Int, val labelSp: Float) {
        LARGE(208, 117, 15f),
        SMALL(160, 90, 13f),
        THUMB(104, 58, 12f),
    }

    val image: ImageView = ImageView(context)
    val label: TextView = TextView(context)
    private val column = LinearLayout(context)

    var entry: AppEntry? = null
        private set
    var motion: Motion = Motion.FULL
    var moving: Boolean = false
        set(value) { field = value; invalidate() }

    private val radiusPx = Ui.dpF(context, 10f)
    private val gapPx = Ui.dpF(context, 5f)
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = Ui.dpF(context, 2.5f)
    }
    private val ringRect = RectF()
    private var ringAlpha = 0f
    private var ringAnimator: ValueAnimator? = null
    private val colorPrimary = context.getColor(R.color.text_primary)
    private val colorSecondary = context.getColor(R.color.text_secondary)
    private val colorRing = context.getColor(R.color.focus_ring)
    private val colorAccent = context.getColor(R.color.accent)
    private val badgePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = colorAccent }
    private val check = context.getDrawable(R.drawable.ic_check)?.mutate()?.apply { setTint(colorPrimary) }

    init {
        isFocusable = true
        isFocusableInTouchMode = false
        isClickable = true
        isLongClickable = true
        clipChildren = false
        clipToPadding = false
        if (Build.VERSION.SDK_INT >= 26) defaultFocusHighlightEnabled = false

        val w = Ui.dp(context, size.wDp.toFloat())
        val h = Ui.dp(context, size.hDp.toFloat())
        column.orientation = LinearLayout.VERTICAL
        column.gravity = Gravity.CENTER_HORIZONTAL
        column.clipChildren = false

        image.layoutParams = LinearLayout.LayoutParams(w, h)
        image.scaleType = ImageView.ScaleType.CENTER_CROP
        image.outlineProvider = Ui.roundedOutline(radiusPx)
        image.clipToOutline = true
        image.setBackgroundResource(R.drawable.card_placeholder)

        val lp = LinearLayout.LayoutParams(w, LinearLayout.LayoutParams.WRAP_CONTENT)
        lp.topMargin = Ui.dp(context, 10f)
        label.layoutParams = lp
        label.gravity = Gravity.CENTER_HORIZONTAL
        label.setSingleLine(true)
        label.ellipsize = TextUtils.TruncateAt.END
        label.textSize = size.labelSp
        label.setTextColor(colorSecondary)
        label.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        label.alpha = 0.85f

        column.addView(image)
        column.addView(label)
        addView(column, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))

        setOnFocusChangeListener { _, focused -> onFocus(focused) }
    }

    fun bind(entry: AppEntry) {
        this.entry = entry
        label.text = entry.label
        contentDescription = entry.label
        image.scaleType = ImageView.ScaleType.CENTER_CROP
        image.setImageDrawable(null)
        image.setPadding(0, 0, 0, 0)
        image.setBackgroundResource(R.drawable.card_placeholder)
    }

    /** A non-application card ("All apps", an HDMI input): an icon centred on a quiet surface. */
    fun bindSpecial(title: CharSequence, iconRes: Int) {
        entry = null
        label.text = title
        contentDescription = title
        image.setBackgroundResource(R.drawable.card_special)
        image.scaleType = ImageView.ScaleType.CENTER_INSIDE
        val pad = Ui.dp(context, size.hDp * 0.30f)
        image.setPadding(pad, pad, pad, pad)
        image.setImageResource(iconRes)
        image.imageTintList = android.content.res.ColorStateList.valueOf(colorPrimary)
    }

    fun setArtwork(bitmap: Bitmap?) {
        image.imageTintList = null
        image.setPadding(0, 0, 0, 0)
        image.scaleType = ImageView.ScaleType.CENTER_CROP
        image.setImageBitmap(bitmap)
    }

    fun showLabel(show: Boolean) {
        label.visibility = if (show) VISIBLE else INVISIBLE
    }

    private fun onFocus(focused: Boolean) {
        val target = if (focused) motion.focusScale else 1f
        animate().cancel()
        if (motion.focusMs == 0L) {
            scaleX = target; scaleY = target
        } else {
            animate().scaleX(target).scaleY(target).setDuration(motion.focusMs).setInterpolator(Ui.standard).start()
        }
        image.translationZ = if (focused) Ui.dpF(context, 6f) else 0f
        label.setTextColor(if (focused) colorPrimary else colorSecondary)
        label.alpha = if (focused) 1f else 0.85f
        animateRing(if (focused) 1f else 0f)
    }

    private fun animateRing(to: Float) {
        ringAnimator?.cancel()
        if (motion.focusMs == 0L) { ringAlpha = to; invalidate(); return }
        ringAnimator = ValueAnimator.ofFloat(ringAlpha, to).apply {
            duration = motion.focusMs
            interpolator = Ui.standard
            addUpdateListener { ringAlpha = it.animatedValue as Float; invalidate() }
            start()
        }
    }

    override fun dispatchDraw(canvas: Canvas) {
        super.dispatchDraw(canvas)
        if (ringAlpha <= 0f) return
        ringPaint.color = if (moving) colorAccent else colorRing
        ringPaint.alpha = (ringAlpha * 255).toInt()
        val left = column.left + image.left
        val top = column.top + image.top
        ringRect.set(left - gapPx, top - gapPx, left + image.width + gapPx, top + image.height + gapPx)
        canvas.drawRoundRect(ringRect, radiusPx + gapPx, radiusPx + gapPx, ringPaint)
    }

    override fun onDrawForeground(canvas: Canvas) {
        super.onDrawForeground(canvas)
        if (!isSelected) return
        val r = Ui.dpF(context, 11f)
        val cx = column.left + image.right - r - Ui.dpF(context, 6f)
        val cy = column.top + image.top + r + Ui.dpF(context, 6f)
        canvas.drawCircle(cx, cy, r, badgePaint)
        check?.let {
            val half = (r * 0.68f).toInt()
            it.setBounds((cx - half).toInt(), (cy - half).toInt(), (cx + half).toInt(), (cy + half).toInt())
            it.draw(canvas)
        }
    }
}
