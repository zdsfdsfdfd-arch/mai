package com.cleartv.launcher.data

import android.content.Context
import android.content.Intent
import android.media.tv.TvContract
import android.media.tv.TvInputInfo
import android.media.tv.TvInputManager
import com.cleartv.launcher.util.Logs

/**
 * Physical inputs (HDMI, AV, tuner pass-through) exposed by the firmware through [TvInputManager].
 *
 * Switching to an input is done the standard Android TV way: an ACTION_VIEW intent for the input's
 * pass-through channel URI, which the system Live TV / input application handles. Whether such a handler
 * exists is firmware-specific, so every source carries a [Source.resolvable] flag and the row is hidden
 * when nothing can be launched. The findings are logged for `compatibility.md`.
 */
class TvInputsRepository(private val context: Context) {

    data class Source(val id: String, val label: String, val hdmi: Boolean, val intent: Intent, val resolvable: Boolean)

    fun available(): Boolean = context.getSystemService(Context.TV_INPUT_SERVICE) is TvInputManager

    /** Blocking; cheap, but keep it off the main thread at start-up. */
    fun list(): List<Source> {
        val tim = context.getSystemService(Context.TV_INPUT_SERVICE) as? TvInputManager ?: return emptyList()
        val inputs: List<TvInputInfo> = try { tim.tvInputList ?: emptyList() } catch (t: Throwable) { Logs.w("tvInputList failed", t); emptyList() }
        val pm = context.packageManager
        val sources = inputs.filter { it.isPassthroughInput }.map { info ->
            val intent = Intent(Intent.ACTION_VIEW, TvContract.buildChannelUriForPassthroughInput(info.id))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            val label = try { info.loadLabel(context)?.toString()?.trim() } catch (t: Throwable) { null }
            val resolvable = try { pm.resolveActivity(intent, 0) != null } catch (t: Throwable) { false }
            Source(
                id = info.id,
                label = if (label.isNullOrEmpty()) shortName(info.id) else label,
                hdmi = info.type == TvInputInfo.TYPE_HDMI,
                intent = intent,
                resolvable = resolvable,
            )
        }.sortedWith(Comparator { a, b -> a.label.compareTo(b.label, ignoreCase = true) })
        Logs.event("inputs", "total" to inputs.size, "passthrough" to sources.size, "resolvable" to sources.count { it.resolvable })
        return sources
    }

    fun diagnostics(): String {
        val tim = context.getSystemService(Context.TV_INPUT_SERVICE) as? TvInputManager
            ?: return "TvInputManager: not available on this device"
        val inputs = try { tim.tvInputList ?: emptyList() } catch (t: Throwable) { return "TvInputManager: error $t" }
        if (inputs.isEmpty()) return "TvInputManager: no inputs reported"
        return inputs.joinToString("\n") { info ->
            "${info.id} type=${info.type} passthrough=${info.isPassthroughInput} label=${try { info.loadLabel(context) } catch (t: Throwable) { "?" }}"
        }
    }

    private fun shortName(id: String): String = id.substringAfterLast('/').ifEmpty { id }
}
