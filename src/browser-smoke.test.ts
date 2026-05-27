import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { canRunBrowserSmoke, createBrowserHarness } from "./browser-harness";

const smokeDir = join(import.meta.dir, "..", ".browser-smoke");
const screenshotPath = join(smokeDir, "desktop.png");

describe.skipIf(!canRunBrowserSmoke())("browser smoke", () => {
  const browser = createBrowserHarness({ smokeDir });

  test("renders the default board in a real browser", async () => {
    await browser.startServer();
    try {
      browser.screenshot({ path: screenshotPath, width: 1440, height: 1000 });
      expect(existsSync(screenshotPath)).toBe(true);
    } finally {
      browser.cleanup();
    }
  });

  test("supports the core board flow in a real browser", async () => {
    await browser.startServer();
    const page = await browser.openApp();

    try {
      await page.waitFor("document.querySelector('[data-action=\"scqa\"][data-field=\"answer\"]') !== null");
      await page.evaluate(`
        const answer = document.querySelector('[data-action="scqa"][data-field="answer"]');
        answer.value = 'Yes, recommend it.';
        answer.dispatchEvent(new Event('input', { bubbles: true }));
      `);
      await page.evaluate(`document.querySelector('[data-action="add-argument"]').click();`);
      expect(await page.evaluate(`document.querySelectorAll('.argument-card').length`)).toBe(4);
      await page.evaluate(`
        const argument = document.querySelector('[data-action="argument-text"]');
        argument.value = 'The menu works for groups.';
        argument.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('[data-action="mode-change"][value="evidence-backed"]').click();
        const fact = document.querySelector('[data-action="data-text"]');
        fact.value = 'The menu has a shared platter.';
        fact.dispatchEvent(new Event('input', { bubbles: true }));
        const link = document.querySelector('[data-action="evidence-link"]');
        link.value = 'not-a-url';
        link.dispatchEvent(new Event('input', { bubbles: true }));
      `);
      await page.evaluate(`document.querySelector('[data-action="duplicate-argument"]').click();`);
      expect(
        await page.evaluate(
          `Array.from(document.querySelectorAll('[data-action="argument-text"]')).filter((node) => node.value === 'The menu works for groups.').length`,
        ),
      ).toBe(2);
      await page.evaluate(`document.querySelector('[data-action="mode"][data-mode="preview"]').click();`);
      const previewText = await page.evaluate(`document.body.innerText`);

      expect(previewText).toContain("Argument Preview");
      expect(previewText).toContain("Yes, recommend it.");
      expect(previewText).toContain("invalid evidence link");
      await page.evaluate(`
        window.confirm = () => true;
        document.querySelector('[data-action="mode"][data-mode="board"]').click();
        document.querySelector('[data-action="clear"]').click();
      `);
      expect(await page.evaluate(`document.querySelector('[data-action="scqa"][data-field="answer"]').value`)).toBe("");
    } finally {
      await page.close();
      browser.cleanup();
    }
  }, 20_000);
});
