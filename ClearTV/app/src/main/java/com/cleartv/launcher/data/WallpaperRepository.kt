package com.cleartv.launcher.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.cleartv.launcher.R
import com.cleartv.launcher.util.Logs
import java.io.File
import java.io.FileOutputStream

/**
 * Wallpapers come from two places: a few bundled, deliberately quiet backgrounds, and a user folder
 * (`Android/data/com.cleartv.launcher/files/wallpapers`) that needs no storage permission and can be
 * filled with `adb push` (see `scripts/install.ps1 -Wallpapers`) or through the system document picker.
 */
class WallpaperRepository(private val context: Context) {

    data class Wallpaper(val id: String, val title: String, val resId: Int = 0, val file: File? = null, val black: Boolean = false) {
        val bundled: Boolean get() = resId != 0 || black
    }

    val bundled: List<Wallpaper> = listOf(
        Wallpaper(BLACK, context.getString(R.string.wp_black), black = true),
        Wallpaper("bundled:graphite", context.getString(R.string.wp_graphite), R.drawable.wp_graphite),
        Wallpaper("bundled:deep", context.getString(R.string.wp_deep), R.drawable.wp_deep),
        Wallpaper("bundled:ember", context.getString(R.string.wp_ember), R.drawable.wp_ember),
        Wallpaper("bundled:forest", context.getString(R.string.wp_forest), R.drawable.wp_forest),
    )

    fun userDir(): File {
        val dir = context.getExternalFilesDir("wallpapers") ?: File(context.filesDir, "wallpapers")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun all(): List<Wallpaper> {
        val files = userDir().listFiles { f -> f.isFile && f.extension.lowercase() in EXTENSIONS }
            ?.sortedBy { it.name.lowercase() }
            ?.map { Wallpaper("file:" + it.absolutePath, it.nameWithoutExtension, file = it) }
            ?: emptyList()
        return bundled + files
    }

    fun find(id: String): Wallpaper = all().firstOrNull { it.id == id } ?: bundled.first()

    /** Blocking decode scaled to roughly [reqW]x[reqH]; never larger than needed to save memory. */
    fun decode(wp: Wallpaper, reqW: Int, reqH: Int): Bitmap? {
        if (wp.black) return null
        val started = System.nanoTime()
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        decodeWith(wp, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= reqW && bounds.outHeight / (sample * 2) >= reqH) sample *= 2
        val opts = BitmapFactory.Options().apply {
            inSampleSize = sample
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        val bmp = decodeWith(wp, opts)
        Logs.event("wallpaper", "id" to wp.id, "w" to bmp?.width, "h" to bmp?.height, "ms" to (System.nanoTime() - started) / 1_000_000)
        return bmp
    }

    private fun decodeWith(wp: Wallpaper, opts: BitmapFactory.Options): Bitmap? = try {
        if (wp.bundled) BitmapFactory.decodeResource(context.resources, wp.resId, opts)
        else BitmapFactory.decodeFile(wp.file!!.absolutePath, opts)
    } catch (t: Throwable) {
        Logs.w("wallpaper decode failed for ${wp.id}", t); null
    }

    /** Copies the picked document into the user folder so it survives without persisted URI grants. */
    fun importFrom(uri: Uri): Wallpaper? {
        try {
            val type = context.contentResolver.getType(uri) ?: "image/jpeg"
            val ext = when {
                type.contains("png") -> "png"
                type.contains("webp") -> "webp"
                else -> "jpg"
            }
            val target = File(userDir(), "import-" + System.currentTimeMillis() + "." + ext)
            val input = context.contentResolver.openInputStream(uri) ?: return null
            input.use { FileOutputStream(target).use { out -> it.copyTo(out) } }
            return Wallpaper("file:" + target.absolutePath, target.nameWithoutExtension, file = target)
        } catch (t: Throwable) {
            Logs.w("wallpaper import failed", t)
            return null
        }
    }

    fun delete(wp: Wallpaper): Boolean = wp.file?.delete() ?: false

    companion object {
        const val BLACK = "bundled:black"
        private val EXTENSIONS = setOf("jpg", "jpeg", "png", "webp")
    }
}
