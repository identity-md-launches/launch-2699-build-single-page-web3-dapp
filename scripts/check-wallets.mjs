import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
/** Browser fixtures only: an ephemeral EIP-1193 provider, never a shipped wallet or key. */
export async function checkWallets(browser, url, output, name) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const providerFixture = () => {
    const events = new Map();
    const address =
      "0x" +
      [...crypto.getRandomValues(new Uint8Array(20))]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
    let connected = false,
      rejected = false,
      known = false,
      chain = "0x1";
    window.__walletCalls = [];
    const provider = {
      on(event, fn) {
        events.set(event, [...(events.get(event) ?? []), fn]);
      },
      removeListener(event, fn) {
        events.set(
          event,
          (events.get(event) ?? []).filter((f) => f !== fn),
        );
      },
      async request({ method, params }) {
        window.__walletCalls.push({ method, params });
        if (method === "eth_accounts") return connected ? [address] : [];
        if (method === "eth_chainId") return chain;
        if (method === "eth_requestAccounts") {
          if (!rejected) {
            rejected = true;
            throw { code: 4001, message: "User rejected the request." };
          }
          connected = true;
          return [address];
        }
        if (method === "wallet_requestPermissions")
          return [{ parentCapability: "eth_accounts" }];
        if (method === "wallet_getPermissions")
          return connected ? [{ parentCapability: "eth_accounts" }] : [];
        if (method === "wallet_switchEthereumChain") {
          if (!known) throw { code: 4902, message: "Unrecognized chain." };
          chain = params[0].chainId;
          for (const fn of events.get("chainChanged") ?? []) fn(chain);
          return null;
        }
        if (method === "wallet_addEthereumChain") {
          known = true;
          chain = params[0].chainId;
          for (const fn of events.get("chainChanged") ?? []) fn(chain);
          return null;
        }
        if (method === "wallet_revokePermissions") {
          connected = false;
          return null;
        }
        throw { code: -32601, message: "Unsupported test method: " + method };
      },
    };
    const info = {
      uuid: crypto.randomUUID(),
      name: "Review Wallet",
      rdns: "dev.plea.review",
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="black"/></svg>',
    };
    const announce = () =>
      dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: { info, provider },
        }),
      );
    addEventListener("eip6963:requestProvider", announce);
    setTimeout(announce, 500);
  };
  await context.addInitScript(providerFixture);
  const page = await context.newPage();
  try {
    await page.goto(url);
    await page
      .getByRole("button", { name: "Connect wallet", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Review Wallet", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Browser wallet", exact: true })
        .count(),
      0,
    );
    await page
      .getByRole("button", { name: "Review Wallet", exact: true })
      .click();
    await page.getByText("Connection declined.", { exact: false }).waitFor();
    await page
      .getByRole("button", { name: "Review Wallet", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Switch to Base Sepolia", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Switch to Base Sepolia", exact: true })
      .click();
    await page.waitForFunction(() => {
      const b = document.querySelector(".wallet-button");
      return b && /0x.+…/.test(b.textContent);
    });
    const calls = await page.evaluate(() => window.__walletCalls);
    assert.ok(calls.some((c) => c.method === "wallet_switchEthereumChain"));
    const add = calls.find((c) => c.method === "wallet_addEthereumChain");
    assert.equal(parseInt(add.params[0].chainId, 16), 84532);
    assert.equal(add.params[0].chainName, "Base Sepolia");
    assert.equal(
      calls.some((c) => /sendTransaction|sign|signTypedData/i.test(c.method)),
      false,
    );
    await page.locator(".wallet-button").click();
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await page
      .getByRole("button", { name: "Connect wallet", exact: true })
      .waitFor();
    await page.screenshot({ path: `${output}/${name}-wallet-return.png` });
  } catch (error) {
    await page.screenshot({ path: `${output}/${name}-wallet-failure.png` });
    await writeFile(
      `${output}/${name}-wallet-failure.json`,
      JSON.stringify(
        await page.evaluate(() => ({
          calls: window.__walletCalls,
          text: document.body.innerText,
        })),
        null,
        2,
      ),
    );
    throw error;
  } finally {
    await context.close();
  }
  const embedded = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
  });
  await embedded.addInitScript(providerFixture);
  const embeddedPage = await embedded.newPage();
  try {
    await embeddedPage.goto(url, { waitUntil: "networkidle" });
    await embeddedPage
      .getByRole("button", { name: "Connect wallet", exact: true })
      .click();
    await embeddedPage
      .getByRole("button", { name: "Review Wallet", exact: true })
      .waitFor();
    assert.equal(
      await embeddedPage
        .getByRole("link", { name: "Open in MetaMask", exact: true })
        .count(),
      0,
    );
    await embeddedPage
      .getByRole("button", { name: "Review Wallet", exact: true })
      .click();
    await embeddedPage
      .getByText("Connection declined.", { exact: false })
      .waitFor();
    await embeddedPage
      .getByRole("button", { name: "Review Wallet", exact: true })
      .click();
    await embeddedPage
      .getByRole("button", { name: "Switch to Base Sepolia", exact: true })
      .waitFor();
    assert.equal(
      await embeddedPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await embeddedPage.screenshot({
      path: `${output}/${name}-phone-injected.png`,
    });
  } finally {
    await embedded.close();
  }
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
  });
  const phone = await mobile.newPage();
  try {
    await phone.goto(url, { waitUntil: "networkidle" });
    await phone
      .getByRole("button", { name: "Connect wallet", exact: true })
      .click();
    for (const wallet of ["MetaMask", "Coinbase Wallet", "Rabby", "Phantom"]) {
      const link = phone.getByRole("link", {
        name: "Open in " + wallet,
        exact: true,
      });
      assert.ok(await link.isVisible());
      assert.ok((await link.getAttribute("href")).startsWith("https://"));
    }
    assert.ok(
      (
        await phone
          .getByRole("link", { name: "Open in Rabby", exact: true })
          .getAttribute("href")
      ).includes("_cmd=open-dapp&dapp="),
    );
    assert.equal(
      await phone
        .getByRole("button", { name: "Coinbase Smart Wallet", exact: true })
        .isVisible(),
      true,
    );
    assert.equal(
      await phone
        .getByRole("button", { name: "Browser wallet", exact: true })
        .count(),
      0,
    );
    await phone.waitForFunction(() =>
      [...document.querySelectorAll("dialog[open] img")].every(
        (img) => img.complete && img.naturalWidth > 0,
      ),
    );
    assert.equal(
      await phone
        .locator("dialog img")
        .evaluateAll((imgs) =>
          imgs.every((i) => i.complete && i.naturalWidth > 0),
        ),
      true,
    );
    await phone.screenshot({ path: `${output}/${name}-mobile-wallets.png` });
    const panel = await phone.getByRole("dialog").boundingBox();
    assert.ok(Math.abs(844 - (panel.y + panel.height) - 16) < 2);
    for (let i = 0; i < 8; i++) {
      await phone.keyboard.press("Tab");
      assert.equal(
        await phone.evaluate(
          () =>
            document
              .querySelector("dialog[open]")
              .contains(document.activeElement) ||
            document.activeElement.tagName === "BODY",
        ),
        true,
      );
    }
    await phone.keyboard.press("Escape");
  } catch (error) {
    await writeFile(
      `${output}/${name}-mobile-wallet-error.json`,
      JSON.stringify(
        await phone
          .locator("dialog img")
          .evaluateAll((imgs) =>
            imgs.map((i) => ({
              src: i.src,
              complete: i.complete,
              width: i.naturalWidth,
              height: i.naturalHeight,
            })),
          ),
        null,
        2,
      ),
    );
    await phone.screenshot({
      path: `${output}/${name}-mobile-wallet-error.png`,
    });
    throw error;
  } finally {
    await mobile.close();
  }
}
