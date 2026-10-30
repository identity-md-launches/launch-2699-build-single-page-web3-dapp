import assert from "node:assert/strict";
export async function checkKeyboard(page, url, output, name) {
  await page.goto(url, { waitUntil: "networkidle" });
  const tabTo = async (predicate) => {
    for (let step = 0; step < 50; step++) {
      if (await page.evaluate(predicate)) return;
      await page.keyboard.press("Tab");
    }
    throw Error("Keyboard target was not reachable in 50 Tab stops.");
  };
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent),
    "Skip to plea form",
  );
  await page.screenshot({ path: `${output}/${name}-keyboard-focus.png` });
  await page.keyboard.press("Enter");
  await tabTo(() => document.activeElement.id === "plea-amount");
  await page.keyboard.press("Control+A");
  await page.keyboard.type("90000");
  await tabTo(() => document.activeElement.id === "plea-text");
  await page.keyboard.press("Control+A");
  await page.keyboard.type(
    "My rent is due. I will keep the rest of my tokens.",
  );
  await tabTo(
    () =>
      document.activeElement.tagName === "BUTTON" &&
      document.activeElement.textContent.includes("Submit plea"),
  );
  await page.keyboard.press("Enter");
  await page.getByRole("dialog", { name: "Approve the oracle fee" }).waitFor();
  await tabTo(
    () =>
      document.activeElement.tagName === "BUTTON" &&
      document.activeElement.textContent.includes("Approve & submit"),
  );
  await page.keyboard.press("Enter");
  await page.locator(".stamp-approved").waitFor({ timeout: 15000 });
  await tabTo(
    () =>
      document.activeElement.tagName === "A" &&
      document.activeElement.textContent.includes("see verdict"),
  );
  await page.keyboard.press("Enter");
  await tabTo(
    () =>
      document.activeElement.tagName === "BUTTON" &&
      document.activeElement.textContent.includes("Sell now"),
  );
  await page.keyboard.press("Enter");
  await page.locator(".stamp-sold").waitFor();
  assert.match(await page.locator(".form-balance").textContent(), /360,000/);
}
