import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
await rm("dist", { recursive: true, force: true });
await cp("out", "dist", { recursive: true });
// Next emits /_next URLs in its route-data JSON even with an assetPrefix.
// This single-page export resolves all runtime assets from the current directory.
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(html|json|js|css)$/.test(entry.name)) {
      const source = await readFile(path, "utf8");
      let fixed = source.replace(/(["'])\/_next\//g, "$1./_next/");
      if (entry.name.endsWith(".html"))
        fixed = fixed.replace(
          /<link\b(?=[^>]*rel="preconnect")(?=[^>]*href="\/")[^>]*\/?>/g,
          "",
        );
      if (entry.name.endsWith(".css"))
        fixed = fixed.replace(
          /url\(["']?(?:\.\/)?_next\/static\/media\//g,
          "url(../media/",
        );
      if (source !== fixed) await writeFile(path, fixed);
    }
  }
}
await walk("dist");
// Source maps are not required by the exported application.
async function clean(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await clean(path);
    else if (entry.name.endsWith(".map")) await rm(path);
  }
}
await clean("dist");
// Webpack has emitted the runtime font copies in _next/static/media.
// Keep original sources in public/ and licenses in dist/, without duplicate font payloads.
for (const file of [
  "dist/fonts/inter-latin.woff2",
  "dist/fonts/space-grotesk-latin.woff2",
  "dist/og-image.svg",
])
  await rm(file, { force: true });
console.log("Static export ready: dist/index.html (relative assets).");
