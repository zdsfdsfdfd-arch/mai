import { defineConfig } from 'vite';

/**
 * Makes the build open straight from disk (double-click dist/index.html):
 * browsers refuse ES-module scripts and CORS-mode requests on file:// pages,
 * so the bundle is emitted as a classic IIFE script without `crossorigin`.
 */
const openFromDisk = () => ({
  name: 'open-from-disk',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html) =>
      html
        .replace(/<script type="module" crossorigin src=/g, '<script defer src=')
        .replace(/ crossorigin(?=[\s>])/g, ''),
  },
});

// Relative base: the built deck works from any folder, USB stick or static host.
export default defineConfig({
  base: './',
  plugins: [openFromDisk()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    modulePreload: false,
    target: 'es2020',
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true },
    },
  },
  server: { host: true, port: 5173 },
});
