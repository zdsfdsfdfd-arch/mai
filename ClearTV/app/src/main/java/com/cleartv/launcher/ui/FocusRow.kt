package com.cleartv.launcher.ui

import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import com.cleartv.core.Scrolling

/**
 * Horizontal row of cards driven entirely by D-pad focus.
 *
 * Built on [HorizontalScrollView] so the platform's focus search and key handling are reused, with three
 * adjustments: focus-driven scrolling becomes smooth (the stock widget jumps), the focused card keeps a
 * comfortable margin from the screen edge, and the row remembers which card was focused so vertical
 * navigation returns to it.
 */
class FocusRow @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null) : HorizontalScrollView(context, attrs) {

    val container: LinearLayout = LinearLayout(context)
    var lastFocusedIndex: Int = -1
        private set
    var onChildFocused: ((index: Int, view: View) -> Unit)? = null
    var smooth: Boolean = true
    private val edgeMarginPx = Ui.dp(context, 72f)

    init {
        container.orientation = LinearLayout.HORIZONTAL
        container.clipChildren = false
        container.clipToPadding = false
        val h = Ui.dp(context, 48f)
        val v = Ui.dp(context, 22f)
        container.setPadding(h, v, h, v)
        addView(container, ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        isHorizontalScrollBarEnabled = false
        overScrollMode = OVER_SCROLL_NEVER
        clipChildren = false
        clipToPadding = false
        isFocusable = false
        descendantFocusability = FOCUS_AFTER_DESCENDANTS
        isSmoothScrollingEnabled = true
        isHorizontalFadingEdgeEnabled = false
        if (Build.VERSION.SDK_INT >= 26) defaultFocusHighlightEnabled = false
    }

    val count: Int get() = container.childCount
    fun childAt(index: Int): View? = container.getChildAt(index)

    fun add(view: View, gapPx: Int) {
        val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        lp.marginEnd = gapPx
        container.addView(view, lp)
    }

    fun clear() {
        container.removeAllViews()
        lastFocusedIndex = -1
    }

    fun focusIndex(index: Int): Boolean = container.getChildAt(index)?.requestFocus() ?: false

    fun scrollToStart() { if (smooth) smoothScrollTo(0, 0) else scrollTo(0, 0) }

    /** Centres the card at [index] assuming uniform card widths (true for every row in the launcher). */
    fun scrollToIndex(index: Int) {
        val child = container.getChildAt(index) ?: return
        val lp = child.layoutParams as LinearLayout.LayoutParams
        val stride = child.width + lp.marginEnd
        val left = container.paddingLeft + index * stride
        val max = container.width - width
        val target = Scrolling.centeredScroll(left, child.width, width, max)
        if (smooth) smoothScrollTo(target, 0) else scrollTo(target, 0)
    }

    override fun requestChildFocus(child: View?, focused: View?) {
        super.requestChildFocus(child, focused)
        if (focused != null) {
            val index = indexOf(focused)
            if (index >= 0) {
                lastFocusedIndex = index
                onChildFocused?.invoke(index, container.getChildAt(index))
            }
        }
    }

    private fun indexOf(view: View): Int {
        var current: View? = view
        while (current != null && current.parent !== container) current = current.parent as? View
        return if (current == null) -1 else container.indexOfChild(current)
    }

    override fun onRequestFocusInDescendants(direction: Int, previouslyFocusedRect: Rect?): Boolean {
        val remembered = container.getChildAt(lastFocusedIndex)
        if (remembered != null && remembered.requestFocus(direction)) return true
        return super.onRequestFocusInDescendants(direction, previouslyFocusedRect)
    }

    /** The stock widget jumps when a child gains focus; route that through the smooth scroller instead. */
    override fun scrollBy(x: Int, y: Int) {
        if (smooth && x != 0 && isShown) smoothScrollBy(x, y) else super.scrollBy(x, y)
    }

    override fun computeScrollDeltaToGetChildRectOnScreen(rect: Rect): Int {
        rect.inset(-edgeMarginPx, 0)
        return super.computeScrollDeltaToGetChildRectOnScreen(rect)
    }
}
