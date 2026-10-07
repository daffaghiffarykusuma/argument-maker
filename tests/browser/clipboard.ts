import assert from "node:assert/strict";
import type { Page } from "playwright";

export async function verifyClipboardFeedback(page: Page) {
  const title = await page.getByRole("textbox", { name: "Board title" }).inputValue();
  for (const output of ["Outline", "Mermaid"]) {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: () => new Promise<void>((resolve) => { (window as any).completeClipboardWrite = resolve; }),
      } });
    });
    const button = page.getByRole("button", { name: `Copy ${output}`, exact: true });
    await button.focus();
    await button.press("Enter");
    if (output === "Outline") await page.getByRole("button", { name: "Export draft", exact: true }).click();
    const status = page.getByRole("status", { name: "Copy feedback" });
    await status.getByText(`Copying ${output.toLowerCase()}…`, { exact: true }).waitFor({ timeout: 2000 });
    assert.equal(await button.evaluate((element) => element === document.activeElement), true);
    await page.evaluate(() => (window as any).completeClipboardWrite());
    await status.getByText(`${output} copied.`, { exact: true }).waitFor({ timeout: 2000 });
    assert.equal(await button.evaluate((element) => element === document.activeElement), true);

    for (const failure of ["denied", "unavailable"]) {
      await page.evaluate((failure) => {
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: failure === "unavailable" ? undefined : {
          writeText: () => Promise.reject(new DOMException("Clipboard denied", "NotAllowedError")),
        } });
      }, failure);
      await button.press("Enter");
      await status.getByText(`Could not copy ${output.toLowerCase()}. Try Copy ${output} again.`, { exact: true }).waitFor({ timeout: 2000 });
      assert.equal(await status.innerText(), `Could not copy ${output.toLowerCase()}. Try Copy ${output} again.`);
      assert.equal(await button.evaluate((element) => element === document.activeElement), true);
      assert.equal(await page.getByRole("textbox", { name: "Board title" }).inputValue(), title);
    }
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } });
    });
    await button.press("Enter");
    await status.getByText(`${output} copied.`, { exact: true }).waitFor({ timeout: 2000 });
  }
}
