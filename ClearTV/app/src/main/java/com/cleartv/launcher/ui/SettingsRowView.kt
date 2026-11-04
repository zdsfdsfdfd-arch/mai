package com.cleartv.launcher.ui

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.os.Build
import android.text.TextUtils
import android.view.Gravity
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.cleartv.launcher.R

/** One focusable row in the settings panel: optional icon, title, subtitle and a trailing value. */
class SettingsRowView(context: Context) : LinearLayout(context) {
    val icon = ImageView(context)
    val title = TextView(context)
    val subtitle = TextView(context)
    val value = TextView(context)

    init {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        isFocusable = true
        isClickable = true
        minimumHeight = Ui.dp(context, 58f)
        val ph = Ui.dp(context, 16f)
        val pv = Ui.dp(context, 10f)
        setPadding(ph, pv, ph, pv)
        setBackgroundResource(R.drawable.bg_settings_row)
        if (Build.VERSION.SDK_INT >= 26) defaultFocusHighlightEnabled = false

        val iconSize = Ui.dp(context, 22f)
        val iconLp = LayoutParams(iconSize, iconSize)
        iconLp.marginEnd = Ui.dp(context, 16f)
        icon.layoutParams = iconLp
        icon.imageTintList = ColorStateList.valueOf(context.getColor(R.color.text_secondary))

        val texts = LinearLayout(context)
        texts.orientation = VERTICAL
        texts.layoutParams = LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        title.textSize = 16f
        title.setTextColor(context.getColor(R.color.text_primary))
        title.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        title.setSingleLine(true)
        title.ellipsize = TextUtils.TruncateAt.END
        subtitle.textSize = 13f
        subtitle.setTextColor(context.getColor(R.color.text_secondary))
        subtitle.visibility = GONE
        texts.addView(title)
        texts.addView(subtitle)

        value.textSize = 14f
        value.setTextColor(context.getColor(R.color.text_secondary))
        val valueLp = LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        valueLp.marginStart = Ui.dp(context, 12f)
        value.layoutParams = valueLp

        addView(icon)
        addView(texts)
        addView(value)
    }

    fun set(titleText: CharSequence, subtitleText: CharSequence? = null, valueText: CharSequence? = null, iconRes: Int = 0): SettingsRowView {
        title.text = titleText
        subtitle.text = subtitleText
        subtitle.visibility = if (subtitleText.isNullOrEmpty()) GONE else VISIBLE
        value.text = valueText
        value.visibility = if (valueText.isNullOrEmpty()) GONE else VISIBLE
        if (iconRes != 0) { icon.setImageResource(iconRes); icon.visibility = VISIBLE } else icon.visibility = GONE
        contentDescription = titleText
        return this
    }

    fun setToggle(on: Boolean) {
        value.text = context.getString(if (on) R.string.on else R.string.off)
        value.visibility = VISIBLE
        value.setTextColor(context.getColor(if (on) R.color.text_primary else R.color.text_secondary))
    }
}
