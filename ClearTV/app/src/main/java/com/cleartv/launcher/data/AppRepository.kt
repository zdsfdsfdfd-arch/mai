package com.cleartv.launcher.data

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.util.LruCache
import com.cleartv.launcher.R
import com.cleartv.launcher.ui.Fonts
import com.cleartv.launcher.util.Logs
import java.text.Collator
import java.util.Locale

/**
 * Discovers launchable applications through [PackageManager] and renders their artwork.
 *
 * TV applications ship a 16:9 banner (`android:banner`); everything else gets a card composed of the app
 * icon on a background tinted with the icon's dominant colour. Rendered cards are cached in an LRU cache
 * bounded by bytes so memory stays predictable on 1 GB devices.
 */
class AppRepository(private val context: Context) {
    private val pm: PackageManager = context.packageManager
    private val maxCacheBytes = 24 * 1024 * 1024
    private val artwork = object : LruCache<String, Bitmap>(maxCacheBytes) {
        override fun sizeOf(key: String, value: Bitmap): Int = value.byteCount
    }

    @Volatile var cached: List<AppEntry> = emptyList()
        private set

    /** Blocking; call from a background thread. */
    fun load(): List<AppEntry> {
        val started = System.nanoTime()
        val self = context.packageName
        val result = LinkedHashMap<String, AppEntry>()

        fun query(category: String, leanback: Boolean) {
            val intent = Intent(Intent.ACTION_MAIN).addCategory(category)
            val infos = try { pm.queryIntentActivities(intent, 0) } catch (t: Throwable) { Logs.w("queryIntentActivities failed", t); emptyList() }
            for (ri in infos) {
                val ai = ri.activityInfo ?: continue
                if (ai.packageName == self || result.containsKey(ai.packageName)) continue
                val label = try { ri.loadLabel(pm)?.toString()?.trim() } catch (t: Throwable) { null }
                result[ai.packageName] = AppEntry(
                    packageName = ai.packageName,
                    component = ComponentName(ai.packageName, ai.name),
                    label = if (label.isNullOrEmpty()) ai.packageName else label,
                    leanback = leanback,
                    system = (ai.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0,
                )
            }
        }
        query(Intent.CATEGORY_LEANBACK_LAUNCHER, leanback = true)
        query(Intent.CATEGORY_LAUNCHER, leanback = false)
        queryVendorEntries(result, self)
        appendWebFallbacks(result)

        val collator = Collator.getInstance(Locale.getDefault())
        val comparator = Comparator<AppEntry> { a, b -> collator.compare(a.label, b.label) }
        val list = result.values.sortedWith(comparator)
        cached = list
        Logs.event("apps_loaded", "total" to list.size, "leanback" to list.count { it.leanback }, "ms" to (System.nanoTime() - started) / 1_000_000)
        return list
    }

    /**
     * Apps that declare neither LAUNCHER nor LEANBACK_LAUNCHER but a vendor category on their MAIN activity
     * (Salute TV's own apps only carry STAR_LAUNCHER). An intent with no category matches every MAIN filter,
     * and GET_RESOLVED_FILTER tells which category it was.
     */
    private fun queryVendorEntries(result: LinkedHashMap<String, AppEntry>, self: String) {
        val infos = try { pm.queryIntentActivities(Intent(Intent.ACTION_MAIN), PackageManager.GET_RESOLVED_FILTER) } catch (t: Throwable) { emptyList() }
        for (ri in infos) {
            val ai = ri.activityInfo ?: continue
            if (ai.packageName == self || result.containsKey(ai.packageName) || !ai.exported) continue
            val filter = ri.filter ?: continue
            var vendor: String? = null
            var home = false
            for (i in 0 until filter.countCategories()) {
                val c = filter.getCategory(i) ?: continue
                if (c == Intent.CATEGORY_HOME) home = true
                if (c in STANDARD_CATEGORIES) continue
                if (!c.startsWith("android.intent.category.") || c.endsWith("LAUNCHER")) vendor = c
            }
            if (home || vendor == null) continue
            val label = try { ri.loadLabel(pm)?.toString()?.trim() } catch (t: Throwable) { null }
            result[ai.packageName] = AppEntry(
                packageName = ai.packageName,
                component = ComponentName(ai.packageName, ai.name),
                label = if (label.isNullOrEmpty()) ai.packageName else label,
                leanback = false,
                system = (ai.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0,
                entry = vendor.substringAfterLast('.'),
            )
        }
    }

    /**
     * Web versions of services whose app cannot be installed on this TV (res/values/favorites.xml → web_fallbacks).
     * They exist only when a browser can open https addresses; the home screen shows one only while the preferred
     * rule for that service finds no real app.
     */
    private fun appendWebFallbacks(result: LinkedHashMap<String, AppEntry>) {
        val browser = try { pm.resolveActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.example.com/")), PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo } catch (t: Throwable) { null } ?: return
        val component = ComponentName(browser.packageName, browser.name)
        for (line in context.resources.getStringArray(R.array.web_fallbacks)) {
            val parts = line.split('=')
            if (parts.size < 4) continue
            val id = "web:" + parts[0].trim()
            val color = try { Color.parseColor("#" + parts[3].trim()) } catch (t: Throwable) { FALLBACK }
            result[id] = AppEntry(packageName = id, component = component, label = parts[1].trim(), leanback = false, system = false,
                entry = AppEntry.WEB, url = parts[2].trim(), color = color)
        }
    }

    private val accents = HashMap<String, Int>()

    /** Dominant colour of the app's card, known once its artwork has been rendered. */
    fun accent(entry: AppEntry): Int? = synchronized(accents) { accents[entry.packageName] }

    fun launchIntent(entry: AppEntry): Intent {
        if (entry.isWeb) {
            // Pin the browser found at discovery time: a chooser dialog is not usable from a TV remote.
            return Intent(Intent.ACTION_VIEW, Uri.parse(entry.url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                .addCategory(Intent.CATEGORY_BROWSABLE).setPackage(entry.component.packageName)
        }
        val intent = pm.getLeanbackLaunchIntentForPackage(entry.packageName)
            ?: pm.getLaunchIntentForPackage(entry.packageName)
            ?: Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER).setComponent(entry.component)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        return intent
    }

    fun cachedArtwork(entry: AppEntry, w: Int, h: Int): Bitmap? = artwork.get(key(entry, w, h))

    /** Blocking; renders (or returns the cached) card bitmap for [entry]. */
    fun artwork(entry: AppEntry, w: Int, h: Int): Bitmap {
        val key = key(entry, w, h)
        artwork.get(key)?.let { return it }
        val bitmap = render(entry, w, h)
        artwork.put(key, bitmap)
        return bitmap
    }

    fun clearArtwork() = artwork.evictAll()

    private fun key(entry: AppEntry, w: Int, h: Int) = entry.packageName + '|' + w + 'x' + h

    private fun render(entry: AppEntry, w: Int, h: Int): Bitmap {
        val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        if (entry.isWeb) {
            renderWebCard(canvas, entry, w, h)
            synchronized(accents) { accents[entry.packageName] = entry.color ?: FALLBACK }
            return bitmap
        }
        val banner = loadBanner(entry)
        if (banner != null && banner.intrinsicWidth > 0 && banner.intrinsicHeight > 0) {
            drawCenterCrop(canvas, banner, w, h)
            synchronized(accents) { accents[entry.packageName] = dominantColor(bitmap) }
            return bitmap
        }
        val icon = loadIcon(entry)
        val base = dominantColor(icon)
        synchronized(accents) { accents[entry.packageName] = base }
        canvas.drawColor(darken(base))
        // soft highlight so flat cards do not look dead
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(28, 255, 255, 255) }
        canvas.drawRoundRect(RectF(-w * 0.2f, -h * 0.9f, w * 0.8f, h * 0.55f), h * 0.6f, h * 0.6f, paint)
        if (icon != null) {
            val size = (h * 0.58f).toInt()
            val left = (w - size) / 2
            val top = (h - size) / 2
            icon.setBounds(left, top, left + size, top + size)
            icon.draw(canvas)
        }
        return bitmap
    }

    /** Brand-coloured card with the service name and an honest "web version" line; no logos are copied. */
    private fun renderWebCard(canvas: Canvas, entry: AppEntry, w: Int, h: Int) {
        val base = entry.color ?: FALLBACK
        val hsv = FloatArray(3)
        Color.colorToHSV(base, hsv)
        hsv[2] = (hsv[2] * 0.62f).coerceIn(0.16f, 0.6f)
        canvas.drawColor(Color.HSVToColor(hsv))
        val glow = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.argb(34, 255, 255, 255) }
        canvas.drawRoundRect(RectF(-w * 0.2f, -h * 0.9f, w * 0.8f, h * 0.55f), h * 0.6f, h * 0.6f, glow)
        val title = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE; textSize = h * 0.24f; textAlign = Paint.Align.CENTER
            typeface = try { Fonts.text(context, 600, entry.label) } catch (t: Throwable) { null }
        }
        var size = h * 0.24f
        while (size > h * 0.12f && title.measureText(entry.label) > w * 0.86f) { size -= h * 0.02f; title.textSize = size }
        canvas.drawText(entry.label, w / 2f, h * 0.56f, title)
        val sub = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.argb(190, 255, 255, 255); textSize = h * 0.10f; textAlign = Paint.Align.CENTER
            typeface = try { Fonts.text(context, 500, "Я") } catch (t: Throwable) { null }
        }
        canvas.drawText(context.getString(R.string.web_card_subtitle), w / 2f, h * 0.80f, sub)
    }

