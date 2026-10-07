import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { Browser, Page } from "playwright";

export async function verifyWritingReview(browser: Browser, appUrl: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto(appUrl, { timeout: 60000 });
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { (window as any).copiedWriting = text; } } });
      window.print = () => { (window as any).printedWriting = document.querySelector(".print-document")?.textContent; };
    });
    await page.getByRole("textbox", { name: "Audience (optional)", exact: true }).fill("Private audience notes");
    await page.getByRole("textbox", { name: "Intended outcome (optional)", exact: true }).fill("Private outcome notes");
    const boardDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Board", exact: true }).click();
    const boardFile = await readFile((await (await boardDownload).path())!, "utf8");
    assert.equal(await page.getByRole("heading", { name: "Before you share", exact: true }).count(), 0);
    await page.getByRole("tab", { name: /Preview/ }).click();
    await page.getByRole("button", { name: "Copy Mermaid", exact: true }).click();
    assert.match(await page.evaluate(() => (window as any).copiedWriting), /flowchart/);
    assert.equal(await page.getByRole("heading", { name: "Before you share", exact: true }).count(), 0);

    for (const draft of [true, false]) {
      for (const format of ["copy", "markdown", "text", "print"] as const) {
        page.once("dialog", (dialog) => dialog.accept());
        await page.locator('input[type="file"]').setInputFiles({ name: "planning.argument.json", mimeType: "application/json", buffer: Buffer.from(boardFile) });
        await page.getByRole("tab", { name: /Preview/ }).click();
        await page.getByRole("button", { name: "Readable outline", exact: true }).click();
        const button = writingButton(page, format);
        await button.click();
        const invitation = page.getByRole("region", { name: "Before you share", exact: true });
        await invitation.waitFor();
        assert.equal(await invitation.getByRole("heading").evaluate((el) => el === document.activeElement), true);
        const download = format === "markdown" || format === "text" ? page.waitForEvent("download") : undefined;
        if (draft) await invitation.getByRole("button", { name: "Export draft", exact: true }).click();
        else {
          await invitation.getByRole("button", { name: "Review now", exact: true }).click();
          await page.getByRole("heading", { name: "Reasoning review", exact: true }).waitFor();
          await page.getByRole("button", { name: "Continue to export", exact: true }).click();
        }
        const contents = download ? await readFile((await (await download).path())!, "utf8") : await page.evaluate((format) => format === "copy" ? (window as any).copiedWriting : (window as any).printedWriting, format);
        assert.equal(/\bDraft\b/.test(contents), draft, `${format} should reflect selected Draft label`);
        assert.doesNotMatch(contents, /Private audience notes|Private outcome notes/);
        assert.match(contents, /Sources/);
        assert.equal(await invitation.count(), 0);
        if (format === "copy") assert.equal(await button.evaluate((el) => el === document.activeElement), true);
      }
    }
    const savedDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Board", exact: true }).click();
    const savedFile = JSON.parse(await readFile((await (await savedDownload).path())!, "utf8"));
    assert.deepEqual(savedFile, JSON.parse(boardFile), "Review choice must not change editable board content");
    const cancelledImport = page.waitForEvent("dialog");
    await page.locator('input[type="file"]').setInputFiles({ name: "cancel.argument.json", mimeType: "application/json", buffer: Buffer.from(boardFile) });
    await (await cancelledImport).dismiss();
    await page.getByRole("button", { name: "Copy Outline", exact: true }).click();
    assert.equal(await page.getByRole("heading", { name: "Before you share", exact: true }).count(), 0);
    const rejectedImport = page.waitForEvent("dialog");
    await page.locator('input[type="file"]').setInputFiles({ name: "invalid.argument.json", mimeType: "application/json", buffer: Buffer.from("not JSON") });
    await (await rejectedImport).accept();
    await page.getByRole("button", { name: "Copy Outline", exact: true }).click();
    assert.equal(await page.getByRole("heading", { name: "Before you share", exact: true }).count(), 0);
    await page.getByRole("textbox", { name: "Board title" }).fill("Ordinary edit");
    await page.getByRole("button", { name: "Copy Outline", exact: true }).click();
    assert.equal(await page.getByRole("heading", { name: "Before you share", exact: true }).count(), 0);
    await page.getByRole("button", { name: "Label writing exports as Draft", exact: true }).click();
    await page.getByRole("button", { name: "Copy Outline", exact: true }).click();
    assert.match(await page.evaluate(() => (window as any).copiedWriting), /\bDraft\b/);
    await page.getByRole("button", { name: "Reasoning review", exact: true }).click();
    await page.getByRole("button", { name: "Back to editing", exact: true }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear Board", exact: true }).click();
    await page.getByRole("button", { name: "Copy Outline", exact: true }).click();
    await page.getByRole("heading", { name: "Before you share", exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole("button", { name: "Review now", exact: true }).focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.getByRole("button", { name: "Export draft", exact: true }).evaluate((el) => el === document.activeElement), true);
    await page.getByRole("button", { name: "Cancel export", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Copy Outline", exact: true }).evaluate((el) => el === document.activeElement), true);
  } finally {
    await context.close();
  }
}

function writingButton(page: Page, format: "copy" | "markdown" | "text" | "print") {
  const names = { copy: "Copy Outline", markdown: "Download Markdown", text: "Download text", print: "Print / Save PDF" };
  return page.getByRole("button", { name: names[format], exact: true });
}
