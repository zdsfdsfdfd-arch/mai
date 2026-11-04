package com.cleartv.launcher.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import com.cleartv.launcher.util.Async
import com.cleartv.launcher.util.Logs

/** Reports the active network's transport (Wi-Fi / Ethernet) and whether it has validated internet access. */
class NetworkMonitor(context: Context) {

    enum class Transport { NONE, WIFI, ETHERNET, OTHER }
    data class Status(val transport: Transport, val validated: Boolean)

    private val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    private var callback: ConnectivityManager.NetworkCallback? = null
    private var last: Status? = null

    fun current(): Status {
        val manager = cm ?: return Status(Transport.NONE, false)
        val network = manager.activeNetwork ?: return Status(Transport.NONE, false)
        val caps = manager.getNetworkCapabilities(network) ?: return Status(Transport.NONE, false)
        return from(caps)
    }

    fun start(listener: (Status) -> Unit) {
        stop()
        val cb = object : ConnectivityManager.NetworkCallback() {
            override fun onCapabilitiesChanged(network: Network, caps: NetworkCapabilities) {
                Async.ui { deliver(from(caps), listener) }
            }
            override fun onLost(network: Network) {
                Async.ui { deliver(current(), listener) }
            }
        }
        try { cm?.registerDefaultNetworkCallback(cb); callback = cb } catch (t: Throwable) { Logs.w("network callback registration failed", t) }
        deliver(current(), listener)
    }

    fun stop() {
        callback?.let { try { cm?.unregisterNetworkCallback(it) } catch (_: Throwable) {} }
        callback = null
    }

    private fun deliver(status: Status, listener: (Status) -> Unit) {
        if (status != last) {
            last = status
            Logs.event("network", "transport" to status.transport, "validated" to status.validated)
        }
        listener(status)
    }

    private fun from(caps: NetworkCapabilities): Status {
        val transport = when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> Transport.ETHERNET
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> Transport.WIFI
            else -> Transport.OTHER
        }
        return Status(transport, caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED))
    }
}