    private fun loadBanner(entry: AppEntry): Drawable? = try {
        pm.getActivityInfo(entry.component, 0).loadBanner(pm) ?: pm.getApplicationInfo(entry.packageName, 0).loadBanner(pm)
    } catch (t: Throwable) { null }

    private fun loadIcon(entry: AppEntry): Drawable? = try {
        pm.getActivityIcon(entry.component)
    } catch (t: Throwable) {
        try { pm.getApplicationIcon(entry.packageName) } catch (t2: Throwable) { null }
    }

    private fun drawCenterCrop(canvas: Canvas, d: Drawable, w: Int, h: Int) {
        val scale = maxOf(w.toFloat() / d.intrinsicWidth, h.toFloat() / d.intrinsicHeight)
        val dw = (d.intrinsicWidth * scale).toInt()
        val dh = (d.intrinsicHeight * scale).toInt()
        val left = (w - dw) / 2
        val top = (h - dh) / 2
        d.setBounds(left, top, left + dw, top + dh)
        d.draw(canvas)
    }

    /** Average colour of the icon's opaque pixels, weighted towards saturated ones; falls back to graphite. */
    private fun dominantColor(d: Drawable?): Int {
        if (d == null) return FALLBACK
        return try {
            val sample = Bitmap.createBitmap(SAMPLE, SAMPLE, Bitmap.Config.ARGB_8888)
            val c = Canvas(sample)
            d.setBounds(0, 0, SAMPLE, SAMPLE)
            d.draw(c)
            dominantColor(sample, recycle = true)
        } catch (t: Throwable) { FALLBACK }
    }

