package com.cleartv.launcher.ui

import android.content.Context
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build

/**
 * Typography. The clock and Latin text use Outfit (SIL OFL 1.1, bundled as a variable font in assets);
 * where Outfit has no glyphs (Cyrillic UI) the text falls back to the system family at a matching weight,
 * so Russian labels never mix two fonts inside one word.
 */
object Fonts {
    private const val PATH = "fonts/Outfit.ttf"
    private val cache = HashMap<Int, Typeface>()
    private var cyrillic: Boolean? = null

    /** Outfit at [weight] (100..900); on API 24/25, where variable axes are unavailable, a system family. */
    fun outfit(context: Context, weight: Int): Typeface {
        cache[weight]?.let { return it }
        val t = if (Build.VERSION.SDK_INT >= 26) {
            try {
                Typeface.Builder(context.assets, PATH).setFontVariationSettings("'wght' $weight").build() ?: system(weight)
            } catch (t: Throwable) { system(weight) }
        } else system(weight)
        cache[weight] = t
        return t
    }

    /** Outfit when it can draw the text, otherwise the system family: pass a sample of the text to render. */
    fun text(context: Context, weight: Int, sample: CharSequence): Typeface {
        if (sample.any { it.code in 0x0400..0x04FF }) {
            if (cyrillic == null) cyrillic = try { Paint().apply { typeface = outfit(context, 400) }.hasGlyph("Ж") } catch (t: Throwable) { false }
            if (cyrillic != true) return system(weight)
        }
        return outfit(context, weight)
    }

    fun system(weight: Int): Typeface = when {
        weight <= 200 -> Typeface.create("sans-serif-thin", Typeface.NORMAL)
        weight <= 300 -> Typeface.create("sans-serif-light", Typeface.NORMAL)
        weight < 500 -> Typeface.create("sans-serif", Typeface.NORMAL)
        else -> Typeface.create("sans-serif-medium", Typeface.NORMAL)
    }
}
