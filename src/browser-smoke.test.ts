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
  }, 20_000);

  test("opens into the Command Desk layout with the default hierarchy", async () => {
    await browser.startServer();
    const page = await browser.openApp();

    try {
      await page.waitFor("document.querySelector('[aria-label=\"Board tools\"]') !== null");
      expect(await page.evaluate(`document.querySelector('[aria-label="Board tools"] .mark')?.textContent`)).toBe("AM");
      expect(await page.evaluate(`document.querySelector('.desk-status')?.innerText.includes('3 arguments')`)).toBe(true);
      expect(await page.evaluate(`document.querySelector('.desk-status')?.innerText.includes('9 facts/data')`)).toBe(true);
      expect(await page.evaluate(`document.querySelector('[data-field="answer"]')?.closest('.panel')?.classList.contains('answer-panel')`)).toBe(
        true,
      );
      expect(await page.evaluate(`document.querySelectorAll('.argument-card').length`)).toBe(3);
      expect(await page.evaluate(`document.querySelectorAll('.data-row').length`)).toBe(9);

      const mobileOverflow = await page.evaluate(`
        window.resizeTo(390, 900);
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      `);
      expect(mobileOverflow).toBe(false);
    } finally {
      await page.close();
      browser.cleanup();
    }
  }, 20_000);

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
      await page.waitFor(`document.querySelector('.mermaid-box')?.textContent.includes('Yes, recommend it.')`);
      const mermaidSource = await page.evaluate(`document.querySelector('.mermaid-box')?.textContent ?? ''`);
      const previewText = await page.evaluate(`document.body.innerText`);

      expect(previewText).toContain("Argument Preview");
      expect(mermaidSource).toContain("Yes, recommend it.");
      expect(mermaidSource).toContain("invalid evidence link");
      expect(await page.evaluate(`document.querySelector('[data-action="scqa"][data-field="answer"]') !== null`)).toBe(true);
      expect(await page.evaluate(`document.querySelector('[data-action="toggle-preview"]').getAttribute('aria-label')`)).toBe("Hide Argument Preview");
      expect(await page.evaluate(`document.querySelector('[data-action="toggle-preview"]').getAttribute('data-tooltip')`)).toBe(
        "Hide Argument Preview",
      );
      await page.evaluate(`
        (() => {
          const fact = document.querySelector('[data-action="data-text"]');
          fact.value = 'The menu has a shared platter and private rooms.';
          fact.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        })()
      `);
      await page.waitFor(`document.querySelector('.mermaid-box')?.textContent.includes('private rooms')`);
      await page.waitFor(`document.querySelector('.mermaid-diagram svg') !== null`);
      expect(await page.evaluate(`document.querySelector('.mermaid-diagram svg') !== null`)).toBe(true);
      expect(await page.evaluate(`document.querySelector('[data-action="copy-outline"]').querySelector('svg') !== null`)).toBe(true);
      expect(await page.evaluate(`document.querySelector('[data-action="copy-outline"]').getAttribute('aria-label')`)).toBe("Copy Outline");
      expect(await page.evaluate(`document.querySelector('[data-action="duplicate-argument"]').getAttribute('data-tooltip')`)).toBe(
        "Duplicate Supporting Argument",
      );
      expect(
        await page.evaluate(`
          [
            ['[data-action="download"]', 'Download Board'],
            ['[data-action="undo"]', 'Undo'],
            ['[data-action="redo"]', 'Redo'],
            ['[data-action="clear"]', 'Clear Board'],
            ['[data-action="move-argument"][data-direction="up"]', 'Move Supporting Argument Up'],
            ['[data-action="move-argument"][data-direction="down"]', 'Move Supporting Argument Down'],
            ['[data-action="delete-argument"]', 'Delete Supporting Argument'],
            ['[data-action="move-data"][data-direction="up"]', 'Move Supporting Data or Facts Up'],
            ['[data-action="move-data"][data-direction="down"]', 'Move Supporting Data or Facts Down'],
            ['[data-action="duplicate-data"]', 'Duplicate Supporting Data or Facts'],
            ['[data-action="delete-data"]', 'Delete Supporting Data or Facts'],
            ['[data-action="copy-mermaid"]', 'Copy Mermaid'],
          ].every(([selector, label]) => {
            const node = document.querySelector(selector);
            return node?.querySelector('svg') && node.getAttribute('aria-label') === label && node.getAttribute('data-tooltip') === label;
          })
        `),
      ).toBe(true);
      await page.evaluate(`
        window.confirm = () => true;
        document.querySelector('[data-action="clear"]').click();
      `);
      expect(await page.evaluate(`document.querySelector('[data-action="scqa"][data-field="answer"]').value`)).toBe("");
    } finally {
      await page.close();
      browser.cleanup();
    }
  }, 20_000);

  test("keeps row controls isolated after deleting and adding gaps in the board", async () => {
    await browser.startServer();
    const page = await browser.openApp();

    try {
      await page.waitFor("document.querySelectorAll('.argument-card').length === 3");
      await page.evaluate(`
        const secondArgumentDelete = document.querySelectorAll('[data-action="delete-argument"]')[1];
        secondArgumentDelete.click();
        document.querySelector('[data-action="add-argument"]').click();
      `);
      expect(
        await page.evaluate(`
          (() => {
            const ids = Array.from(document.querySelectorAll('[data-action="argument-text"]')).map((node) => node.dataset.argumentId);
            return new Set(ids).size === ids.length;
          })()
        `),
      ).toBe(true);

      await page.evaluate(`
        const firstCard = document.querySelector('.argument-card');
        firstCard.querySelectorAll('[data-action="delete-data"]')[1].click();
        firstCard.querySelector('[data-action="add-data"]').click();
      `);
      expect(
        await page.evaluate(`
          (() => {
            const firstCard = document.querySelector('.argument-card');
            const ids = Array.from(firstCard.querySelectorAll('[data-action="data-text"]')).map((node) => node.dataset.dataId);
            return new Set(ids).size === ids.length;
          })()
        `),
      ).toBe(true);

      expect(
        await page.evaluate(`
          (() => {
            const firstCard = document.querySelector('.argument-card');
            const rowsBefore = firstCard.querySelectorAll('.data-row').length;
            firstCard.querySelectorAll('[data-action="delete-data"]')[1].click();
            return rowsBefore - document.querySelector('.argument-card').querySelectorAll('.data-row').length;
          })()
        `),
      ).toBe(1);
    } finally {
      await page.close();
      browser.cleanup();
    }
  }, 20_000);
});
