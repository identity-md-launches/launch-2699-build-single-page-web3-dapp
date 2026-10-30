import { readdir, lstat, readFile } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
const groups = [
  { name: "export", paths: ["dist"], budget: 4194304 },
  { name: "assets", paths: ["public"], budget: 524288 },
  {
    name: "source",
    paths: ["pages", "components", "lib", "styles"],
    budget: 524288,
  },
  {
    name: "tooling",
    paths: [
      "scripts",
      "tests",
      "package.json",
      "package-lock.json",
      "next.config.ts",
      "next-env.d.ts",
      "postcss.config.mjs",
      "tsconfig.json",
    ],
    budget: 524288,
  },
  {
    name: "evidence",
    paths: ["artifacts", "README.md", "DESIGN.md", ".gitignore"],
    budget: 2621440,
  },
];
async function size(path) {
  const info = await lstat(path);
  if (info.isSymbolicLink()) throw Error("No symlinks in the submission");
  if (info.isFile()) return info.size;
  let bytes = 0;
  for (const e of await readdir(path, { withFileTypes: true })) {
    assert.ok(
      !["node_modules", ".next", ".cache"].includes(e.name),
      `Unexpected generated directory ${path}/${e.name}`,
    );
    assert.ok(
      !/\.(tgz|map|tsbuildinfo)$/.test(e.name),
      `Unexpected packaging/cache file ${e.name}`,
    );
    bytes += await size(join(path, e.name));
  }
  return bytes;
}
let total = 0;
for (const group of groups) {
  let bytes = 0;
  for (const path of group.paths) bytes += await size(path);
  assert.ok(
    bytes <= group.budget,
    `${group.name} exceeds its explicit path budget`,
  );
  total += bytes;
  console.log(`${group.name}: ${bytes} / ${group.budget} bytes`);
}
assert.ok(total <= 8388608);
console.log(`Total: ${total} / 8388608 bytes`);
const html = await readFile("dist/index.html", "utf8");
for (const pattern of [
  /<title\b[^>]*>\s*PLEA/,
  /name="description"/,
  /property="og:title"/,
  /property="og:image"/,
  /rel="icon"/,
])
  assert.match(html, pattern);
assert.ok(
  !/(?:src|href)="\/(?!\/)/.test(html),
  "Root-relative resource URLs are unsuitable for gateway subpaths",
);
assert.ok(
  !html.includes("/tmp/plea") && !html.includes("/root/"),
  "No build-machine paths in HTML",
);
console.log(
  "Static export metadata, asset URL and submission budget checks passed.",
);
