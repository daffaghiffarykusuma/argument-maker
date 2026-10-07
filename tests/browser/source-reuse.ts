import assert from "node:assert/strict";
import type { Browser } from "playwright";

export async function verifySourceReuse(browser: Browser, appUrl: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto(appUrl);
    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    await page.getByRole("button", { name: "Add fact" }).click();
    const original = page.locator('.fact-card[data-fact-id="fact-1"]');
    await original.getByLabel("Fact text", { exact: true }).fill("The original finding");
    await original.getByLabel("Descriptive citation", { exact: true }).fill("Notebook, p. 4");
    await original.getByLabel("Evidence Link", { exact: true }).fill("https://example.com/notes");
    await original.getByText("Source details", { exact: true }).click();
    await original.getByLabel("Source title", { exact: true }).fill("Research notebook");
    await original.getByLabel("Source date", { exact: true }).fill("2026-09");
    await original.getByLabel("Quotation", { exact: true }).fill("The original quotation");
    await original.getByLabel("Quotation", { exact: true }).press("Tab");
    await original.getByRole("button", { name: "Another fact from this source" }).click();
    const copy = page.locator('.fact-card[data-fact-id="fact-2"]');
    assert.equal(await copy.getByLabel("Fact text", { exact: true }).evaluate((el) => el === document.activeElement), true);
    assert.equal(await copy.getByLabel("Fact text", { exact: true }).inputValue(), "");
    assert.equal(await copy.getByLabel("Evidence Link", { exact: true }).inputValue(), "https://example.com/notes");
    assert.equal(await copy.getByLabel("Descriptive citation", { exact: true }).inputValue(), "Notebook, p. 4");
    await copy.getByText("Source details", { exact: true }).click();
    assert.equal(await copy.getByLabel("Source title", { exact: true }).inputValue(), "Research notebook");
    assert.equal(await copy.getByLabel("Source date", { exact: true }).inputValue(), "2026-09");
    assert.equal(await copy.getByLabel("Quotation", { exact: true }).inputValue(), "");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await copy.count(), 0);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(await copy.getByLabel("Descriptive citation", { exact: true }).inputValue(), "Notebook, p. 4");
    await page.setViewportSize({ width: 390, height: 844 });
    await copy.getByLabel("Fact text", { exact: true }).fill("A separate finding");
    await copy.getByLabel("Fact text", { exact: true }).press("Tab");
    assert.equal(await copy.getByLabel("Evidence Link", { exact: true }).evaluate((el) => el === document.activeElement), true);
    assert.equal(await original.getByLabel("Fact text", { exact: true }).inputValue(), "The original finding");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole("checkbox", { name: "Save draft in this browser" }).check();
    await page.reload();
    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    assert.equal(await copy.getByLabel("Descriptive citation", { exact: true }).inputValue(), "Notebook, p. 4");
    assert.equal(await copy.getByLabel("Fact text", { exact: true }).inputValue(), "A separate finding");
  } finally {
    await context.close();
  }
}
