import { spawnSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const assetsDir = join(distDir, "assets");

const buildResult = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: false,
});

if (!existsSync(assetsDir)) {
  console.error("Build did not produce dist/assets — aborting.");
  process.exit(1);
}

if (buildResult.status !== 0) {
  process.exit(buildResult.status);
}

copyFileSync(join(distDir, "index.html"), join(distDir, "404.html"));
console.log("Copied index.html to 404.html for SPA routing fallback");
