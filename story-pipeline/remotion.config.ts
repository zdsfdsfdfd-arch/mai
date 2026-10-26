import { Config } from "@remotion/cli/config";

// Chromium, предустановленный в окружении; в проде Remotion скачает свой Chrome Headless Shell.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
