package com.cleartv.launcher.ui

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.cleartv.core.ClockMode
import com.cleartv.core.Grid
import com.cleartv.launcher.R
import com.cleartv.launcher.data.WallpaperRepository
import com.cleartv.launcher.util.Async
import com.cleartv.launcher.util.Logs

/**
 * Right-hand settings sheet. Pages are plain views built on demand (so every page always reflects the
 * current preferences) and kept on a small stack; BACK pops a page or closes the sheet.
 */
class SettingsPanel(private val home: HomeActivity, private val host: FrameLayout) {
    private val context: Context = home
    private val prefs get() = home.prefs
    val view: FrameLayout = FrameLayout(context)
    private val builders = ArrayList<() -> View>()
    private var returnFocus: View? = null
    private val widthPx = Ui.dp(context, 400f)

    val isOpen: Boolean get() = view.visibility == View.VISIBLE

    init {
        view.layoutParams = FrameLayout.LayoutParams(widthPx, ViewGroup.LayoutParams.MATCH_PARENT, Gravity.END)
        view.setBackgroundResource(R.drawable.bg_panel)
        view.visibility = View.GONE
        view.isClickable = true
        host.addView(view)
    }

    fun toggle() { if (isOpen) close() else open() }

    fun open() {
        if (isOpen) return
        returnFocus = home.currentFocus
        home.setMainFocusBlocked(true)
        builders.clear()
        host.visibility = View.VISIBLE
        view.visibility = View.VISIBLE
        push { buildMain() }
        val m = home.motion
        if (m.overlayMs > 0) {
            view.translationX = widthPx * 0.3f
            view.alpha = 0f
            view.animate().translationX(0f).alpha(1f).setDuration(m.overlayMs).setInterpolator(Ui.decelerate).start()
        } else {
            view.translationX = 0f; view.alpha = 1f
        }
        Logs.event("overlay", "name" to "settings", "open" to true)
    }

    fun close() {
        if (!isOpen) return
        view.descendantFocusability = ViewGroup.FOCUS_BLOCK_DESCENDANTS
        home.setMainFocusBlocked(false)
        (returnFocus?.takeIf { it.isShown } ?: home.settingsButton).requestFocus()
        returnFocus = null
        val finish = Runnable {
            view.visibility = View.GONE
            view.removeAllViews()
            builders.clear()
            view.descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
            home.onOverlayClosed()
        }
        val m = home.motion
        if (m.overlayMs > 0) view.animate().translationX(widthPx * 0.3f).alpha(0f).setDuration(m.overlayMs * 3 / 4).setInterpolator(Ui.standard).withEndAction(finish).start()
        else finish.run()
        Logs.event("overlay", "name" to "settings", "open" to false)
    }

    /** BACK pressed while the sheet is open. */
    fun back() { if (builders.size > 1) pop() else close() }

    fun refresh() { if (isOpen && builders.isNotEmpty()) show(builders.last()()) }

    private fun push(builder: () -> View) { builders += builder; show(builder()) }
    private fun pop() { builders.removeAt(builders.size - 1); show(builders.last()()) }

