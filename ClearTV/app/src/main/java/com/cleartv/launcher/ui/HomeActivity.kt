package com.cleartv.launcher.ui

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Point
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import android.provider.Settings
import android.text.format.DateFormat
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextClock
import android.widget.TextView
import android.widget.Toast
import com.cleartv.core.AppOrder
import com.cleartv.core.retain
import com.cleartv.launcher.ClearTvApp
import com.cleartv.launcher.R
import com.cleartv.launcher.data.AppEntry
import com.cleartv.launcher.data.AppRepository
import com.cleartv.launcher.data.HomeKeeper
import com.cleartv.launcher.data.NetworkMonitor
import com.cleartv.launcher.data.Prefs
import com.cleartv.launcher.data.SaluteDefaults
import com.cleartv.launcher.data.TvInputsRepository
import com.cleartv.launcher.data.WallpaperRepository
import com.cleartv.launcher.guard.HomeGuardService
import com.cleartv.launcher.util.Async
import com.cleartv.launcher.util.Logs
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * The home screen, laid out like a tvOS top shelf: greeting, thin clock and date top-left, three frosted
 * pills top-right (Inputs, network, Settings), the focused app's name above a rounded dock band at the
 * bottom, and an ambient glow in that app's colour. Down opens the grid of every app.
 *
 * Everything is driven by D-pad focus. The activity never finishes on BACK (that is what a HOME activity
 * does), and the HOME key, when ClearTV is the default launcher, brings the dock back to its first card.
 */
class HomeActivity : Activity() {

    lateinit var prefs: Prefs; private set
    lateinit var wallpapers: WallpaperRepository; private set
    private lateinit var app: ClearTvApp
    private lateinit var repo: AppRepository
    private lateinit var inputsRepo: TvInputsRepository
    private lateinit var network: NetworkMonitor

    private lateinit var content: FrameLayout
    private lateinit var wallpaperView: ImageView
    private lateinit var scrim: View
    private lateinit var ambient: AmbientView
    private lateinit var greeting: TextView
    private lateinit var clock: TextClock
    private lateinit var dateView: TextView
    private lateinit var pillInputs: TextView
    private lateinit var pillNetwork: TextView
    lateinit var settingsButton: TextView; private set
    private lateinit var heroName: TextView
    private lateinit var dockBand: FrameLayout
    lateinit var appsRow: FocusRow; private set
    private lateinit var hint: TextView
    private lateinit var overlay: FrameLayout
    private lateinit var settingsPanel: SettingsPanel
    private lateinit var allApps: AllAppsView

    var motion: Motion = Motion.FULL; private set
    var allEntries: List<AppEntry> = emptyList(); private set
    private var favorites: MutableList<AppEntry> = ArrayList()
    private var inputs: List<TvInputsRepository.Source> = emptyList()
    val inputsFound: Int get() = inputs.size
    private var labels: Map<String, String> = emptyMap()

    private var packageReceiver: BroadcastReceiver? = null
    private var prefsListener: SharedPreferences.OnSharedPreferenceChangeListener? = null
    private var appsDirty = false
    private var resumed = false
    private var firstRender = true
    private var currentWallpaperId: String? = null
    private var move: MoveState? = null
    private var heroText: CharSequence = ""
    private val createdAt = SystemClock.uptimeMillis()

