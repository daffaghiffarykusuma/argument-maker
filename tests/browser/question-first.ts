import assert from "node:assert/strict";
import type { Browser } from "playwright";

export async function verifyQuestionFirst(browser: Browser, appUrl: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  try {
    await page.goto(appUrl);
    await page.getByRole("heading", { name: "Construct Argument", exact: true }).waitFor();
    assert.equal(await page.locator('[aria-label="Argument frame"] textarea').first().getAttribute("id"), "scqa-question");
    assert.equal(await page.locator('details[data-disclosure="readiness"]').getAttribute("open"), null);
    assert.equal(await page.getByText("Add your main answer.", { exact: true }).isVisible(), false);
    await page.getByRole("button", { name: "Start with a question" }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), "scqa-question");
    await page.locator("#scqa-question").fill("How should we meet rising demand?");
    await page.locator("#scqa-question").press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "scqa-answer");
    await page.getByRole("button", { name: "Gather supporting material" }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), "stage-heading-gather");
    await page.getByRole("tab", { name: /Preview/ }).click();
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    assert.equal(await page.locator("#scqa-question").inputValue(), "How should we meet rising demand?");
    await page.locator('details[data-disclosure="readiness"] > summary').click();
    assert.equal(await page.getByText("Add your main answer.", { exact: true }).isVisible(), true);

    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Clear Board", exact: true }).click();
    await page.getByRole("heading", { name: "Construct Argument", exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("textbox", { name: "What is your tentative claim or main answer? Answer", exact: true }).fill("We should expand capacity.");
    await page.locator("#scqa-answer").press("Tab");
    assert.equal(await page.locator("#scqa-question").inputValue(), "");
    assert.equal(await page.getByRole("button", { name: "Gather supporting material" }).isVisible(), true);
    await page.locator("#scqa-answer").fill("");
    await page.locator("#scqa-answer").press("Tab");
    assert.equal(await page.locator("#scqa-answer-guidance").innerText(), "Add a tentative claim or main answer when you are ready.");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  } finally {
    await context.close();
  }
}
