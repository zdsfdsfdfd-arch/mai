package com.cleartv.launcher.guard

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.os.SystemClock
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent
import com.cleartv.launcher.ClearTvApp
import com.cleartv.launcher.data.HomeKeeper
import com.cleartv.launcher.ui.HomeActivity
import com.cleartv.launcher.util.Logs

/**
 * Accessibility service that brings ClearTV back whenever another HOME application (the firmware's launcher)
 * comes to the foreground on its own, e.g. after the firmware resets the HOME choice at boot. It reads no
 * screen content (canRetrieveWindowContent is off); it only sees window-state events. The user enables it once
 * in Settings → Accessibility, or scripts/clean.ps1 -HomeGuard does it via ADB. Apps the user opened from
 * ClearTV deliberately are left alone for 15 seconds.
 */
class HomeGuardService : AccessibilityService() {

    private var homeClasses: Map<String, Set<String>> = emptyMap()   // package -> HOME activity class names
    private var homePackagesAt = 0L
    private var lastBounceAt = 0L
    private var lastResolverAt = 0L
    private var foregroundPkg: String? = null
    private val mouse by lazy { VirtualMouse(this) }

    override fun onServiceConnected() {
        super.onServiceConnected()
        serviceInfo = (serviceInfo ?: AccessibilityServiceInfo()).apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 100
            flags = flags or AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS   // virtual mouse (needs canRequestFilterKeyEvents in the XML)
        }
        Logs.event("home_guard", "connected" to true, "keyFilter" to ((serviceInfo?.flags ?: 0) and AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS != 0))
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        foregroundPkg = pkg
        if (pkg == packageName) { if (mouse.active) mouse.deactivate(); return }
        val app = ClearTvApp.get(this)
        if (!app.prefs.homeGuard) return
        if (app.prefs.safeMode || app.prefs.crashedRecently()) return   // a crashing ClearTV must never fight the TV
        val now = SystemClock.uptimeMillis()
        if (pkg == "android" && event.className?.toString()?.contains("ResolverActivity") == true) {
            // The firmware dropped the HOME choice (it does so when the HOME app is updated): the chooser is on screen.
            // The keeper puts ClearTV back through the TV's own ADB, if the owner enabled it and approved the key.
            if (app.prefs.keepHome && now - lastResolverAt > 30_000L) { lastResolverAt = now; HomeKeeper.runAsync(this, "resolver", interactive = false) }
            return
        }
        if (now - homePackagesAt > 60_000L) {
            // Only the HOME activities themselves: com.android.tv.settings also owns FallbackHome, and bouncing its
            // Settings screens locked the owner out of system settings (seen on a real TV).
            homeClasses = app.apps.homeCandidates().filter { it.packageName != packageName }
                .groupBy({ it.packageName }, { it.className }).mapValues { it.value.toSet() }
            homePackagesAt = now
        }
        val cls = event.className?.toString() ?: return
        if (homeClasses[pkg]?.contains(cls) != true) return
        if (now - (userLaunches[pkg] ?: 0L) < USER_LAUNCH_GRACE_MS) return
        if (now - lastBounceAt < 3_000L) return
        lastBounceAt = now
        Logs.event("home_guard", "bounced" to pkg)
        try {
            startActivity(Intent(this, HomeActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                .putExtra(EXTRA_FROM_GUARD, true))
        } catch (t: Throwable) {
            Logs.w("home guard could not start ClearTV", t)
        }
    }

    /** Every key goes through here first (FLAG_REQUEST_FILTER_KEY_EVENTS); the virtual mouse decides, everything else passes. */
    override fun onKeyEvent(event: KeyEvent): Boolean {
        return try {
            mouse.onKey(event, foregroundIsOwn = foregroundPkg == packageName, enabled = ClearTvApp.get(this).prefs.virtualMouse)
        } catch (t: Throwable) {
            Logs.w("virtual mouse key handling", t); false
        }
    }

    override fun onUnbind(intent: Intent?): Boolean { try { mouse.deactivate() } catch (_: Throwable) {}; return super.onUnbind(intent) }
    override fun onDestroy() { try { mouse.deactivate() } catch (_: Throwable) {}; super.onDestroy() }

    override fun onInterrupt() {}

    companion object {
        const val EXTRA_FROM_GUARD = "cleartv.from_guard"
        private const val USER_LAUNCH_GRACE_MS = 15_000L
        private val userLaunches = HashMap<String, Long>()

        /** Called by the launcher when the user opens an app on purpose, so the guard does not bounce it. */
        fun noteUserLaunch(packageName: String) {
            synchronized(userLaunches) { userLaunches[packageName] = SystemClock.uptimeMillis() }
        }
    }
}
