// Контрольные кадры: по одному на сцену (на 60 % длительности) для визуальной проверки без полного рендера.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeline = JSON.parse(fs.readFileSync(path.join(root, "episode/timeline.json"), "utf8"));
const outDir = path.join(root, "out/stills");
fs.mkdirSync(outDir, { recursive: true });

const at = Number(process.env.STILL_AT ?? 0.6);
const browserExecutable = process.env.REMOTION_BROWSER || null;

const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), webpackOverride: (c) => c });
const composition = await selectComposition({ serveUrl, id: "Episode", inputProps: { timeline }, browserExecutable });

for (const s of timeline.scenes) {
  const frame = s.startFrame + Math.floor(s.durationFrames * at);
  const output = path.join(outDir, `${s.id}_${s.type}.png`);
  await renderStill({ composition, serveUrl, output, frame, inputProps: { timeline }, browserExecutable, imageFormat: "png" });
  console.log(`${s.id} ${s.type} frame ${frame} → ${path.relative(root, output)}`);
}
