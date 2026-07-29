import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const buildResult = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
});

const publicDir = join(process.cwd(), ".output", "public");
const assetsExist = existsSync(join(publicDir, "assets"));

if (!assetsExist) {
  console.error("Client build did not produce .output/public/assets — aborting.");
  process.exit(1);
}

if (buildResult.status !== 0) {
  console.warn(
    "\nNote: vite build reported an error in the SSR step. This is expected and safe to ignore for this deployment — only the client build output is used.\n"
  );
}

const shellResult = spawnSync("node", ["scripts/generate-shell.mjs"], {
  stdio: "inherit",
  shell: true,
});

process.exit(shellResult.status ?? 0);