    private val tickReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) { updateDate() }
    }

    private class MoveState(val card: AppCardView, var index: Int, val original: List<String>)

    // ------------------------------------------------------------------ lifecycle

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        app = ClearTvApp.get(this)
        prefs = app.prefs
        repo = app.apps
        wallpapers = app.wallpapers
        inputsRepo = app.inputs
        network = NetworkMonitor(this)
        motion = Ui.motion(prefs)
        labels = SaluteDefaults.labels(this)

        setContentView(R.layout.activity_home)
        content = findViewById(R.id.content)
        wallpaperView = findViewById(R.id.wallpaper)
        scrim = findViewById(R.id.scrim)
        ambient = findViewById(R.id.ambient)
        greeting = findViewById(R.id.greeting)
        clock = findViewById(R.id.clock)
        dateView = findViewById(R.id.date)
        pillInputs = findViewById(R.id.pill_inputs)
        pillNetwork = findViewById(R.id.pill_network)
        settingsButton = findViewById(R.id.pill_settings)
        heroName = findViewById(R.id.hero_name)
        dockBand = findViewById(R.id.dock_band)
        appsRow = findViewById(R.id.apps_row)
        hint = findViewById(R.id.hint)
        overlay = findViewById(R.id.overlay)

        applyFonts()
        for (pill in listOf(pillInputs, pillNetwork, settingsButton)) {
            if (Build.VERSION.SDK_INT >= 26) pill.defaultFocusHighlightEnabled = false
            pill.nextFocusDownId = R.id.apps_row
        }
        settingsPanel = SettingsPanel(this, overlay)
        allApps = AllAppsView(this, overlay)

        settingsButton.setOnClickListener { settingsPanel.toggle() }
        pillInputs.setOnClickListener { showInputsDialog() }
        pillNetwork.setOnClickListener { openNetworkSettings() }
        appsRow.smooth = motion.smoothScroll
        appsRow.onChildFocused = { index, view ->
            val card = view as? AppCardView
            val pkg = card?.entry?.packageName
            if (pkg != null) prefs.lastFocusedPackage = pkg
            showHero(card)
            Logs.event("focus", "row" to "apps", "index" to index, "pkg" to (pkg ?: "all_apps"))
        }

        applyClockMode()
        updateDate()
        applyWallpaper(force = true)
        loadApps()
        loadInputs()

        packageReceiver = repo.registerPackageListener { appsDirty = true; if (resumed) loadApps() }
        prefsListener = prefs.addListener { key -> onPrefChanged(key) }
        prefs.countLaunch()
        applyKeepHomeExtra(intent)
        if (app.safeModeNotice) {
            app.safeModeNotice = false
            Ui.dialog(this).setMessage(R.string.safe_mode_notice).setPositiveButton(R.string.ok, null).show()
        }
        Logs.event("app_start", "launches" to prefs.launchCount, "sinceProcessMs" to (System.currentTimeMillis() - app.startedAt))
    }

    private fun applyFonts() {
        clock.typeface = Fonts.outfit(this, 300)
        greeting.typeface = Fonts.text(this, 500, getString(R.string.greeting_day))
        dateView.typeface = Fonts.text(this, 400, "Я")
        heroName.typeface = Fonts.text(this, 300, "Я")
        for (pill in listOf(pillInputs, pillNetwork, settingsButton)) pill.typeface = Fonts.text(this, 500, pill.text)
    }

    override fun onResume() {
        super.onResume()
        resumed = true
        val tickFilter = IntentFilter().apply {
            addAction(Intent.ACTION_TIME_TICK); addAction(Intent.ACTION_TIME_CHANGED); addAction(Intent.ACTION_TIMEZONE_CHANGED); addAction(Intent.ACTION_DATE_CHANGED)
        }
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(tickReceiver, tickFilter, Context.RECEIVER_NOT_EXPORTED) else registerReceiver(tickReceiver, tickFilter)
        updateDate()
        applyClockMode()
        network.start { updateNetwork(it) }
        if (appsDirty) loadApps()
        val isDefault = repo.isDefaultHome()
        Logs.event("home_resumed", "defaultHome" to isDefault, "home" to (repo.currentHome()?.flattenToShortString() ?: "none"))
        if (!isDefault && prefs.keepHome) HomeKeeper.runAsync(this, "resume", interactive = false)
    }

    override fun onPause() {
        resumed = false
        try { unregisterReceiver(tickReceiver) } catch (_: Throwable) {}
        network.stop()
        super.onPause()
    }

    override fun onDestroy() {
        packageReceiver?.let { try { unregisterReceiver(it) } catch (_: Throwable) {} }
        prefsListener?.let { prefs.removeListener(it) }
        super.onDestroy()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        applyKeepHomeExtra(intent)
        if (intent != null && intent.hasCategory(Intent.CATEGORY_HOME)) {
            Logs.event("home_pressed")
            cancelMove()
            closeOverlays()
            appsRow.scrollToStart()
            appsRow.focusIndex(0)
        }
    }

    /** `am start -n <ClearTV> --ez cleartv.keep_home true|false` lets the PC scripts switch the keeper. */
    private fun applyKeepHomeExtra(intent: Intent?) {
        if (intent == null || !intent.hasExtra(HomeKeeper.EXTRA_KEEP_HOME)) return
        val on = intent.getBooleanExtra(HomeKeeper.EXTRA_KEEP_HOME, false)
        prefs.keepHome = on
        Logs.event("keep_home", "on" to on, "via" to "intent")
        if (on) HomeKeeper.runAsync(this, "intent", interactive = true) { showKeeperResult(it) }
    }

    fun showKeeperResult(outcome: HomeKeeper.Outcome) {
        val text = when (outcome.status) {
            HomeKeeper.Status.RESTORED -> getString(R.string.keeper_result_restored)
            HomeKeeper.Status.ALREADY_HOME -> getString(R.string.keeper_result_already)
            HomeKeeper.Status.ADB_OFF -> getString(R.string.keeper_result_adb_off)
            HomeKeeper.Status.NOT_APPROVED -> getString(R.string.keeper_result_not_approved)
            HomeKeeper.Status.DISABLED -> return
            HomeKeeper.Status.FAILED -> getString(R.string.keeper_result_failed, outcome.detail)
        }
        toast(text)
    }

    // ------------------------------------------------------------------ keys

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val m = move
        if (m != null && isMoveKey(event.keyCode)) {
            if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) handleMoveKey(event.keyCode)
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        when (keyCode) {
            KeyEvent.KEYCODE_MENU -> if (event.repeatCount == 0) {
                if (allApps.isOpen) allApps.hide()
                settingsPanel.toggle()
                return true
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> if (!allApps.isOpen && !settingsPanel.isOpen && focusInDock()) {
                // Nothing lies below the dock: Down slides the grid of every app up.
                if (event.repeatCount == 0) openAllApps()
                return true
            }
            KeyEvent.KEYCODE_DPAD_UP -> if (allApps.isOpen && allApps.isFocusInFirstRow()) {
                if (event.repeatCount == 0) allApps.hide()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun focusInDock(): Boolean {
        var v: View? = currentFocus
        while (v != null) { if (v === appsRow) return true; v = v.parent as? View }
        return false
    }

    @Deprecated("Deprecated in API 33; still the simplest hook for remote BACK on TV")
    override fun onBackPressed() {
        when {
            move != null -> cancelMove()
            settingsPanel.isOpen -> settingsPanel.back()
            allApps.isOpen -> allApps.hide()
            else -> Unit // a HOME activity stays put on BACK
        }
    }

    private fun isMoveKey(code: Int) = when (code) {
        KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT, KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_DPAD_DOWN,
        KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER, KeyEvent.KEYCODE_BUTTON_A,
        KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE -> true
        else -> false
    }

    private fun handleMoveKey(code: Int) {
        when (code) {
            KeyEvent.KEYCODE_DPAD_LEFT -> moveBy(-1)
            KeyEvent.KEYCODE_DPAD_RIGHT -> moveBy(1)
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER, KeyEvent.KEYCODE_BUTTON_A -> commitMove()
            KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE -> cancelMove()
            else -> Unit
        }
    }

    // ------------------------------------------------------------------ apps

    fun reloadApps() { loadApps() }

    private fun loadApps() {
        appsDirty = false
        Async.run({ repo.load() }) { list, error ->
            if (error != null) { Logs.e("app discovery failed", error); return@run }
            val loaded = list ?: emptyList()
            SaluteDefaults.applyFirstRun(this, prefs, loaded.map { it.packageName })
            allEntries = loaded.map { e -> labels[e.packageName]?.let { e.copy(label = it) } ?: e }
            rebuildFavorites()
            if (allApps.isOpen) allApps.update(visibleEntries())
        }
    }

    private fun visibleEntries(): List<AppEntry> {
        val hidden = prefs.hidden
        return allEntries.filter { it.packageName !in hidden }
    }

    private fun rebuildFavorites() {
        val visible = visibleEntries()
        val byPkg = visible.associateBy { it.packageName }
        var order = prefs.favorites
        if (order == null) {
            order = defaultFavorites(visible)
            prefs.favorites = order
            Logs.i("favorites initialised with ${order.size} apps")
        } else {
            val retained = AppOrder.retain(order, byPkg.keys)
            if (retained != order) { order = retained; prefs.favorites = retained }
        }
        favorites = order.mapNotNull { byPkg[it] }.toMutableList()
        Logs.event("favorites", "n" to favorites.size, "visible" to visible.size, "hidden" to prefs.hidden.size)
        renderAppsRow()
    }

    private fun defaultFavorites(visible: List<AppEntry>): List<String> {
        val tv = visible.filter { it.leanback }.map { it.packageName }
        val rest = visible.filter { !it.leanback }.map { it.packageName }
        return (tv + rest).take(DEFAULT_FAVORITES)
    }

    private fun renderAppsRow() {
        val focusedPkg = (currentFocus as? AppCardView)?.entry?.packageName ?: prefs.lastFocusedPackage
        val hadFocus = focusInDock()
        val gap = Ui.dp(this, 16f)
        appsRow.clear()
        for (entry in favorites) {
            val card = newAppCard(AppCardView.Size.LARGE, entry, inRow = true)
            appsRow.add(card, gap)
            loadArtwork(card)
        }
        val more = AppCardView(this, AppCardView.Size.LARGE)
        more.motion = motion
        more.bindSpecial(getString(R.string.all_apps), R.drawable.ic_apps)
        more.showLabel(prefs.showLabels)
        more.setOnClickListener { openAllApps() }
        appsRow.add(more, gap)

        if (firstRender || hadFocus) {
            val index = favorites.indexOfFirst { it.packageName == focusedPkg }
            appsRow.focusIndex(if (index >= 0) index else 0)
        }
        if (firstRender) {
            firstRender = false
            Ui.appear(dockBand, motion, Ui.dpF(this, 18f))
            Logs.event("first_frame", "ms" to (SystemClock.uptimeMillis() - createdAt))
        }
    }

    fun newAppCard(size: AppCardView.Size, entry: AppEntry, inRow: Boolean): AppCardView {
        val card = AppCardView(this, size)
        card.motion = motion
        card.bind(entry)
        card.showLabel(if (inRow) prefs.showLabels else true)
        card.setOnClickListener { launch(entry) }
        card.setOnLongClickListener { showAppMenu(entry, inRow); true }
        return card
    }

    fun loadArtwork(card: AppCardView) {
        val entry = card.entry ?: return
        val scale = minOf(resources.displayMetrics.density, 2f)
        val w = (card.size.wDp * scale).toInt()
        val h = (card.size.hDp * scale).toInt()
        repo.cachedArtwork(entry, w, h)?.let { card.setArtwork(it); if (card.isFocused) showHero(card); return }
        Async.run({ repo.artwork(entry, w, h) }) { bmp: Bitmap?, _ ->
            if (card.entry === entry && bmp != null) { card.setArtwork(bmp); if (card.isFocused) showHero(card) }
        }
    }

    /** Top shelf: the focused card's name and the ambient glow in its colour. */
    private fun showHero(card: AppCardView?) {
        val text: CharSequence = card?.entry?.label ?: card?.label?.text ?: ""
        val accent = card?.entry?.let { repo.accent(it) } ?: Color.rgb(0x2E, 0x34, 0x40)
        ambient.setColor(accent, animate = motion.focusMs > 0)
        if (ambient.alpha < 1f) { if (motion.overlayMs > 0) ambient.animate().alpha(1f).setDuration(500).start() else ambient.alpha = 1f }
        if (text == heroText) return
        heroText = text
        heroName.animate().cancel()
        heroName.typeface = Fonts.text(this, 300, text)
        if (motion.focusMs == 0L) { heroName.text = text; heroName.alpha = 1f; return }
        heroName.animate().alpha(0f).translationY(Ui.dpF(this, 4f)).setDuration(90).withEndAction {
            heroName.text = text
            heroName.translationY = Ui.dpF(this, -6f)
            heroName.animate().alpha(1f).translationY(0f).setDuration(160).setInterpolator(Ui.decelerate).start()
        }.start()
    }

    fun launch(entry: AppEntry) {
        try {
            HomeGuardService.noteUserLaunch(entry.packageName)
            startActivity(repo.launchIntent(entry))
            Logs.event("launch", "pkg" to entry.packageName, "ok" to true)
        } catch (t: Throwable) {
            Logs.event("launch", "pkg" to entry.packageName, "ok" to false, "error" to t.javaClass.simpleName)
            toast(getString(R.string.toast_launch_failed, entry.label))
        }
    }

    fun showAppMenu(entry: AppEntry, inRow: Boolean) {
        val labels = ArrayList<String>()
        val actions = ArrayList<() -> Unit>()
        fun item(label: Int, action: () -> Unit) { labels += getString(label); actions += action }

        item(R.string.menu_open) { launch(entry) }
        val isFavorite = favorites.any { it.packageName == entry.packageName }
        if (inRow) {
            item(R.string.menu_move) { startMove(entry) }
            item(R.string.menu_remove_fav) { setFavorite(entry, false) }
        } else if (isFavorite) {
            item(R.string.menu_remove_fav) { setFavorite(entry, false) }
        } else {
            item(R.string.menu_add_fav) { setFavorite(entry, true) }
        }
        item(R.string.menu_hide) { hideApp(entry) }
        item(R.string.menu_info) { openAppInfo(entry) }
        if (!entry.system) item(R.string.menu_uninstall) { uninstall(entry) }

        Ui.dialog(this).setTitle(entry.label).setItems(labels.toTypedArray()) { _, which -> actions[which]() }.show()
    }

    private fun setFavorite(entry: AppEntry, favorite: Boolean) {
        if (favorite) { if (favorites.none { it.packageName == entry.packageName }) favorites.add(entry) }
        else favorites.removeAll { it.packageName == entry.packageName }
        prefs.favorites = favorites.map { it.packageName }
        Logs.event("favorite", "pkg" to entry.packageName, "on" to favorite)
        renderAppsRow()
        toast(getString(if (favorite) R.string.toast_added_fav else R.string.toast_removed_fav, entry.label))
    }

    private fun hideApp(entry: AppEntry) {
        Logs.event("hide", "pkg" to entry.packageName)
        prefs.hidden = prefs.hidden + entry.packageName   // listener -> rebuildFavorites()
        if (allApps.isOpen) allApps.update(visibleEntries())
        toast(getString(R.string.toast_hidden, entry.label))
    }

    private fun openAppInfo(entry: AppEntry) {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + entry.packageName)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (!startSafely(intent)) toast(getString(R.string.toast_not_available))
    }

    private fun uninstall(entry: AppEntry) {
        val intent = Intent(Intent.ACTION_DELETE, Uri.parse("package:" + entry.packageName)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (!startSafely(intent)) toast(getString(R.string.toast_not_available))
    }

    private fun startSafely(intent: Intent): Boolean = try {
        startActivity(intent); true
    } catch (t: Throwable) {
        Logs.w("startActivity failed for ${intent.action}", t); false
    }

    // ------------------------------------------------------------------ move mode

    private fun startMove(entry: AppEntry) {
        val index = favorites.indexOfFirst { it.packageName == entry.packageName }
        val card = appsRow.childAt(index) as? AppCardView ?: return
        move = MoveState(card, index, favorites.map { it.packageName })
        card.moving = true
        card.requestFocus()
        showHint(getString(R.string.move_hint))
        Logs.event("move_start", "index" to index, "pkg" to entry.packageName)
    }

    /**
     * Swaps the moving card with its neighbour by re-inserting the *neighbour*, so the focused card never
     * leaves the hierarchy (removing a focused view would throw focus elsewhere). Both cards are then slid
     * from their old positions with a translation animation; the layout itself changes instantly.
     */
    private fun moveBy(delta: Int) {
        val m = move ?: return
        val from = m.index
        val to = (from + delta).coerceIn(0, favorites.size - 1)
        if (to == from) return
        val neighbour = appsRow.childAt(to) ?: return
        val entry = favorites.removeAt(from)
        favorites.add(to, entry)
        val lp = neighbour.layoutParams
        appsRow.container.removeView(neighbour)
        appsRow.container.addView(neighbour, from, lp)
        m.index = to
        if (motion.focusMs > 0) {
            val stride = (m.card.width + ((lp as? ViewGroup.MarginLayoutParams)?.marginEnd ?: 0)).toFloat()
            m.card.translationX = -delta * stride
            neighbour.translationX = delta * stride
            m.card.animate().translationX(0f).setDuration(180).setInterpolator(Ui.standard).start()
            neighbour.animate().translationX(0f).setDuration(180).setInterpolator(Ui.standard).start()
        }
        appsRow.post { appsRow.ensureVisible(m.card) }
    }

    private fun commitMove() {
        val m = move ?: return
        prefs.favorites = favorites.map { it.packageName }
        Logs.event("order_saved", "n" to favorites.size, "order" to favorites.joinToString(",") { it.packageName })
        exitMove(m)
        toast(getString(R.string.toast_order_saved))
    }

    private fun cancelMove() {
        val m = move ?: return
        exitMove(m)
        if (favorites.map { it.packageName } != m.original) {
            val byPkg = favorites.associateBy { it.packageName }
            favorites = m.original.mapNotNull { byPkg[it] }.toMutableList()
            renderAppsRow()
            val index = m.original.indexOf(m.card.entry?.packageName)
            if (index >= 0) appsRow.focusIndex(index)
        }
        Logs.event("move_cancel")
    }

    private fun exitMove(m: MoveState) {
        m.card.moving = false
        m.card.translationX = 0f
        hideHint()
        move = null
    }

    // ------------------------------------------------------------------ inputs

    private fun loadInputs() {
        if (!prefs.showInputs) { inputs = emptyList(); renderInputs(); return }
        Async.run({ inputsRepo.list() }) { list, _ ->
            inputs = (list ?: emptyList()).filter { it.resolvable }
            renderInputs()
        }
    }

    private fun renderInputs() {
        pillInputs.visibility = if (inputs.isNotEmpty() && prefs.showInputs) View.VISIBLE else View.GONE
    }

    private fun showInputsDialog() {
        if (inputs.isEmpty()) return
        val names = inputs.map { it.label }.toTypedArray()
        Ui.dialog(this).setTitle(R.string.inputs_title).setItems(names) { _, which ->
            val src = inputs[which]
            val ok = startSafely(src.intent)
            Logs.event("input_launch", "id" to src.id, "ok" to ok)
            if (!ok) toast(getString(R.string.toast_input_failed))
        }.show()
    }

    // ------------------------------------------------------------------ wallpaper / clock / network

    private fun applyWallpaper(force: Boolean = false) {
        val id = prefs.wallpaperId
        if (!force && id == currentWallpaperId) return
        currentWallpaperId = id
        val wp = wallpapers.find(id)
        if (wp.black) {
            wallpaperView.setImageDrawable(null)
            wallpaperView.visibility = View.GONE
            scrim.visibility = View.GONE
            Logs.event("wallpaper", "id" to wp.id)
            return
        }
        val size = Point()
        windowManager.defaultDisplay.getRealSize(size)
        val w = minOf(size.x, 1920).coerceAtLeast(1)
        val h = minOf(size.y, 1080).coerceAtLeast(1)
        Async.run({ wallpapers.decode(wp, w, h) }) { bmp, _ ->
            if (bmp != null) setWallpaperBitmap(bmp)
            else if (id != Prefs.DEFAULT_WALLPAPER) prefs.wallpaperId = Prefs.DEFAULT_WALLPAPER
        }
    }

    private fun setWallpaperBitmap(bmp: Bitmap) {
        scrim.visibility = View.VISIBLE
        wallpaperView.visibility = View.VISIBLE
        if (wallpaperView.drawable == null || motion.overlayMs == 0L) {
            wallpaperView.setImageBitmap(bmp)
            if (motion.overlayMs > 0L) { wallpaperView.alpha = 0f; wallpaperView.animate().alpha(1f).setDuration(400).start() } else wallpaperView.alpha = 1f
        } else {
            wallpaperView.animate().alpha(0f).setDuration(150).withEndAction {
                wallpaperView.setImageBitmap(bmp)
                wallpaperView.animate().alpha(1f).setDuration(300).start()
            }.start()
        }
    }

    private fun applyClockMode() {
        val pattern = prefs.clockMode.timePattern(DateFormat.is24HourFormat(this))
        clock.format12Hour = pattern
        clock.format24Hour = pattern
    }

    private fun updateDate() {
        val locale = Locale.getDefault()
        val pattern = DateFormat.getBestDateTimePattern(locale, "EEEEdMMMM")
        dateView.text = SimpleDateFormat(pattern, locale).format(Date())
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        greeting.text = getString(when (hour) {
            in 5..11 -> R.string.greeting_morning
            in 12..17 -> R.string.greeting_day
            in 18..22 -> R.string.greeting_evening
            else -> R.string.greeting_night
        })
    }

    private fun updateNetwork(status: NetworkMonitor.Status) {
        val (icon, label) = when (status.transport) {
            NetworkMonitor.Transport.WIFI -> R.drawable.ic_wifi to R.string.net_wifi
            NetworkMonitor.Transport.ETHERNET -> R.drawable.ic_ethernet to R.string.net_ethernet
            NetworkMonitor.Transport.OTHER -> R.drawable.ic_network to R.string.net_other
            NetworkMonitor.Transport.NONE -> R.drawable.ic_no_network to R.string.net_none
        }
        pillNetwork.setCompoundDrawablesRelativeWithIntrinsicBounds(icon, 0, 0, 0)
        var text = getString(label)
        if (status.transport != NetworkMonitor.Transport.NONE && !status.validated) text += " · " + getString(R.string.net_no_internet)
        pillNetwork.text = text
    }

    private fun openNetworkSettings() {
        val candidates = listOf(Intent(Settings.ACTION_WIFI_SETTINGS), Intent(Settings.ACTION_WIRELESS_SETTINGS), Intent(Settings.ACTION_SETTINGS))
        for (intent in candidates) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (repo.resolves(intent) && startSafely(intent)) return
        }
        openSystemSettings()
    }

    private fun onPrefChanged(key: String) {
        when (key) {
            Prefs.K_WALLPAPER -> applyWallpaper()
            Prefs.K_CLOCK -> applyClockMode()
            Prefs.K_LABELS -> forEachCard { it.showLabel(prefs.showLabels) }
            Prefs.K_INPUTS -> loadInputs()
            Prefs.K_HIDDEN -> rebuildFavorites()
            Prefs.K_REDUCED_MOTION -> {
                motion = Ui.motion(prefs)
                appsRow.smooth = motion.smoothScroll
                forEachCard { it.motion = motion }
            }
        }
    }

    private fun forEachCard(action: (AppCardView) -> Unit) {
        for (i in 0 until appsRow.count) (appsRow.childAt(i) as? AppCardView)?.let(action)
    }

    // ------------------------------------------------------------------ overlays & helpers used by panels

    private fun openAllApps() { allApps.show(visibleEntries()) }

    private fun closeOverlays() {
        if (settingsPanel.isOpen) settingsPanel.close()
        if (allApps.isOpen) allApps.hide()
    }

    fun setMainFocusBlocked(blocked: Boolean) {
        content.descendantFocusability = if (blocked) ViewGroup.FOCUS_BLOCK_DESCENDANTS else ViewGroup.FOCUS_AFTER_DESCENDANTS
    }

    fun onOverlayClosed() {
        if (!settingsPanel.isOpen && !allApps.isOpen) overlay.visibility = View.GONE
    }

    fun openSystemSettings() {
        val candidates = listOf(
            Intent(Settings.ACTION_SETTINGS),
            Intent().setClassName("com.android.tv.settings", "com.android.tv.settings.MainSettings"),
            Intent().setClassName("com.android.settings", "com.android.settings.Settings"),
        )
        for (intent in candidates) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (repo.resolves(intent) && startSafely(intent)) { Logs.event("system_settings", "ok" to true, "via" to (intent.action ?: intent.component?.flattenToShortString())); return }
        }
        Logs.event("system_settings", "ok" to false)
        toast(getString(R.string.toast_not_available))
    }

    fun openHomeSettings() {
        if (repo.isDefaultHome()) { toast(getString(R.string.home_is_default)); return }
        val candidates = ArrayList<Intent>()
        candidates += Intent(Settings.ACTION_HOME_SETTINGS)
        candidates += Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
        for (intent in candidates) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (repo.resolves(intent) && startSafely(intent)) { Logs.event("home_settings", "ok" to true, "via" to intent.action); return }
        }
        Logs.event("home_settings", "ok" to false)
        Ui.dialog(this).setTitle(R.string.settings_home).setMessage(getString(R.string.home_action_hint, packageName + "/" + HomeActivity::class.java.name)).setPositiveButton(R.string.ok, null).show()
    }

    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (!(repo.resolves(intent) && startSafely(intent))) toast(getString(R.string.toast_not_available))
    }

    fun openDreamSettings() {
        val intent = Intent(Settings.ACTION_DREAM_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (!(repo.resolves(intent) && startSafely(intent))) toast(getString(R.string.toast_not_available))
    }

    fun homeStatusText(): String {
        val home: ComponentName? = repo.currentHome()
        return when {
            home == null -> getString(R.string.home_unknown)
            home.packageName == packageName -> getString(R.string.home_is_default)
            else -> getString(R.string.home_not_default, home.packageName)
        }
    }

    fun versionText(): String = try {
        val info = packageManager.getPackageInfo(packageName, 0)
        @Suppress("DEPRECATION")
        getString(R.string.about_version, info.versionName ?: "?", info.versionCode)
    } catch (t: Throwable) { "" }

    fun isHomeGuardEnabledInSystem(): Boolean {
        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: return false
        return enabled.split(':').any { it.startsWith("$packageName/") && it.contains("HomeGuardService") }
    }

    fun currentScreensaver(): String? = try { Settings.Secure.getString(contentResolver, "screensaver_components") } catch (t: Throwable) { null }
    fun isClearDreamSelected(): Boolean = currentScreensaver()?.split(',')?.any { it.startsWith("$packageName/") } ?: false

    fun canPickDocument(): Boolean = repo.resolves(pickIntent())

    private fun pickIntent(): Intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "image/*"
    }

    fun pickWallpaper() {
        try { startActivityForResult(pickIntent(), REQ_PICK) } catch (t: Throwable) { toast(getString(R.string.toast_not_available)) }
    }

    @Deprecated("Deprecated in API 33; the result API lives in AndroidX which this project avoids on purpose")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_PICK || resultCode != RESULT_OK) return
        val uri = data?.data ?: return
        Async.run({ wallpapers.importFrom(uri) }) { wp, _ ->
            if (wp != null) { prefs.wallpaperId = wp.id; settingsPanel.refresh() } else toast(getString(R.string.toast_not_available))
        }
    }

    fun diagnosticsText(): String {
        val dm = resources.displayMetrics
        val real = Point().also { windowManager.defaultDisplay.getRealSize(it) }
        val sb = StringBuilder()
        sb.append("ClearTV ").append(versionText()).append('\n')
        sb.append("Device: ").append(Build.MANUFACTURER).append(' ').append(Build.MODEL).append(" (").append(Build.DEVICE).append(")\n")
        sb.append("Android ").append(Build.VERSION.RELEASE).append(" / API ").append(Build.VERSION.SDK_INT).append('\n')
        sb.append("Build: ").append(Build.DISPLAY).append('\n')
        sb.append("Display: ").append(real.x).append('x').append(real.y).append(" px, density ").append(dm.densityDpi).append(" dpi (").append(dm.density).append("x), window ").append(dm.widthPixels).append('x').append(dm.heightPixels).append('\n')
        sb.append("Leanback feature: ").append(packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK)).append('\n')
        sb.append("Default HOME: ").append(repo.currentHome()?.flattenToShortString() ?: "none").append('\n')
        sb.append("HOME candidates: ").append(repo.homeCandidates().joinToString { it.packageName }).append('\n')
        sb.append("Apps: ").append(allEntries.size).append(" total, ").append(allEntries.count { it.leanback }).append(" leanback, ")
            .append(allEntries.count { !it.leanback && it.entry == "launcher" }).append(" launcher, ")
            .append(allEntries.count { it.entry != "leanback" && it.entry != "launcher" }).append(" vendor (").append(allEntries.filter { it.entry != "leanback" && it.entry != "launcher" }.map { it.entry }.distinct().joinToString()).append("), favourites ")
            .append(favorites.size).append(", hidden ").append(prefs.hidden.size).append('\n')
        sb.append("Salute TV detected: ").append(SaluteDefaults.detected(this, allEntries.map { it.packageName })).append('\n')
        sb.append("Network: ").append(network.current()).append('\n')
        sb.append("Inputs (resolvable): ").append(inputs.size).append('\n')
        sb.append(inputsRepo.diagnostics()).append('\n')
        sb.append("Document picker: ").append(canPickDocument()).append('\n')
        sb.append("Wallpaper folder: ").append(wallpapers.userDir().absolutePath).append('\n')
        sb.append("Home guard (accessibility): ").append(isHomeGuardEnabledInSystem()).append('\n')
        sb.append("Screensaver components: ").append(currentScreensaver() ?: "none").append('\n')
        sb.append("Home keeper last outcome: ").append(HomeKeeper.lastOutcome ?: "never ran").append('\n')
        sb.append("Prefs: ").append(prefs.summary()).append('\n')
        sb.append("Crash history: ").append(prefs.crashHistory.size).append('\n')
        sb.append("\n--- recent log ---\n")
        Logs.snapshot().takeLast(60).forEach { sb.append(it).append('\n') }
        return sb.toString()
    }

    private fun showHint(text: CharSequence) {
        hint.text = text
        Ui.appear(hint, motion, Ui.dpF(this, -8f))
    }

    private fun hideHint() { Ui.disappear(hint, motion) }

    private fun toast(text: CharSequence) { Toast.makeText(this, text, Toast.LENGTH_SHORT).show() }

    companion object {
        private const val DEFAULT_FAVORITES = 10
        private const val REQ_PICK = 41
    }
}
