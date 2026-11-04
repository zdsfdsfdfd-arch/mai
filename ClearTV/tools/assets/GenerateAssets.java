/*
 * Generates ClearTV's raster assets (launcher icons, TV banner, bundled wallpapers) with plain Java2D so the
 * project needs no binary files that cannot be reviewed. Run: java tools/assets/GenerateAssets.java app/src/main/res
 */
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.Random;

public class GenerateAssets {
    static final Color BG0 = new Color(0x16191D), BG1 = new Color(0x0E1013), FG = new Color(0xF2F4F7);

    public static void main(String[] args) throws Exception {
        File res = new File(args.length > 0 ? args[0] : "app/src/main/res");
        icon(new File(res, "mipmap-hdpi/ic_launcher.png"), 72);
        icon(new File(res, "mipmap-xhdpi/ic_launcher.png"), 96);
        icon(new File(res, "mipmap-xxhdpi/ic_launcher.png"), 144);
        icon(new File(res, "mipmap-xxxhdpi/ic_launcher.png"), 192);
        banner(new File(res, "drawable-xhdpi/banner.png"), 320, 180);
        banner(new File(res, "drawable-xxhdpi/banner.png"), 480, 270);
        wallpaper(new File(res, "drawable-nodpi/wp_graphite.jpg"), new int[]{0x0F1114, 0x1A1E24}, new float[][]{{0.25f, 0.18f, 0.62f}, {0.85f, 0.92f, 0.55f}}, new int[]{0x2F3744, 0x20252C}, new float[]{0.55f, 0.40f}, 0x3C4654, 0.10f, 0.22f, 0.15f);
        wallpaper(new File(res, "drawable-nodpi/wp_deep.jpg"), new int[]{0x070B14, 0x0D1524}, new float[][]{{0.72f, 0.28f, 0.60f}, {0.18f, 0.88f, 0.55f}}, new int[]{0x1B3356, 0x0C2A4B}, new float[]{0.60f, 0.45f}, 0x2E78A6, 0.16f, 0.76f, 0.24f);
        wallpaper(new File(res, "drawable-nodpi/wp_ember.jpg"), new int[]{0x110D0B, 0x1B1310}, new float[][]{{0.18f, 0.86f, 0.70f}, {0.70f, 0.22f, 0.55f}}, new int[]{0x7A3C1C, 0x3A2418}, new float[]{0.55f, 0.40f}, 0xE08A42, 0.13f, 0.16f, 0.90f);
        wallpaper(new File(res, "drawable-nodpi/wp_forest.jpg"), new int[]{0x080E0C, 0x0E1915}, new float[][]{{0.76f, 0.80f, 0.62f}, {0.22f, 0.26f, 0.55f}}, new int[]{0x1D4A39, 0x12302A}, new float[]{0.55f, 0.42f}, 0x3C9A74, 0.11f, 0.80f, 0.84f);
        System.out.println("assets generated in " + res.getAbsolutePath());
    }

    static Graphics2D g(BufferedImage img) {
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        return g;
    }

    /** Rounded graphite tile with a thin TV glyph: a screen outline and a stand. */
    static void icon(File out, int size) throws Exception {
        out.getParentFile().mkdirs();
        BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = g(img);
        float r = size * 0.22f;
        g.setPaint(new GradientPaint(0, 0, new Color(0x1C2027), 0, size, BG1));
        g.fill(new RoundRectangle2D.Float(0, 0, size, size, r, r));
        g.setColor(new Color(255, 255, 255, 26));
        g.setStroke(new BasicStroke(Math.max(1f, size * 0.012f)));
        g.draw(new RoundRectangle2D.Float(0.5f, 0.5f, size - 1, size - 1, r, r));
        tvGlyph(g, size * 0.5f, size * 0.49f, size * 0.60f, size * 0.052f);
        g.dispose();
        ImageIO.write(img, "png", out);
    }

