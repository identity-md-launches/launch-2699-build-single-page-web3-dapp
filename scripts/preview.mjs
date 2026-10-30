import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const base = resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = resolve(
      base,
      "." + decodeURIComponent(url.pathname.replace(/^\/preview/, "")),
    );
    if (!path.startsWith(base + "/") && path !== base)
      throw new Error("Invalid path");
    if ((await stat(path)).isDirectory()) path += "/index.html";
    res.setHeader(
      "Content-Type",
      types[extname(path)] || "application/octet-stream",
    );
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
const port = Number(process.argv[2] || 4173);
server.listen(port, "0.0.0.0", () =>
  console.log(`PLEA preview: http://localhost:${port}/preview/`),
);
