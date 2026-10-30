import { chromium, webkit } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { checkWallets } from "./check-wallets.mjs";
import { checkKeyboard } from "./check-keyboard.mjs";
import { checkPresentation } from "./check-presentation.mjs";
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
// A bounded test server: all assets must work under an arbitrary gateway subpath.
const base = resolve("dist"),
  mount = "/review/plea";
const output = resolve("test/scratch/browser-validation");
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
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (!pathname.startsWith(mount + "/")) throw Error("Outside mount");
    let path = resolve(
      base,
      "." + decodeURIComponent(pathname.slice(mount.length)),
    );
    if (!path.startsWith(base + "/") && path !== base)
      throw Error("Invalid path");
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
await mkdir(output, { recursive: true });
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}${mount}/`;
const reports = [],
  browsers = process.argv.includes("--chromium-only")
    ? [["chromium", chromium]]
    : [
        ["chromium", chromium],
        ["webkit", webkit],
      ];
const text =
  "My rent is due and my landlord will not accept conviction as payment. The rest stays with the swarm.";
const screenshot = async (page, name) =>
  page.screenshot({ path: `${output}/${name}.png`, fullPage: false });
try {
  for (const [name, engine] of browsers) {
    let browser;
    try {
      browser = await engine.launch({ headless: true });
    } catch (error) {
      reports.push({
        browser: name,
        status: "unavailable",
        error: String(error),
      });
      console.log(`${name}: unavailable`);
      continue;
    }
    const errors = [],
      failed = [],
      external = [],
      checks = [],
      metrics = [],
      limitations = [];
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await context.route("**/*", (route) => {
      const target = new URL(route.request().url());
      if (
        target.origin !== new URL(url).origin &&
        /^https?:$/.test(target.protocol)
      ) {
        external.push(target.origin);
        return route.abort();
      }
      return route.continue();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        failed.push({ status: response.status(), url: response.url() });
    });
    const check = (label) => {
      checks.push(label);
      console.log(`${name}: ${label}`);
    };
    try {
      if (process.argv.includes("--wallet-only")) {
        await checkWallets(browser, url, output, name);
        reports.push({
          browser: name,
          status: "passed",
          checks: ["wallet-only"],
          metrics: [],
          errors: [],
          failed: [],
          external: [],
        });
        continue;
      }
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.fonts.status === "loaded");
      assert.ok(
        new URL(page.url()).pathname.endsWith("/"),
        "Keep the gateway directory URL for late relative assets",
      );
      assert.match(await page.title(), /PLEA/);
      assert.equal(
        await page
          .locator(
            'meta[name="description"], meta[property="og:title"], meta[property="og:image"], link[rel="icon"]',
          )
          .count(),
        4,
      );
      assert.deepEqual(
        await page.evaluate(() => [...document.fonts].map((f) => f.status)),
        ["loaded", "loaded"],
      );
      check("relative scripts, local fonts and share metadata load");
      for (const width of [320, 390, 640, 820, 1024, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(() => scrollTo(0, 0));
        const result = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          actionBottom: document
            .querySelector(".hero-actions")
            .getBoundingClientRect().bottom,
          amountTop: document
            .querySelector("#plea-amount")
            .getBoundingClientRect().top,
        }));
        metrics.push(result);
        assert.ok(result.scrollWidth <= width, `No page overflow at ${width}`);
        if (width === 390) {
          assert.ok(result.actionBottom < 844);
          assert.ok(result.amountTop < 844);
          await screenshot(page, `${name}-mobile-first`);
        }
        if (width === 1440) {
          await screenshot(page, `${name}-desktop-first`);
          await page.screenshot({
            path: `${output}/${name}-desktop-full.png`,
            fullPage: true,
          });
        }
      }
      check(
        "six responsive widths; product amount and main action visible at 390",
      );
      await page.setViewportSize({ width: 390, height: 844 });
      await page
        .getByRole("button", { name: "Connect wallet", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("dialog", { name: "Connect a wallet" })
          .isVisible(),
        true,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Browser wallet", exact: true })
          .isVisible(),
        true,
      );
      await page
        .getByRole("button", { name: "Browser wallet", exact: true })
        .click();
      await page
        .getByText("No browser wallet found.", { exact: false })
        .waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").isVisible(), false);
      assert.match(
        await page.evaluate(() => document.activeElement.textContent),
        /Connect wallet/,
      );
      check(
        "wallet sheet has a recoverable no-provider error, Escape closes and restores focus",
      );
      await page.locator("#plea-amount").fill("0");
      await page
        .getByRole("button", { name: "Submit plea · 0.50 IMD", exact: true })
        .click();
      assert.equal(
        await page.locator("#plea-amount").getAttribute("aria-invalid"),
        "true",
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "plea-amount",
      );
      await page.locator("#plea-amount").fill("90000");
      await page
        .locator("#plea-text")
        .fill("A PLEA with a hidden\u200b character");
      await page
        .getByRole("button", { name: "Submit plea · 0.50 IMD", exact: true })
        .click();
      assert.equal(
        await page.locator("#plea-text").getAttribute("aria-invalid"),
        "true",
      );
      await page.locator("#plea-text").fill("д".repeat(141));
      assert.match(
        await page.locator(".textarea-label").textContent(),
        /282 \/ 280 bytes/,
      );
      await page.getByRole("button", { name: "10%", exact: true }).click();
      assert.equal(await page.locator("#plea-amount").inputValue(), "45000");
      await page.getByRole("button", { name: "Max", exact: true }).click();
      assert.equal(await page.locator("#plea-amount").inputValue(), "225000");
      await page.getByRole("button", { name: "20%", exact: true }).click();
      await page.locator("#plea-text").fill(text);
      check(
        "amount limits, quick amounts, reserved/hidden text and UTF-8 errors work",
      );
      await page
        .getByRole("button", { name: "Submit plea · 0.50 IMD", exact: true })
        .click();
      await page
        .getByRole("dialog", { name: "Approve the oracle fee" })
        .waitFor();
      await page
        .getByRole("button", {
          name: "Approve & submit · 0.50 IMD",
          exact: true,
        })
        .click();
      await page.locator(".pending-case").waitFor();
      await screenshot(page, `${name}-pending`);
      await page.locator(".stamp-approved").waitFor({ timeout: 15000 });
      assert.equal(await page.locator(".judge").count(), 30);
      assert.match(
        await page.locator(".stamp-approved").textContent(),
        /35 vs need 35/,
      );
      assert.equal(await page.locator(".judge-median").count(), 1);
      await page.locator("#verdict").scrollIntoViewIfNeeded();
      await screenshot(page, `${name}-approved`);
      await page
        .getByRole("button", { name: "Sell now 90,000 PLEA", exact: true })
        .click();
      await page.locator(".stamp-sold").waitFor();
      assert.match(
        await page.locator(".form-balance").textContent(),
        /360,000/,
      );
      await page
        .getByRole("button", { name: "Object · 0.10 IMD", exact: true })
        .click();
      await page.locator(".stamp-objection").waitFor();
      await page.locator(".stamp-objection").scrollIntoViewIfNeeded();
      await screenshot(page, `${name}-objection`);
      await page.locator(".stamp-overruled").waitFor({ timeout: 15000 });
      assert.match(
        await page.locator(".verdict-actions").textContent(),
        /points are kept/,
      );
      check("fee approval → pending → 30 judges → approved → sold → overruled");
      await page
        .getByRole("button", { name: "Reset demo", exact: true })
        .click();
      await page.locator("#demo-outcome").selectOption("denied");
      await page
        .getByRole("button", { name: "Try a sample case", exact: true })
        .click();
      await page.locator(".stamp-denied").waitFor({ timeout: 15000 });
      await page
        .getByRole("button", {
          name: "Write an appeal · 0.50 IMD",
          exact: true,
        })
        .click();
      await page
        .locator("#appeal-text")
        .fill("I need to pay rent; I can hold the remainder.");
      await page
        .getByRole("button", { name: "Submit appeal · 0.50 IMD", exact: true })
        .click();
      await page.locator(".pending-case").waitFor();
      await page.locator(".stamp-denied").waitFor({ timeout: 15000 });
      assert.equal(
        await page
          .getByRole("button", { name: "Appeal already used", exact: true })
          .isDisabled(),
        true,
      );
      await page.locator("#verdict").scrollIntoViewIfNeeded();
      await screenshot(page, `${name}-denied`);
      check("denial, live four-hour countdown and one paid appeal");
      await page
        .getByRole("button", { name: "Reset demo", exact: true })
        .click();
      await page.locator("#demo-outcome").selectOption("objection");
      await page
        .getByRole("button", { name: "Try a sample case", exact: true })
        .click();
      await page.locator(".stamp-approved").waitFor({ timeout: 15000 });
      await page
        .getByRole("button", { name: "Sell now 90,000 PLEA", exact: true })
        .click();
      await page.locator(".stamp-sold").waitFor();
      await page
        .getByRole("button", { name: "Object · 0.10 IMD", exact: true })
        .click();
      await page.locator(".stamp-sustained").waitFor({ timeout: 15000 });
      assert.match(
        await page.locator(".verdict-actions").textContent(),
        /earns no points/,
      );
      assert.match(
        await page.locator(".form-balance").textContent(),
        /360,000/,
      );
      check("fresh objection panel sustains, sale stands, points are removed");
      await page
        .getByRole("button", { name: "Decode the letter", exact: true })
        .click();
      assert.match(
        await page.locator(".decoded-letter").textContent(),
        /landlord/,
      );
      await page
        .getByRole("button", { name: "Show raw transaction", exact: true })
        .click();
      assert.equal(await page.locator(".decoded-letter").count(), 0);
      await page
        .getByRole("button", { name: "Past seasons", exact: false })
        .click();
      assert.equal(await page.locator(".paid-stamp").count(), 3);
      await page
        .getByRole("button", { name: "This season", exact: true })
        .click();
      assert.equal(
        await page.locator(".leaderboard-table tbody tr").count(),
        5,
      );
      check("transaction decoding and past/current leaderboard views");
      await page.locator("#demo-outcome").selectOption("cabal-dead");
      assert.equal(await page.locator(".theme-dark").count(), 1);
      assert.equal(
        await page
          .getByRole("button", {
            name: "Cabal dead · pleas closed",
            exact: true,
          })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page.locator(".deadman-timer").textContent(),
        "00:00:00",
      );
      await page.locator(".dead-banner").scrollIntoViewIfNeeded();
      await screenshot(page, `${name}-dead`);
      await page
        .locator(".dead-banner")
        .getByRole("button", { name: "Trade PLEA", exact: true })
        .click();
      await page.getByRole("button", { name: "Sell", exact: true }).click();
      await page.locator("#swap-amount").fill("10000");
      await page
        .getByRole("button", { name: "Sell PLEA · demo", exact: true })
        .click();
      await page.locator(".swap-success").waitFor();
      await page.keyboard.press("Escape");
      assert.match(
        await page.locator(".form-balance").textContent(),
        /350,000/,
      );
      check("dead-man dark theme closes cases and enables free selling");
      await page
        .getByRole("button", { name: "Reset demo", exact: true })
        .click();
      await page.getByRole("button", { name: "Buy PLEA", exact: true }).click();
      await page.locator("#swap-amount").fill("100");
      await page
        .getByRole("button", { name: "Buy PLEA · demo", exact: true })
        .click();
      assert.match(
        await page.locator("#swap-error").textContent(),
        /within your demo balance/,
      );
      await page.locator("#swap-amount").fill("1");
      await page
        .getByRole("button", { name: "Buy PLEA · demo", exact: true })
        .click();
      await page.locator(".swap-success").waitFor();
      await page.keyboard.press("Escape");
      assert.match(
        await page.locator(".form-balance").textContent(),
        /491,666/,
      );
      check("buying is open with balance validation and simulated receipt");
      await checkKeyboard(page, url, output, name);
      check("primary plea approval and sale completed with keyboard only");
      await page.evaluate(() => scrollTo(0, 0));
      await page.keyboard.press("Tab");
      assert.ok(
        await page.evaluate(
          () =>
            getComputedStyle(document.activeElement).outlineStyle !== "none",
        ),
      );
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      await writeFile(
        `${output}/${name}-axe.json`,
        JSON.stringify(axe.violations, null, 2),
      );
      assert.equal(
        axe.violations.length,
        0,
        JSON.stringify(
          axe.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target),
          })),
        ),
      );
      check("keyboard focus and automated accessibility scan");
      const presentation = await checkPresentation(page, name, output);
      assert.ok(
        presentation.enlarged.scrollWidth <= presentation.enlarged.width,
        "200% text enlargement must reflow",
      );
      limitations.push(...presentation.limitations);
      check(
        presentation.limitations.length
          ? "200% text reflow, focus and reduced motion; WebKit dark contrast scanner limitation retained"
          : "rendered contrast in both themes, 200% text reflow, focus and reduced motion",
      );
      await checkWallets(browser, url, output, name);
      check(
        "EIP-6963 discovery, rejection, chain add/switch, disconnect and four mobile wallet links",
      );
      assert.equal(failed.length, 0, JSON.stringify(failed));
      assert.equal(errors.length, 0, JSON.stringify(errors));
      assert.equal(external.length, 0, JSON.stringify(external));
      check("zero console errors, failed local assets or backend requests");
      reports.push({
        browser: name,
        status: limitations.length ? "passed-with-limitations" : "passed",
        limitations,
        checks,
        metrics,
        errors,
        failed,
        external,
      });
    } catch (error) {
      reports.push({
        browser: name,
        status: "failed",
        checks,
        error: String(error),
        errors,
        failed,
        external,
      });
      await screenshot(page, `${name}-failure`);
      console.error(name, error);
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((r) => server.close(r));
}
await writeFile(`${output}/results.json`, JSON.stringify(reports, null, 2));
console.log(
  JSON.stringify(
    reports.map(({ browser, status, checks, error }) => ({
      browser,
      status,
      checks: checks?.length,
      error,
    })),
    null,
    2,
  ),
);
if (
  reports.some((r) => !["passed", "passed-with-limitations"].includes(r.status))
)
  process.exitCode = 1;
