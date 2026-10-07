import assert from "node:assert/strict";
import type { Browser } from "playwright";

export async function verifyReasoningReview(browser: Browser, appUrl: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto(appUrl, { timeout: 60000 });
    const openReview = page.getByRole("button", { name: "Reasoning review", exact: true });
    await openReview.focus();
    await openReview.press("Enter");
    const review = page.getByRole("region", { name: "Reasoning review", exact: true });
    assert.equal(await review.getByRole("heading", { name: "Reasoning review", exact: true }).evaluate((el) => el === document.activeElement), true);
    assert.match(await review.innerText(), /Audience not set/);
    assert.match(await review.innerText(), /Intended outcome not set/);
    assert.match(await review.innerText(), /does not establish truth or reasoning quality/);
    await review.getByRole("button", { name: "Add your main answer.", exact: true }).click();
    const answer = page.locator('[data-action="scqa"][data-field="answer"]');
    assert.equal(await answer.evaluate((el) => el === document.activeElement), true);
    await answer.fill("Run a small pilot first.");
    await page.getByRole("textbox", { name: "Audience (optional)", exact: true }).fill("Service managers");
    await page.getByRole("textbox", { name: "Intended outcome (optional)", exact: true }).fill("Approve a limited pilot");
    await openReview.click();
    assert.match(await review.innerText(), /Service managers/);
    assert.match(await review.innerText(), /Approve a limited pilot/);
    assert.match(await review.innerText(), /Run a small pilot first/);
    const connection = review.getByRole("textbox", { name: "How does this reason support your answer?", exact: true });
    await connection.fill("A pilot tests the assumption before committing resources.");
    await connection.press("Tab");
    assert.equal(await review.getByRole("textbox", { name: "What are you assuming?", exact: true }).evaluate((el) => el === document.activeElement), true);
    await page.getByRole("button", { name: "Back to editing", exact: true }).click();
    assert.equal(await openReview.evaluate((el) => el === document.activeElement), true);
    await page.getByText("Challenge this reason", { exact: false }).click();
    assert.equal(await page.getByRole("textbox", { name: "How does this reason support your answer?", exact: true }).inputValue(), "A pilot tests the assumption before committing resources.");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await openReview.click();
    assert.equal(await connection.inputValue(), "");
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(await connection.inputValue(), "A pilot tests the assumption before committing resources.");
    await page.getByRole("checkbox", { name: "Save draft in this browser" }).check();
    await page.reload();
    await openReview.click();
    assert.equal(await connection.inputValue(), "A pilot tests the assumption before committing resources.");
    await page.setViewportSize({ width: 390, height: 844 });
    await connection.focus();
    await connection.press("Tab");
    assert.equal(await review.getByRole("textbox", { name: "What are you assuming?", exact: true }).evaluate((el) => el === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    assert.equal(await review.count(), 0);
    await openReview.click();
    await page.getByRole("button", { name: "Back to editing", exact: true }).click();
    assert.equal(await page.getByRole("tab", { name: /Gather Facts/ }).getAttribute("aria-selected"), "true");
    assert.equal(await openReview.evaluate((el) => el === document.activeElement), true);
  } finally {
    await context.close();
  }
}

