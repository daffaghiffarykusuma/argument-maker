import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const harness = "./browser-harness.ts";
const { withBrowserWorkflow }: typeof import("./browser-harness") = await import(harness);

await withBrowserWorkflow(3021, async (browser, url) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(5000);
  await page.goto(url);
  const header = page.getByRole("banner", { name: "Workspace commands" });
  await header.waitFor();
  assert.ok((await header.boundingBox())!.height < 100, "desktop commands should occupy a compact header");
  const board = header.locator("#board-menu-toggle");
  assert.equal(await board.innerText(), "Board");
  await board.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Download editable board", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await board.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.getByRole("button", { name: "Download editable board", exact: true }).isVisible(), false);
  const construct = page.getByRole("tab", { name: "Construct Argument", exact: true });
  await construct.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.getByRole("tab", { name: "Gather Facts", exact: true }).getAttribute("aria-selected"), "true");
  await page.keyboard.press("Home");
  assert.equal(await construct.getAttribute("aria-selected"), "true");
  await page.getByRole("textbox", { name: "Board title", exact: true }).fill("A portable argument");
  await page.getByRole("textbox", { name: "Board title", exact: true }).press("Tab");
  await board.click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download editable board", exact: true }).click();
  const file = await readFile((await (await pending).path())!, "utf8");
  assert.equal(JSON.parse(file).title, "A portable argument");
  assert.equal(await page.getByRole("button", { name: "Download editable board", exact: true }).isVisible(), false);
  assert.equal(await board.evaluate(el => el === document.activeElement), true);
  await board.click();
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Clear Board", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Board title", exact: true }).inputValue(), "A portable argument");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Board title", exact: true }).inputValue(), "");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Board title", exact: true }).inputValue(), "A portable argument");
  await mkdir("output/playwright/compact-header-3021", { recursive: true });
  await page.screenshot({ path: "output/playwright/compact-header-3021/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await board.innerText(), "More");
  assert.equal(await header.locator("#writing-menu-toggle").innerText(), "Export writing");
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no overflow at ${width}`);
    for (const control of await header.locator("button, summary").all()) {
      if (await control.isVisible()) assert.ok((await control.boundingBox())!.height >= 44, "comfortable header targets");
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await board.click();
  await page.screenshot({ path: "output/playwright/compact-header-3021/mobile-menu.png", fullPage: true });
  await header.getByText("Argument Maker", { exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Download editable board", exact: true }).isVisible(), false);
  await page.close();
});
console.log("Compact header 3021 browser workflow passed");
