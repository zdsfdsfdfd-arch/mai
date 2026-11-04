package com.cleartv.launcher.ui

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.util.AttributeSet
import android.view.FocusFinder
import android.view.View
import android.view.ViewGroup
import android.widget.HorizontalScrollView
import android.widget.LinearLayout

/**
 * Horizontal row of cards driven entirely by D-pad focus.
 *
 * [HorizontalScrollView] is kept for measurement, layout and key plumbing, but all scrolling is owned by
 * this class: the stock widget jumps instantly when a child gains focus and its `smoothScrollBy` falls
 * back to an instant `scrollBy` for key repeats, which would also recurse into an override of `scrollBy`.
 * Here every scroll goes through one [ValueAnimator] towards [targetX], the focused card keeps a margin
 * from the screen edge, and the row remembers which card was focused so vertical navigation returns to it.
 */
class FocusRow @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null) : HorizontalScrollView(context, attrs) {

    val container: LinearLayout = LinearLayout(context)
    var lastFocusedIndex: Int = -1
        private set
    var onChildFocused: ((index: Int, view: View) -> Unit)? = null
    var smooth: Boolean = true

    private val edgeMarginPx = Ui.dp(context, 72f)
    private val tempRect = Rect()
    private var targetX = 0
    private var animator: ValueAnimator? = null
    private var animating = false
    private var suppressScrollBy = false

    init {
        container.orientation = LinearLayout.HORIZONTAL
        container.clipChildren = false
        container.clipToPadding = false
        val h = Ui.dp(context, 48f)
        val v = Ui.dp(context, 16f)
        container.setPadding(h, v, h, v)
        addView(container, ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        isHorizontalScrollBarEnabled = false
        overScrollMode = OVER_SCROLL_NEVER
        clipChildren = false
        clipToPadding = false
        isFocusable = false
        descendantFocusability = FOCUS_AFTER_DESCENDANTS
        isSmoothScrollingEnabled = false
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

    fun scrollToStart() = smoothTo(0)

    /** Scrolls so that [view] (a card in this row) is fully visible with [edgeMarginPx] of breathing room. */
    fun ensureVisible(view: View) {
        if (width == 0) return
        view.getDrawingRect(tempRect)
        offsetDescendantRectToMyCoords(view, tempRect)
        tempRect.inset(-edgeMarginPx, 0)
        val viewport = width
        val screenLeft = targetX
        val screenRight = screenLeft + viewport
        var delta = 0
        if (tempRect.right > screenRight && tempRect.left > screenLeft) {
            delta = if (tempRect.width() > viewport) tempRect.left - screenLeft else tempRect.right - screenRight
        } else if (tempRect.left < screenLeft && tempRect.right < screenRight) {
            delta = if (tempRect.width() > viewport) -(screenRight - tempRect.right) else -(screenLeft - tempRect.left)
        }
        if (delta != 0) smoothTo(targetX + delta)
    }

    private fun maxScroll(): Int = maxOf(0, container.width - width)

    private fun smoothTo(x: Int) {
        val target = x.coerceIn(0, maxScroll())
        targetX = target
        animator?.cancel()
        animator = null
        if (!smooth || !isShown || target == scrollX) {
            scrollTo(target, 0)
            return
        }
        animator = ValueAnimator.ofInt(scrollX, target).apply {
            duration = 220
            interpolator = Ui.standard
            addUpdateListener {
                animating = true
                scrollTo(it.animatedValue as Int, 0)
                animating = false
            }
            start()
        }
    }

    /** Anything else that moves the row (HorizontalScrollView internals) must keep [targetX] in sync. */
    override fun scrollTo(x: Int, y: Int) {
        super.scrollTo(x, y)
        if (!animating) { targetX = scrollX; animator?.cancel(); animator = null }
    }

    override fun scrollBy(x: Int, y: Int) {
        if (suppressScrollBy) return
        smoothTo(targetX + x)
    }

    /** The stock implementation scrolls instantly here; suppress it and run the animated version. */
    override fun requestChildFocus(child: View?, focused: View?) {
        suppressScrollBy = true
        try { super.requestChildFocus(child, focused) } finally { suppressScrollBy = false }
        if (focused != null) {
            val index = indexOf(focused)
            if (index >= 0) {
                lastFocusedIndex = index
                val card = container.getChildAt(index)
                if (isLaidOut) ensureVisible(card) else post { ensureVisible(card) }
                onChildFocused?.invoke(index, card)
            }
        }
    }

    /** LEFT/RIGHT inside the row: move focus to the neighbour; the scroll follows in [requestChildFocus]. */
    override fun arrowScroll(direction: Int): Boolean {
        val current = findFocus()?.takeIf { it !== this }
        val next = FocusFinder.getInstance().findNextFocus(this, current, direction) ?: return false
        return next.requestFocus(direction)
    }

    override fun pageScroll(direction: Int): Boolean = arrowScroll(direction)
    override fun fullScroll(direction: Int): Boolean = arrowScroll(direction)

    private fun indexOf(view: View): Int {
        var current: View? = view
        while (current != null && current.parent !== container) current = current.parent as? View
        return if (current == null) -1 else container.indexOfChild(current)
    }

    /** When focus comes back from another row (UP/DOWN), offer only the remembered card to FocusFinder. */
    override fun addFocusables(views: ArrayList<View>, direction: Int, focusableMode: Int) {
        val remembered = container.getChildAt(lastFocusedIndex)
        if (remembered != null && !hasFocus() && (direction == FOCUS_UP || direction == FOCUS_DOWN)) {
            remembered.addFocusables(views, direction, focusableMode)
            return
        }
        super.addFocusables(views, direction, focusableMode)
    }

    override fun onRequestFocusInDescendants(direction: Int, previouslyFocusedRect: Rect?): Boolean {
        val remembered = container.getChildAt(lastFocusedIndex)
        if (remembered != null && remembered.requestFocus(direction)) return true
        return super.onRequestFocusInDescendants(direction, previouslyFocusedRect)
    }

    override fun onDetachedFromWindow() {
        animator?.cancel()
        animator = null
        super.onDetachedFromWindow()
    }
}
