import assert from "node:assert/strict";
import type { Browser } from "playwright";

export async function verifyReasoningReview(browser: Browser, appUrl: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  try {
    await page.goto(appUrl, { timeout: 60000 });
    const reviewTab = page.getByRole("tab", { name: "Review", exact: true });
    const constructTab = page.getByRole("tab", { name: "Construct Argument", exact: true });
    const review = page.getByRole("tabpanel", { name: "Review", exact: true });
    await reviewTab.click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), "stage-heading-preview");
    assert.match(await review.innerText(), /Checks appear as you write/, "An untouched board lists no structural gaps");
    assert.match(await review.innerText(), /Audience not set/);
    assert.match(await review.innerText(), /Intended outcome not set/);
    assert.match(await review.innerText(), /do not establish truth or reasoning quality/);

    await constructTab.click();
    await page.locator("#scqa-question").fill("Should we pilot first?");
    await reviewTab.click();
    await review.getByRole("button", { name: "Add your main answer.", exact: true }).click();
    const answer = page.locator('[data-action="scqa"][data-field="answer"]');
    assert.equal(await answer.evaluate((el) => el === document.activeElement), true, "A structural check opens its field");
    await answer.fill("Run a small pilot first.");
    await page.locator('details[data-disclosure="planning"] > summary').click();
    await page.getByRole("textbox", { name: "Audience (optional)", exact: true }).fill("Service managers");
    await page.getByRole("textbox", { name: "Intended outcome (optional)", exact: true }).fill("Approve a limited pilot");
    await reviewTab.click();
    assert.match(await review.innerText(), /Service managers/);
    assert.match(await review.innerText(), /Approve a limited pilot/);
    assert.match(await review.innerText(), /Run a small pilot first/);
    const connection = review.getByRole("textbox", { name: "How does this reason support your answer?", exact: true });
    await connection.fill("A pilot tests the assumption before committing resources.");
    await connection.press("Tab");
    assert.equal(
      await review.getByRole("textbox", { name: "What are you assuming?", exact: true }).evaluate((el) => el === document.activeElement),
      true,
    );

    // Coming back to a tab resumes where the author left it.
    await constructTab.click();
    assert.equal(
      await page.getByRole("textbox", { name: "Intended outcome (optional)", exact: true }).evaluate((el) => el === document.activeElement),
      true,
    );
    await page.getByText("Challenge this reason", { exact: false }).click();
    assert.equal(
      await page.getByRole("textbox", { name: "How does this reason support your answer?", exact: true }).inputValue(),
      "A pilot tests the assumption before committing resources.",
    );
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await reviewTab.click();
    assert.equal(await connection.inputValue(), "");
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(await connection.inputValue(), "A pilot tests the assumption before committing resources.");

    // Drafts save by default, so reflections survive a reload without any setup.
    assert.equal(await page.getByRole("checkbox", { name: "Save draft in this browser" }).isChecked(), true);
    await page.reload();
    await reviewTab.click();
    assert.equal(await connection.inputValue(), "A pilot tests the assumption before committing resources.");
    await page.setViewportSize({ width: 390, height: 844 });
    await connection.focus();
    await connection.press("Tab");
    assert.equal(
      await review.getByRole("textbox", { name: "What are you assuming?", exact: true }).evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.getByRole("tab", { name: "Gather Facts", exact: true }).click();
    assert.equal(await review.count(), 0);
    await reviewTab.click();
    await page.getByRole("tab", { name: "Gather Facts", exact: true }).click();
    assert.equal(await page.getByRole("tab", { name: "Gather Facts", exact: true }).getAttribute("aria-selected"), "true");
    assert.equal(
      await page.getByRole("heading", { name: "Gather Facts", exact: true }).evaluate((el) => el === document.activeElement),
      true,
    );
  } finally {
    await context.close();
  }
}
