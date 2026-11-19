import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Browser } from "playwright";

/** Moving to Review and back resumes each tab exactly where the author left it, and a waiting export survives the trip. */
export async function verifyReviewNavigation(browser: Browser, appUrl: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 800 } });
  const page = await context.newPage();
  try {
    const screenshots = join(process.cwd(), "output/playwright/review-navigation-06");
    await mkdir(screenshots, { recursive: true });
    await page.goto(appUrl);
    const reviewTab = page.getByRole("tab", { name: "Review", exact: true });
    const constructTab = page.getByRole("tab", { name: "Construct Argument", exact: true });
    const gatherTab = page.getByRole("tab", { name: "Gather Facts", exact: true });
    const review = page.getByRole("tabpanel", { name: "Review", exact: true });
    const answer = page.getByRole("textbox", { name: "What is your tentative claim or main answer? Answer", exact: true });
    await answer.fill("Run a small pilot first.\n".repeat(40));
    await answer.press("Home");
    await answer.press("Shift+ArrowRight");
    const caret = (el: HTMLTextAreaElement) => ({
      start: el.selectionStart,
      end: el.selectionEnd,
      scroll: el.scrollTop,
      y: window.scrollY,
    });
    const before = await answer.evaluate(caret);
    await reviewTab.click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), "stage-heading-preview");
    await page.screenshot({ path: join(screenshots, "review-desktop.png"), fullPage: true });
    await constructTab.press("Enter");
    assert.equal(await answer.evaluate((el) => el === document.activeElement), true, "Returning restores the editor that was in use");
    assert.deepEqual(await answer.evaluate(caret), before);
    assert.equal(await answer.inputValue(), "Run a small pilot first.\n".repeat(40));

    await page.locator('details[data-disclosure="planning"] > summary').click();
    await page.getByRole("textbox", { name: "Audience (optional)", exact: true }).fill("Private planning audience");
    await reviewTab.click();
    await page.locator("#writing-menu-toggle").click();
    await page.getByRole("button", { name: "Text", exact: true }).click();
    await page.getByRole("button", { name: "Review now", exact: true }).press("Enter");
    assert.equal(await reviewTab.getAttribute("aria-selected"), "true");
    await constructTab.click();
    await reviewTab.click();
    const continuation = review.getByRole("button", { name: "Continue to export", exact: true });
    assert.equal(await continuation.count(), 1, "Leaving Review keeps the selected export waiting");
    const download = page.waitForEvent("download");
    await continuation.press("Enter");
    const contents = await readFile((await (await download).path())!, "utf8");
    assert.match(contents, /Run a small pilot first/);
    assert.doesNotMatch(contents, /Private planning audience|\bDraft\b/);
    assert.equal(await continuation.count(), 0, "The export is no longer waiting once it ran");

    await page.setViewportSize({ width: 390, height: 844 });
    await gatherTab.click();
    await page.getByRole("button", { name: "+ Add fact", exact: true }).click();
    const fact = page.getByRole("textbox", { name: "Fact text", exact: true });
    await fact.fill("Interview participants asked for a pilot.");
    await fact.press("Home");
    await fact.press("Shift+ArrowRight");
    const initialY = await page.evaluate(() => window.scrollY);
    await page.mouse.move(380, 700);
    await page.mouse.wheel(0, 180);
    await page.waitForFunction((y) => window.scrollY > y, initialY);
    const gatherY = await page.evaluate(() => window.scrollY);
    await reviewTab.press("Enter");
    await gatherTab.press("Enter");
    assert.equal(await gatherTab.getAttribute("aria-selected"), "true");
    assert.equal(await fact.evaluate((el) => el === document.activeElement), true);
    assert.deepEqual(await fact.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd]), [0, 1]);
    assert.equal(await page.evaluate(() => window.scrollY), gatherY, "Return preserves scrolling done while gathering facts");
    assert.equal(await fact.inputValue(), "Interview participants asked for a pilot.");

    await reviewTab.click();
    const outline = page.getByRole("button", { name: "Readable outline", exact: true });
    await outline.click();
    const reviewY = await page.evaluate(() => window.scrollY);
    assert.match(await review.innerText(), /Every reflection is optional/);
    await review.getByRole("heading", { name: "Structural checks", exact: true }).waitFor();
    await page.screenshot({ path: join(screenshots, "review-mobile.png"), fullPage: true });
    await gatherTab.click();
    await reviewTab.click();
    assert.equal(await outline.evaluate((el) => el === document.activeElement), true);
    assert.equal(await outline.getAttribute("aria-pressed"), "true");
    assert.equal(await page.evaluate(() => window.scrollY), reviewY);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  } finally {
    await context.close();
  }
}
