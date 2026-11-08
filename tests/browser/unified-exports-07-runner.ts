import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const harness = "./browser-harness.ts";
const { withBrowserWorkflow }: typeof import("./browser-harness") = await import(harness);
console.log("Ticket 07 starting owned browser workflow on 3027");

await withBrowserWorkflow(3027, async (browser, url) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(5000);
  try {
    console.log("Ticket 07 Chromium ready, opening app");
    await page.goto(url);
    console.log("Ticket 07 app loaded, checking export disclosure");
    const header = page.getByRole("banner", { name: "Workspace commands" });
    const exports = header.getByText("Export writing", { exact: true });
    await exports.waitFor();
    await mkdir("output/playwright/unified-exports-07", { recursive: true });
    for (const stage of ["Construct Argument", "Gather Facts", "Preview"]) {
      await page.getByRole("tab", { name: stage, exact: true }).click();
      await exports.focus();
      await page.keyboard.press("Enter");
      for (const name of ["Copy", "Markdown", "Text", "Print/PDF"]) {
        assert.equal(await header.getByRole("button", { name, exact: true }).isVisible(), true);
      }
      if (stage === "Construct Argument") await page.screenshot({ path: "output/playwright/unified-exports-07/desktop-menu.png" });
      await header.getByRole("button", { name: "Text", exact: true }).focus();
      await page.keyboard.press("Escape");
      assert.equal(await exports.evaluate(el => el === document.activeElement), true);
      assert.equal(await header.getByRole("button", { name: "Text", exact: true }).isVisible(), false);
    }
    assert.equal(await page.locator('.preview-tools').getByRole("button", { name: /Markdown|Text|Print|Copy/ }).count(), 0);
    await exports.click();
    await header.getByRole("button", { name: "Markdown", exact: true }).click();
    await page.getByRole("heading", { name: "Before you share", exact: true }).waitFor();
    await page.getByRole("button", { name: "Cancel export", exact: true }).click();
    assert.equal(await exports.evaluate(el => el === document.activeElement), true);
    for (const width of [1024, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await exports.click();
      assert.equal(await exports.innerText(), "Export writing");
      if (width === 390) await page.screenshot({ path: "output/playwright/unified-exports-07/mobile-menu.png" });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no overflow at ${width}`);
      for (const button of await header.getByRole("button").all()) {
        if (await button.isVisible()) assert.ok((await button.boundingBox())!.height >= 44);
      }
      await page.keyboard.press("Escape");
      await header.locator("#board-menu-toggle").click();
      const pending = page.waitForEvent("download");
      await header.getByRole("button", { name: "Download editable board", exact: true }).click();
      const board = JSON.parse(await readFile((await (await pending).path())!, "utf8"));
      assert.equal(typeof board.title, "string");
      assert.equal(await page.getByRole("heading", { name: "Before you share", exact: true }).count(), 0, "Editable file download bypasses writing review");
      assert.equal(await header.locator("#board-menu-toggle").evaluate(el => el === document.activeElement), true);
    }
  } finally { await page.close(); }
});
console.log("Ticket 07 unified writing exports passed");
