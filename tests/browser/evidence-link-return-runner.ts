import assert from "node:assert/strict";
import { test } from "node:test";
const harnessModule = "./browser-harness.ts";
const { withBrowserWorkflow }: typeof import("./browser-harness") = await import(harnessModule);

for (const destination of ["review", "outline"] as const) {
  test(`returning from ${destination} restores Evidence Link focus and scroll without errors`, async () => {
    await withBrowserWorkflow(3030, async (browser, url) => {
      const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(url);
      await page.locator('details[data-disclosure="context"] > summary').click();
      const facts = page.locator('[data-disclosure="destination-situation"]');
      await facts.locator(":scope > summary").click();
      await facts.getByRole("button", { name: "Create new fact here", exact: true }).click();
      await facts.getByRole("textbox", { name: "Fact text", exact: true }).fill("A traceable finding");
      const link = facts.getByRole("textbox", { name: "Evidence Link", exact: true });
      await link.fill("https://example.com/research");
      const scroll = await page.evaluate(() => window.scrollY);
      if (destination === "review") {
        await page.getByRole("button", { name: "Reasoning review", exact: true }).click();
        await page.getByRole("button", { name: "Back to editing", exact: true }).click();
      } else {
        await page.getByRole("button", { name: "View outline", exact: true }).click();
        await page.getByRole("button", { name: "Close outline", exact: true }).click();
      }
      assert.equal(await link.evaluate(el => el === document.activeElement), true);
      assert.equal(await page.evaluate(() => window.scrollY), scroll);
      assert.equal(await link.inputValue(), "https://example.com/research");
      assert.deepEqual(errors, [], "Returning from an Evidence Link must not raise browser errors");
      await page.close();
    });
  });
}