    static void tvGlyph(Graphics2D g, float cx, float cy, float w, float stroke) {
        float h = w * 0.60f;
        float x = cx - w / 2, y = cy - h / 2 - stroke * 0.6f;
        g.setColor(FG);
        g.setStroke(new BasicStroke(stroke, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g.draw(new RoundRectangle2D.Float(x, y, w, h, w * 0.14f, w * 0.14f));
        float sy = y + h + stroke * 1.9f;
        g.draw(new Line2D.Float(cx - w * 0.22f, sy, cx + w * 0.22f, sy));
        g.fill(new Ellipse2D.Float(cx - stroke * 0.7f, cy - stroke * 0.7f - stroke * 0.6f, stroke * 1.4f, stroke * 1.4f));
    }

    /** 16:9 TV banner: glyph on the left, wordmark on the right. */
    static void banner(File out, int w, int h) throws Exception {
        out.getParentFile().mkdirs();
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = g(img);
        g.setPaint(new GradientPaint(0, 0, new Color(0x1B1F26), w, h, BG1));
        g.fillRect(0, 0, w, h);
        g.setPaint(new RadialGradientPaint(new Point2D.Float(w * 0.15f, h * 0.2f), w * 0.7f, new float[]{0f, 1f}, new Color[]{new Color(255, 255, 255, 22), new Color(255, 255, 255, 0)}));
        g.fillRect(0, 0, w, h);
        tvGlyph(g, w * 0.235f, h * 0.5f, h * 0.42f, h * 0.036f);
        Font font = pickFont(new String[]{"Inter SemiBold", "Inter", "Roboto Medium", "SansSerif"}, Font.PLAIN, Math.round(h * 0.235f));
        g.setFont(font);
        g.setColor(FG);
        String text = "ClearTV";
        FontMetrics fm = g.getFontMetrics();
        float tx = w * 0.40f;
        float ty = h * 0.5f + (fm.getAscent() - fm.getDescent()) / 2f;
        g.drawString(text, tx, ty);
        g.dispose();
        ImageIO.write(img, "png", out);
    }

    static Font pickFont(String[] names, int style, int size) {
        java.util.Set<String> available = new java.util.HashSet<>(java.util.Arrays.asList(GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames()));
        for (String n : names) if (available.contains(n)) return new Font(n, style, size);
        return new Font(Font.SANS_SERIF, style, size);
    }

    /**
     * Quiet "cinematic" background: a dark vertical base gradient, two large soft light pools, one small
     * warm/cool accent, a gentle vignette and a touch of noise so 8-bit gradients do not band on TV panels.
     */
    static void wallpaper(File out, int[] base, float[][] pools, int[] poolColors, float[] poolAlpha, int accent, float accentAlpha, float ax, float ay) throws Exception {
        out.getParentFile().mkdirs();
        int w = 1920, h = 1080;
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = g(img);
        g.setPaint(new GradientPaint(0, 0, new Color(base[1]), 0, h, new Color(base[0])));
        g.fillRect(0, 0, w, h);
        for (int i = 0; i < pools.length; i++) {
            Color c = new Color(poolColors[i]);
            Color c0 = new Color(c.getRed(), c.getGreen(), c.getBlue(), Math.round(255 * poolAlpha[i]));
            Color c1 = new Color(c.getRed(), c.getGreen(), c.getBlue(), 0);
            g.setPaint(new RadialGradientPaint(new Point2D.Float(w * pools[i][0], h * pools[i][1]), w * pools[i][2], new float[]{0f, 0.55f, 1f}, new Color[]{c0, new Color(c.getRed(), c.getGreen(), c.getBlue(), Math.round(255 * poolAlpha[i] * 0.35f)), c1}));
            g.fillRect(0, 0, w, h);
        }
        Color a = new Color(accent);
        g.setPaint(new RadialGradientPaint(new Point2D.Float(w * ax, h * ay), w * 0.28f, new float[]{0f, 1f}, new Color[]{new Color(a.getRed(), a.getGreen(), a.getBlue(), Math.round(255 * accentAlpha)), new Color(a.getRed(), a.getGreen(), a.getBlue(), 0)}));
        g.fillRect(0, 0, w, h);
        g.setPaint(new RadialGradientPaint(new Point2D.Float(w * 0.5f, h * 0.5f), w * 0.75f, new float[]{0f, 0.6f, 1f}, new Color[]{new Color(0, 0, 0, 0), new Color(0, 0, 0, 30), new Color(0, 0, 0, 95)}));
        g.fillRect(0, 0, w, h);
        g.dispose();
        Random rnd = new Random(42);
        for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) {
            int rgb = img.getRGB(x, y);
            int n = rnd.nextInt(5) - 2;
            int r = clamp(((rgb >> 16) & 255) + n), gg = clamp(((rgb >> 8) & 255) + n), b = clamp((rgb & 255) + n);
            img.setRGB(x, y, (r << 16) | (gg << 8) | b);
        }
        writeJpeg(img, out, 0.86f);
    }

    static int clamp(int v) { return v < 0 ? 0 : Math.min(255, v); }

    static void writeJpeg(BufferedImage img, File out, float quality) throws Exception {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam p = writer.getDefaultWriteParam();
        p.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        p.setCompressionQuality(quality);
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(img, null, null), p);
        }
        writer.dispose();
    }
}
