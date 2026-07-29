import { readdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), ".output", "public");
const assetsDir = join(publicDir, "assets");

const files = readdirSync(assetsDir);

const mainScript = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const stylesheet = files.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!mainScript) {
  throw new Error("Could not find main entry script in .output/public/assets");
}
if (!stylesheet) {
  throw new Error("Could not find stylesheet in .output/public/assets");
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Task Board — Homepage Design</title>
    <meta name="description" content="A responsive Kanban and list task board for managing design projects." />
    <meta name="author" content="Team" />
    <meta property="og:title" content="Task Board — Homepage Design" />
    <meta property="og:description" content="A responsive Kanban and list task board for managing design projects." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="stylesheet" href="assets/${stylesheet}" />
    <link rel="icon" href="favicon.ico" type="image/x-icon" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="assets/${mainScript}"></script>
  </body>
</html>
`;

writeFileSync(join(publicDir, "index.html"), html, "utf8");
copyFileSync(join(publicDir, "index.html"), join(publicDir, "404.html"));

console.log(`Generated .output/public/index.html (script: ${mainScript}, styles: ${stylesheet})`);
console.log("Copied to .output/public/404.html for SPA routing fallback");