    private fun dominantColor(source: Bitmap, recycle: Boolean = false): Int {
        return try {
            val sample = if (source.width == SAMPLE && source.height == SAMPLE) source else Bitmap.createScaledBitmap(source, SAMPLE, SAMPLE, true)
            var r = 0.0; var g = 0.0; var b = 0.0; var weight = 0.0
            val hsv = FloatArray(3)
            val px = IntArray(SAMPLE * SAMPLE)
            sample.getPixels(px, 0, SAMPLE, 0, 0, SAMPLE, SAMPLE)
            for (p in px) {
                if (Color.alpha(p) < 128) continue
                Color.colorToHSV(p, hsv)
                val wgt = 0.15 + hsv[1] * (if (hsv[2] in 0.15f..0.95f) 1.0 else 0.3)
                r += Color.red(p) * wgt; g += Color.green(p) * wgt; b += Color.blue(p) * wgt; weight += wgt
            }
            if (sample !== source || recycle) sample.recycle()
            if (weight <= 0) FALLBACK else Color.rgb((r / weight).toInt(), (g / weight).toInt(), (b / weight).toInt())
        } catch (t: Throwable) { FALLBACK }
    }

    private fun darken(color: Int): Int {
        val hsv = FloatArray(3)
        Color.colorToHSV(color, hsv)
        hsv[1] = (hsv[1] * 0.75f).coerceIn(0f, 0.7f)
        hsv[2] = (hsv[2] * 0.42f).coerceIn(0.14f, 0.34f)
        return Color.HSVToColor(hsv)
    }

    /** Registers for package changes; returns the receiver so the caller can unregister it. */
    fun registerPackageListener(onChange: (String?) -> Unit): BroadcastReceiver {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                val pkg = intent.data?.schemeSpecificPart
                Logs.d("package change: ${intent.action} $pkg")
                onChange(pkg)
            }
        }
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_PACKAGE_ADDED)
            addAction(Intent.ACTION_PACKAGE_REMOVED)
            addAction(Intent.ACTION_PACKAGE_CHANGED)
            addAction(Intent.ACTION_PACKAGE_REPLACED)
            addAction(Intent.ACTION_PACKAGE_FULLY_REMOVED)
            addDataScheme("package")
        }
        if (Build.VERSION.SDK_INT >= 33) {
            context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(receiver, filter)
        }
        return receiver
    }

    /** The activity the system currently resolves for HOME, or null when there is no default (chooser). */
    fun currentHome(): ComponentName? {
        val ri = pm.resolveActivity(homeIntent(), PackageManager.MATCH_DEFAULT_ONLY) ?: return null
        val ai = ri.activityInfo ?: return null
        if (ai.packageName == "android") return null // ResolverActivity: no default chosen
        return ComponentName(ai.packageName, ai.name)
    }

    fun isDefaultHome(): Boolean = currentHome()?.packageName == context.packageName

    fun homeCandidates(): List<ComponentName> =
        try { pm.queryIntentActivities(homeIntent(), 0).mapNotNull { it.activityInfo?.let { ai -> ComponentName(ai.packageName, ai.name) } } }
        catch (t: Throwable) { emptyList() }

    fun resolves(intent: Intent): Boolean = try { pm.resolveActivity(intent, 0) != null } catch (t: Throwable) { false }

    private fun homeIntent() = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)

    companion object {
        private const val SAMPLE = 24
        private val FALLBACK = Color.rgb(0x2A, 0x2E, 0x34)
        private val STANDARD_CATEGORIES = setOf(
            Intent.CATEGORY_DEFAULT, Intent.CATEGORY_LAUNCHER, Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_HOME,
            Intent.CATEGORY_INFO, "android.intent.category.CAR_LAUNCHER", "android.intent.category.LAUNCHER_APP",
        )
    }
}
