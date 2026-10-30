import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
export async function checkPresentation(page, name, output) {
  const measure = () =>
    page.evaluate(() => {
      const parse = (str) => str.match(/[\d.]+/g)?.map(Number);
      const composite = (top, bottom) => {
        const a = top[3] ?? 1;
        return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
      };
      const background = (el) => {
        const colors = [];
        for (let p = el; p; p = p.parentElement) {
          const c = parse(getComputedStyle(p).backgroundColor);
          if (c && (c[3] ?? 1) > 0) {
            colors.push(c);
            if ((c[3] ?? 1) === 1) break;
          }
        }
        let base = [255, 255, 255, 1];
        for (const c of colors.reverse()) base = composite(c, base);
        return base;
      };
      const lum = (c) => {
        const [r, g, b] = c.slice(0, 3).map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      return [
        ".site",
        ".section-description",
        ".plea-form label",
        ".button-yellow",
        ".button-black",
        ".need-preview p",
        ".form-foot",
        ".deadman-copy > p",
      ].map((selector) => {
        const el = document.querySelector(selector),
          cs = getComputedStyle(el);
        const fg = parse(cs.color),
          bg = background(el);
        const l1 = lum(fg),
          l2 = lum(bg);
        return {
          selector,
          foreground: cs.color,
          background: bg.slice(0, 3),
          ratio: Number(
            ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2),
          ),
        };
      });
    });
  await page.waitForLoadState("networkidle");
  const light = await measure();
  for (const pair of light) assert.ok(pair.ratio >= 4.5, JSON.stringify(pair));
  await page.locator("#demo-outcome").selectOption("cabal-dead");
  await page.locator(".theme-dark").waitFor();
  // Paint the whole document before auditing WebKit's cached offscreen inherited styles.
  await page.screenshot({
    path: `${output}/${name}-dark-full.png`,
    fullPage: true,
  });
  const darkAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  await writeFile(
    `${output}/${name}-dark-axe.json`,
    JSON.stringify(darkAxe.violations, null, 2),
  );
  const limitations = [];
  const dark = await measure();
  assert.equal(
    darkAxe.violations.length,
    0,
    JSON.stringify(
      darkAxe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ),
  );
  for (const pair of dark) assert.ok(pair.ratio >= 4.5, JSON.stringify(pair));
  await page.locator("#demo-outcome").selectOption("approved");
  await page.waitForFunction(() => !document.querySelector(".theme-dark"));
  const style = await page.addStyleTag({
    content: "html { font-size: 200% !important; }",
  });
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const enlarged = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll("body *")]
      .filter(
        (e) =>
          e.getBoundingClientRect().right > innerWidth + 1 &&
          getComputedStyle(e).position !== "absolute",
      )
      .slice(0, 15)
      .map((e) => ({
        tag: e.tagName,
        class: e.className,
        right: e.getBoundingClientRect().right,
        text: e.textContent.slice(0, 40),
      })),
  }));
  await page.screenshot({ path: `${output}/${name}-text-200.png` });
  await style.evaluate((el) => el.remove());
  const forced = await page
    .emulateMedia({ forcedColors: "active" })
    .then(async () =>
      (await page.evaluate(() => matchMedia("(forced-colors: active)").matches))
        ? "emulated"
        : "unsupported",
    )
    .catch(() => "unsupported");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .focus();
  const focus = await page.locator(".wallet-button").evaluate((el) => ({
    outline: getComputedStyle(el).outlineStyle,
    width: getComputedStyle(el).outlineWidth,
    color: getComputedStyle(el).outlineColor,
  }));
  assert.notEqual(focus.outline, "none");
  await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
  const motion = await page.evaluate(() => ({
    endless: document
      .getAnimations()
      .filter(
        (a) =>
          a.effect?.getComputedTiming().iterations === Infinity &&
          a.playState === "running",
      ).length,
    preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  assert.equal(motion.endless, 0);
  await writeFile(
    `${output}/${name}-presentation.json`,
    JSON.stringify(
      { light, dark, enlarged, forced, focus, motion, limitations },
      null,
      2,
    ),
  );
  return { enlarged, forced, motion, limitations };
}
