package com.cleartv.launcher.guard

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import com.cleartv.launcher.ClearTvApp
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

    private var homePackages: Set<String> = emptySet()
    private var homePackagesAt = 0L
    private var lastBounceAt = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        serviceInfo = (serviceInfo ?: AccessibilityServiceInfo()).apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 100
        }
        Logs.event("home_guard", "connected" to true)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg == packageName) return
        val app = ClearTvApp.get(this)
        if (!app.prefs.homeGuard) return
        val now = SystemClock.uptimeMillis()
        if (now - homePackagesAt > 60_000L) {
            homePackages = app.apps.homeCandidates().map { it.packageName }.toSet() - packageName
            homePackagesAt = now
        }
        if (pkg !in homePackages) return
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
