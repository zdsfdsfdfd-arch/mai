package com.cleartv.launcher.ui

import android.animation.LayoutTransition
import android.app.Activity
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
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
import android.widget.ImageButton
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
import com.cleartv.launcher.data.NetworkMonitor
import com.cleartv.launcher.data.Prefs
import com.cleartv.launcher.data.TvInputsRepository
import com.cleartv.launcher.data.WallpaperRepository
import com.cleartv.launcher.util.Async
import com.cleartv.launcher.util.Logs
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The home screen: clock, favourites row, optional HDMI inputs row, "all apps" grid and settings sheet.
 *
 * Everything is driven by D-pad focus. The activity never finishes on BACK (that is what a HOME activity
 * does), and the HOME key, when ClearTV is the default launcher, brings the row back to its first card.
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
    private lateinit var clock: TextClock
    private lateinit var dateView: TextView
    private lateinit var netIcon: ImageView
    private lateinit var netLabel: TextView
    lateinit var settingsButton: ImageButton; private set
    private lateinit var inputsTitle: TextView
    private lateinit var inputsRow: FocusRow
    private lateinit var appsTitle: TextView
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

    private var packageReceiver: BroadcastReceiver? = null
    private var prefsListener: SharedPreferences.OnSharedPreferenceChangeListener? = null
    private var appsDirty = false
    private var resumed = false
    private var firstRender = true
    private var currentWallpaperId: String? = null
    private var move: MoveState? = null
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

        setContentView(R.layout.activity_home)
        content = findViewById(R.id.content)
        wallpaperView = findViewById(R.id.wallpaper)
        clock = findViewById(R.id.clock)
        dateView = findViewById(R.id.date)
        netIcon = findViewById(R.id.net_icon)
        netLabel = findViewById(R.id.net_label)
        settingsButton = findViewById(R.id.settings_button)
        inputsTitle = findViewById(R.id.inputs_title)
        inputsRow = findViewById(R.id.inputs_row)
        appsTitle = findViewById(R.id.apps_title)
        appsRow = findViewById(R.id.apps_row)
        hint = findViewById(R.id.hint)
        overlay = findViewById(R.id.overlay)
        if (Build.VERSION.SDK_INT >= 26) settingsButton.defaultFocusHighlightEnabled = false

        settingsPanel = SettingsPanel(this, overlay)
        allApps = AllAppsView(this, overlay)

        settingsButton.setOnClickListener { settingsPanel.toggle() }
        appsRow.smooth = motion.smoothScroll
        inputsRow.smooth = motion.smoothScroll
        appsRow.onChildFocused = { index, view ->
            val pkg = (view as? AppCardView)?.entry?.packageName
            if (pkg != null) prefs.lastFocusedPackage = pkg
            Logs.event("focus", "row" to "apps", "index" to index, "pkg" to (pkg ?: "all_apps"))
        }
        inputsRow.onChildFocused = { index, _ -> Logs.event("focus", "row" to "inputs", "index" to index) }

        applyClockMode()
        updateDate()
        applyWallpaper(force = true)
        loadApps()
        loadInputs()

        packageReceiver = repo.registerPackageListener { appsDirty = true; if (resumed) loadApps() }
        prefsListener = prefs.addListener { key -> onPrefChanged(key) }
        prefs.countLaunch()
        if (app.safeModeNotice) {
            app.safeModeNotice = false
            Ui.dialog(this).setMessage(R.string.safe_mode_notice).setPositiveButton(R.string.ok, null).show()
        }
        Logs.event("app_start", "launches" to prefs.launchCount, "sinceProcessMs" to (System.currentTimeMillis() - app.startedAt))
    }

    override fun onResume() {
        super.onResume()
        resumed = true
        registerReceiver(tickReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_TIME_TICK); addAction(Intent.ACTION_TIME_CHANGED); addAction(Intent.ACTION_TIMEZONE_CHANGED); addAction(Intent.ACTION_DATE_CHANGED)
        })
        updateDate()
        applyClockMode()
        network.start { updateNetwork(it) }
        if (appsDirty) loadApps()
        Logs.event("home_resumed", "defaultHome" to repo.isDefaultHome(), "home" to (repo.currentHome()?.flattenToShortString() ?: "none"))
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
        if (intent != null && intent.hasCategory(Intent.CATEGORY_HOME)) {
            Logs.event("home_pressed")
            cancelMove()
            closeOverlays()
            appsRow.scrollToStart()
            appsRow.focusIndex(0)
        }
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
        if (keyCode == KeyEvent.KEYCODE_MENU && event.repeatCount == 0) {
            if (allApps.isOpen) allApps.hide()
            settingsPanel.toggle()
            return true
        }
        return super.onKeyDown(keyCode, event)
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
            allEntries = list ?: emptyList()
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
        val hadFocus = currentFocus?.let { it === appsRow || appsRow.container.indexOfChild(it) >= 0 } ?: false
        val gap = Ui.dp(this, 18f)
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
            Ui.appear(appsRow, motion, Ui.dpF(this, 18f))
            Logs.event("first_frame", "ms" to (SystemClock.uptimeMillis() - createdAt))
        }
    }

    fun newAppCard(size: AppCardView.Size, entry: AppEntry, inRow: Boolean): AppCardView {
        val card = AppCardView(this, size)
        card.motion = motion
        card.bind(entry)
        card.showLabel(prefs.showLabels)
        card.setOnClickListener { launch(entry) }
        card.setOnLongClickListener { showAppMenu(entry, inRow); true }
        return card
    }

    fun loadArtwork(card: AppCardView) {
        val entry = card.entry ?: return
        val scale = minOf(resources.displayMetrics.density, 2f)
        val w = (card.size.wDp * scale).toInt()
        val h = (card.size.hDp * scale).toInt()
        repo.cachedArtwork(entry, w, h)?.let { card.setArtwork(it); return }
        Async.run({ repo.artwork(entry, w, h) }) { bmp: Bitmap?, _ -> if (card.entry === entry && bmp != null) card.setArtwork(bmp) }
    }

    fun launch(entry: AppEntry) {
        try {
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
        prefs.hidden = prefs.hidden + entry.packageName
        Logs.event("hide", "pkg" to entry.packageName)
        rebuildFavorites()
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
        appsRow.container.layoutTransition = if (motion.focusMs > 0) LayoutTransition().apply {
            enableTransitionType(LayoutTransition.CHANGING)
            setDuration(180)
        } else null
        showHint(getString(R.string.move_hint))
        Logs.event("move_start", "index" to index, "pkg" to entry.packageName)
    }

    private fun moveBy(delta: Int) {
        val m = move ?: return
        val to = (m.index + delta).coerceIn(0, favorites.size - 1)
        if (to == m.index) return
        val entry = favorites.removeAt(m.index)
        favorites.add(to, entry)
        val lp = m.card.layoutParams
        appsRow.container.removeView(m.card)
        appsRow.container.addView(m.card, to, lp)
        m.index = to
        m.card.requestFocus()
        appsRow.post { appsRow.scrollToIndex(to) }
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
        appsRow.container.layoutTransition = null
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
        val show = inputs.isNotEmpty() && prefs.showInputs
        inputsTitle.visibility = if (show) View.VISIBLE else View.GONE
        inputsRow.visibility = if (show) View.VISIBLE else View.GONE
        inputsRow.clear()
        if (!show) return
        val gap = Ui.dp(this, 14f)
        for (src in inputs) {
            val card = AppCardView(this, AppCardView.Size.SMALL)
            card.motion = motion
            card.bindSpecial(src.label, if (src.hdmi) R.drawable.ic_hdmi else R.drawable.ic_input)
            card.setOnClickListener {
                val ok = startSafely(src.intent)
                Logs.event("input_launch", "id" to src.id, "ok" to ok)
                if (!ok) toast(getString(R.string.toast_input_failed))
            }
            inputsRow.add(card, gap)
        }
    }

    // ------------------------------------------------------------------ wallpaper / clock / network

    private fun applyWallpaper(force: Boolean = false) {
        val id = prefs.wallpaperId
        if (!force && id == currentWallpaperId) return
        currentWallpaperId = id
        val wp = wallpapers.find(id)
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
        val text = SimpleDateFormat(pattern, locale).format(Date())
        dateView.text = if (text.isEmpty()) text else text.substring(0, 1).uppercase(locale) + text.substring(1)
    }

    private fun updateNetwork(status: NetworkMonitor.Status) {
        val (icon, label) = when (status.transport) {
            NetworkMonitor.Transport.WIFI -> R.drawable.ic_wifi to R.string.net_wifi
            NetworkMonitor.Transport.ETHERNET -> R.drawable.ic_ethernet to R.string.net_ethernet
            NetworkMonitor.Transport.OTHER -> R.drawable.ic_network to R.string.net_other
            NetworkMonitor.Transport.NONE -> R.drawable.ic_no_network to R.string.net_none
        }
        netIcon.setImageResource(icon)
        var text = getString(label)
        if (status.transport != NetworkMonitor.Transport.NONE && !status.validated) text += " · " + getString(R.string.net_no_internet)
        netLabel.text = text
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
                inputsRow.smooth = motion.smoothScroll
                forEachCard { it.motion = motion }
            }
        }
    }

    private fun forEachCard(action: (AppCardView) -> Unit) {
        for (row in listOf(appsRow, inputsRow)) for (i in 0 until row.count) (row.childAt(i) as? AppCardView)?.let(action)
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
        sb.append("Apps: ").append(allEntries.size).append(" total, ").append(allEntries.count { it.leanback }).append(" leanback, favourites ").append(favorites.size).append(", hidden ").append(prefs.hidden.size).append('\n')
        sb.append("Network: ").append(network.current()).append('\n')
        sb.append("Inputs (resolvable): ").append(inputs.size).append('\n')
        sb.append(inputsRepo.diagnostics()).append('\n')
        sb.append("Document picker: ").append(canPickDocument()).append('\n')
        sb.append("Wallpaper folder: ").append(wallpapers.userDir().absolutePath).append('\n')
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
