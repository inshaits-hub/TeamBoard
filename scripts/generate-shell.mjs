import { readdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const clientDir = join(process.cwd(), "dist", "client");
const assetsDir = join(clientDir, "assets");

const files = readdirSync(assetsDir);

const mainScript = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const stylesheet = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!mainScript) {
  throw new Error("Could not find main entry script in dist/client/assets");
}
if (!stylesheet) {
  throw new Error("Could not find stylesheet in dist/client/assets");
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Team Task Board</title>
    <meta name="description" content="A pastel-themed team task board with glass UI." />
    <meta name="author" content="Team" />
    <meta property="og:title" content="Team Task Board" />
    <meta property="og:description" content="A pastel-themed team task board with glass UI." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="stylesheet" href="assets/${stylesheet}" />
    <link rel="icon" href="favicon.png" type="image/png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="assets/${mainScript}"></script>
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html, "utf8");
copyFileSync(join(clientDir, "index.html"), join(clientDir, "404.html"));

console.log(`Generated dist/client/index.html (script: ${mainScript}, styles: ${stylesheet})`);
console.log("Copied to dist/client/404.html for SPA routing fallback");