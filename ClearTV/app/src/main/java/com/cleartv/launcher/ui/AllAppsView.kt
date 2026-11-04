package com.cleartv.launcher.ui

import android.content.Context
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.cleartv.core.Grid
import com.cleartv.launcher.R
import com.cleartv.launcher.data.AppEntry
import com.cleartv.launcher.util.Logs

/** Full-screen alphabetical grid of every visible application. */
class AllAppsView(private val home: HomeActivity, private val host: FrameLayout) {
    private val context: Context = home
    val view: FrameLayout = FrameLayout(context)
    private val count = TextView(context)
    private val grid = LinearLayout(context)
    private var returnFocus: View? = null

    val isOpen: Boolean get() = view.visibility == View.VISIBLE

    init {
        view.setBackgroundColor(context.getColor(R.color.overlay_scrim))
        view.visibility = View.GONE
        view.isClickable = true

        val column = LinearLayout(context)
        column.orientation = LinearLayout.VERTICAL
        column.clipChildren = false
        column.clipToPadding = false
        val margin = Ui.dp(context, 48f)
        column.setPadding(0, Ui.dp(context, 40f), 0, 0)

        val header = LinearLayout(context)
        header.orientation = LinearLayout.HORIZONTAL
        header.gravity = Gravity.BOTTOM
        header.setPadding(margin, 0, margin, 0)
        val title = TextView(context)
        title.text = context.getString(R.string.all_apps)
        title.textSize = 28f
        title.setTextColor(context.getColor(R.color.text_primary))
        title.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        count.textSize = 15f
        count.setTextColor(context.getColor(R.color.text_secondary))
        val countLp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        countLp.marginStart = Ui.dp(context, 16f)
        countLp.bottomMargin = Ui.dp(context, 5f)
        header.addView(title)
        header.addView(count, countLp)
        column.addView(header)

        val scroll = ScrollView(context)
        scroll.isVerticalScrollBarEnabled = false
        scroll.clipChildren = false
        scroll.clipToPadding = false
        scroll.setPadding(margin, Ui.dp(context, 24f), margin, Ui.dp(context, 40f))
        grid.orientation = LinearLayout.VERTICAL
        grid.clipChildren = false
        grid.clipToPadding = false
        scroll.addView(grid, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        column.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        view.addView(column, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        host.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    }

    fun show(entries: List<AppEntry>) {
        returnFocus = home.currentFocus
        home.setMainFocusBlocked(true)
        populate(entries)
        host.visibility = View.VISIBLE
        view.descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
        Ui.appear(view, home.motion, Ui.dpF(context, 24f))
        grid.post { firstCard()?.requestFocus() }
        Logs.event("overlay", "name" to "allapps", "open" to true, "count" to entries.size)
    }

    /** Re-renders in place (e.g. after an app was hidden or favourited) keeping focus where possible. */
    fun update(entries: List<AppEntry>) {
        if (!isOpen) return
        val focusedPkg = (home.currentFocus as? AppCardView)?.entry?.packageName
        populate(entries)
        grid.post {
            val target = allCards().firstOrNull { it.entry?.packageName == focusedPkg } ?: firstCard()
            target?.requestFocus()
        }
    }

    fun hide() {
        if (!isOpen) return
        view.descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
        home.setMainFocusBlocked(false)
        val back = returnFocus?.takeIf { it.isShown } ?: home.appsRow
        back.requestFocus()
        returnFocus = null
        Ui.disappear(view, home.motion, Ui.dpF(context, 16f)) {
            grid.removeAllViews()
            home.onOverlayClosed()
        }
        Logs.event("overlay", "name" to "allapps", "open" to false)
    }

    private fun populate(entries: List<AppEntry>) {
        grid.removeAllViews()
        count.text = context.getString(R.string.apps_count, entries.size)
        val gap = Ui.dp(context, 16f)
        Grid.rows(entries, COLUMNS).forEach { rowItems ->
            val row = LinearLayout(context)
            row.orientation = LinearLayout.HORIZONTAL
            row.clipChildren = false
            row.clipToPadding = false
            val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
            lp.bottomMargin = Ui.dp(context, 14f)
            rowItems.forEach { entry ->
                val card = home.newAppCard(AppCardView.Size.SMALL, entry, inRow = false)
                val clp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                clp.marginEnd = gap
                row.addView(card, clp)
                home.loadArtwork(card)
            }
            grid.addView(row, lp)
        }
    }

    private fun firstCard(): View? = (grid.getChildAt(0) as? ViewGroup)?.getChildAt(0)

    private fun allCards(): List<AppCardView> {
        val out = ArrayList<AppCardView>()
        for (i in 0 until grid.childCount) {
            val row = grid.getChildAt(i) as? ViewGroup ?: continue
            for (j in 0 until row.childCount) (row.getChildAt(j) as? AppCardView)?.let { out += it }
        }
        return out
    }

    companion object { private const val COLUMNS = 5 }
}
