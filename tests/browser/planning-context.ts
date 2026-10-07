import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { Browser } from "playwright";

export async function verifyPlanningContext(browser: Browser, appUrl: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto(appUrl);
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    const audience = page.getByRole("textbox", { name: "Audience (optional)", exact: true });
    const outcome = page.getByRole("textbox", { name: "Intended outcome (optional)", exact: true });
    await audience.fill("Private service managers");
    await audience.press("Tab");
    assert.equal(await outcome.evaluate((el) => el === document.activeElement), true);
    await outcome.fill("Private pilot approval");
    await outcome.press("Tab");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await outcome.inputValue(), "");
    assert.equal(await audience.inputValue(), "Private service managers");
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(await outcome.inputValue(), "Private pilot approval");
    await page.getByRole("checkbox", { name: "Save draft in this browser" }).check();
    await page.reload();
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    assert.equal(await audience.inputValue(), "Private service managers");
    assert.equal(await outcome.inputValue(), "Private pilot approval");
    await page.setViewportSize({ width: 390, height: 844 });
    await audience.focus();
    await audience.press("Tab");
    assert.equal(await outcome.evaluate((el) => el === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.getByRole("tab", { name: /Preview/ }).click();
    await page.getByRole("button", { name: "Readable outline", exact: true }).click();
    const assertPrivate = (text: string) => {
      assert.equal(text.includes("Private service managers"), false);
      assert.equal(text.includes("Private pilot approval"), false);
    };
    assertPrivate(await page.locator(".outline-preview").innerText());
    for (const name of ["Download Markdown", "Download text"]) {
      const pending = page.waitForEvent("download");
      await page.getByRole("button", { name, exact: true }).click();
      assertPrivate(await readFile((await (await pending).path())!, "utf8"));
    }
    await page.emulateMedia({ media: "print" });
    assertPrivate(await page.locator(".print-document").innerText());
  } finally {
    await context.close();
  }
}