    private fun show(page: View) {
        view.removeAllViews()
        view.addView(page, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        page.post { (page.findViewWithTag<View>(TAG_FIRST) ?: page).requestFocus() }
    }

    // ---------------------------------------------------------------- page scaffold

    private fun scaffold(title: CharSequence, subPage: Boolean, content: View, focusableScroll: Boolean = false): View {
        val page = LinearLayout(context)
        page.orientation = LinearLayout.VERTICAL
        val p = Ui.dp(context, 24f)
        page.setPadding(p, Ui.dp(context, 40f), p, p)

        val header = LinearLayout(context)
        header.orientation = LinearLayout.HORIZONTAL
        header.gravity = Gravity.CENTER_VERTICAL
        if (subPage) {
            val back = ImageView(context)
            back.setImageResource(R.drawable.ic_back)
            back.imageTintList = ColorStateList.valueOf(context.getColor(R.color.text_secondary))
            val size = Ui.dp(context, 22f)
            val lp = LinearLayout.LayoutParams(size, size)
            lp.marginEnd = Ui.dp(context, 12f)
            header.addView(back, lp)
        }
        val t = TextView(context)
        t.text = title
        t.textSize = 24f
        t.setTextColor(context.getColor(R.color.text_primary))
        t.typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        header.addView(t)
        page.addView(header)

        val scroll = ScrollView(context)
        scroll.isVerticalScrollBarEnabled = false
        scroll.isFocusable = focusableScroll
        scroll.clipToPadding = false
        scroll.setPadding(0, Ui.dp(context, 18f), 0, 0)
        scroll.addView(content, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        if (focusableScroll) scroll.tag = TAG_FIRST
        page.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        return page
    }

    private fun list(): LinearLayout = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }

    private fun row(into: LinearLayout): SettingsRowView {
        val r = SettingsRowView(context)
        into.addView(r, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        if (into.childCount == 1) r.tag = TAG_FIRST
        return r
    }

    private fun note(into: LinearLayout, text: CharSequence) {
        val tv = TextView(context)
        tv.text = text
        tv.textSize = 12.5f
        tv.setTextColor(context.getColor(R.color.text_secondary))
        val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        lp.topMargin = Ui.dp(context, 14f)
        lp.leftMargin = Ui.dp(context, 16f)
        lp.rightMargin = Ui.dp(context, 16f)
        into.addView(tv, lp)
    }

    // ---------------------------------------------------------------- pages

    private fun buildMain(): View {
        val list = list()
        val s = context

        row(list).set(s.getString(R.string.settings_wallpaper), home.wallpapers.find(prefs.wallpaperId).title, null, R.drawable.ic_image)
            .setOnClickListener { push { buildWallpapers() } }

        row(list).apply {
            set(s.getString(R.string.settings_labels), null, null, R.drawable.ic_label)
            setToggle(prefs.showLabels)
            setOnClickListener { prefs.showLabels = !prefs.showLabels; setToggle(prefs.showLabels) }
        }

        row(list).apply {
            set(s.getString(R.string.settings_clock), null, clockLabel(prefs.clockMode), R.drawable.ic_clock)
            setOnClickListener { prefs.clockMode = prefs.clockMode.next(); value.text = clockLabel(prefs.clockMode) }
        }

        row(list).apply {
            val n = home.inputsFound
            set(s.getString(R.string.settings_inputs), if (n > 0) s.getString(R.string.settings_inputs_found, n) else s.getString(R.string.settings_inputs_none), null, R.drawable.ic_hdmi)
            setToggle(prefs.showInputs)
            setOnClickListener { prefs.showInputs = !prefs.showInputs; setToggle(prefs.showInputs) }
        }

        row(list).apply {
            set(s.getString(R.string.settings_reduced_motion), null, null, R.drawable.ic_tune)
            setToggle(prefs.reducedMotion)
            setOnClickListener { prefs.reducedMotion = !prefs.reducedMotion; setToggle(prefs.reducedMotion) }
        }

        row(list).set(s.getString(R.string.settings_hidden), null, prefs.hidden.size.toString(), R.drawable.ic_eye_off)
            .setOnClickListener { push { buildHidden() } }

        row(list).set(s.getString(R.string.settings_reset), null, null, R.drawable.ic_restore)
            .setOnClickListener {
                Ui.dialog(context)
                    .setMessage(R.string.settings_reset_confirm)
                    .setPositiveButton(R.string.ok) { _, _ -> prefs.resetLayout(); home.reloadApps(); refresh() }
                    .setNegativeButton(R.string.cancel, null)
                    .show()
            }

        row(list).set(s.getString(R.string.settings_system), s.getString(R.string.settings_system_sub), null, R.drawable.ic_settings)
            .setOnClickListener { home.openSystemSettings() }

        row(list).set(s.getString(R.string.settings_home), home.homeStatusText(), null, R.drawable.ic_home)
            .setOnClickListener { home.openHomeSettings() }

        row(list).set(s.getString(R.string.settings_about), home.versionText(), null, R.drawable.ic_info)
            .setOnClickListener { push { buildAbout() } }

        return scaffold(s.getString(R.string.settings), subPage = false, content = list)
    }

    private fun clockLabel(mode: ClockMode): String = context.getString(
        when (mode) { ClockMode.SYSTEM -> R.string.clock_system; ClockMode.H24 -> R.string.clock_24; ClockMode.H12 -> R.string.clock_12 }
    )

    private fun buildWallpapers(): View {
        val container = list()
        val all = home.wallpapers.all()
        val items = ArrayList<Any>(all)
        if (home.canPickDocument()) items += PICK
        val gap = Ui.dp(context, 12f)
        Grid.rows(items, 3).forEach { rowItems ->
            val rowLayout = LinearLayout(context)
            rowLayout.orientation = LinearLayout.HORIZONTAL
            rowLayout.clipChildren = false
            rowLayout.clipToPadding = false
            rowLayout.setPadding(Ui.dp(context, 8f), Ui.dp(context, 6f), 0, Ui.dp(context, 6f))
            rowItems.forEach { item ->
                val card = AppCardView(context, AppCardView.Size.THUMB)
                card.motion = home.motion
                if (item === PICK) {
                    card.bindSpecial(context.getString(R.string.wallpaper_pick_file), R.drawable.ic_image)
                    card.setOnClickListener { home.pickWallpaper() }
                } else {
                    val wp = item as WallpaperRepository.Wallpaper
                    card.bindSpecial(wp.title, 0)
                    card.isSelected = wp.id == prefs.wallpaperId
                    if (card.isSelected) card.tag = TAG_FIRST
                    Async.run({ home.wallpapers.decode(wp, Ui.dp(context, 208f), Ui.dp(context, 117f)) }) { bmp, _ -> if (bmp != null) card.setArtwork(bmp) }
                    card.setOnClickListener { prefs.wallpaperId = wp.id; refresh() }
                    if (!wp.bundled) card.setOnLongClickListener {
                        Ui.dialog(context).setTitle(wp.title).setItems(arrayOf(context.getString(R.string.menu_delete))) { _, _ ->
                            if (home.wallpapers.delete(wp)) { if (prefs.wallpaperId == wp.id) prefs.wallpaperId = com.cleartv.launcher.data.Prefs.DEFAULT_WALLPAPER; refresh() }
                        }.show(); true
                    }
                }
                if (container.childCount == 0 && rowLayout.childCount == 0 && card.tag == null && all.none { it.id == prefs.wallpaperId }) card.tag = TAG_FIRST
                val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                lp.marginEnd = gap
                rowLayout.addView(card, lp)
            }
            container.addView(rowLayout)
        }
        note(container, context.getString(R.string.wallpaper_folder_hint, home.wallpapers.userDir().absolutePath))
        return scaffold(context.getString(R.string.settings_wallpaper), subPage = true, content = container)
    }

    private fun buildHidden(): View {
        val list = list()
        val hidden = prefs.hidden
        if (hidden.isEmpty()) {
            note(list, context.getString(R.string.hidden_empty))
        } else {
            val labels = home.allEntries.associate { it.packageName to it.label }
            hidden.sorted().forEach { pkg ->
                row(list).set(labels[pkg] ?: pkg, pkg, context.getString(R.string.hidden_unhide), R.drawable.ic_apps)
                    .setOnClickListener { prefs.hidden = prefs.hidden - pkg; refresh() }
            }
        }
        return scaffold(context.getString(R.string.settings_hidden), subPage = true, content = list)
    }

    private fun buildAbout(): View {
        val tv = TextView(context)
        tv.text = home.diagnosticsText()
        tv.textSize = 12f
        tv.typeface = Typeface.MONOSPACE
        tv.setTextColor(context.getColor(R.color.text_secondary))
        tv.setPadding(Ui.dp(context, 8f), 0, Ui.dp(context, 8f), 0)
        return scaffold(context.getString(R.string.settings_about), subPage = true, content = tv, focusableScroll = true)
    }

    companion object {
        private const val TAG_FIRST = "first"
        private val PICK = Any()
    }
}
