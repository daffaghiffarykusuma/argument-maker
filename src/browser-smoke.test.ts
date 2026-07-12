import { expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const appUrl = "http://127.0.0.1:3000";
const smokeDir = join(import.meta.dir, "..", ".browser-smoke");
const screenshotPath = join(smokeDir, "desktop.png");

test("supports the Argument Maker workflow in a real browser", async () => {
  const server = Bun.spawn(["bun", "run", "dev", "--", "--strictPort", "--port", "3000"], {
    cwd: join(import.meta.dir, ".."),
    stdout: "ignore",
    stderr: "ignore",
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    await waitForServer();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(appUrl);
    await page.locator('[aria-label="Board tools"]').waitFor();

    mkdirSync(smokeDir, { recursive: true });
    await page.screenshot({ path: screenshotPath });
    expect(existsSync(screenshotPath)).toBe(true);
    expect(await page.locator(".argument-card").count()).toBe(3);
    expect(await page.locator(".data-row").count()).toBe(9);
    expect(await page.locator(".desk-status").innerText()).toContain("3 arguments");

    const situationEvidence = page.locator('[data-action="scqa-evidence-link"][data-field="situation"]');
    const complicationEvidence = page.locator('[data-action="scqa-evidence-link"][data-field="complication"]');
    await situationEvidence.fill("https://example.com/situation");
    await complicationEvidence.fill("https://example.com/complication");
    expect(await situationEvidence.inputValue()).toBe("https://example.com/situation");
    expect(await complicationEvidence.inputValue()).toBe("https://example.com/complication");

    await page.setViewportSize({ width: 390, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.locator('[data-action="scqa"][data-field="answer"]').fill("Yes, recommend it.");
    await page.locator('[data-action="add-argument"]').click();
    expect(await page.locator(".argument-card").count()).toBe(4);

    await page.locator('[data-action="argument-text"]').first().fill("The menu works for groups.");
    await page.locator('[data-action="mode-change"][value="evidence-backed"]').first().check();
    await page.locator('[data-action="data-text"]').first().fill("The menu has a shared platter.");
    await page.locator('[data-action="evidence-link"]').first().fill("not-a-url");

    await page.waitForFunction(() => document.querySelector(".mermaid-box")?.textContent?.includes("invalid evidence link"));
    await page.locator(".mermaid-diagram svg").waitFor();
    expect(await page.locator('[data-action="copy-outline"] svg').count()).toBe(1);
    expect(await page.locator('[data-action="toggle-preview"]').getAttribute("aria-label")).toBe("Hide Argument Preview");
  } finally {
    await browser?.close();
    server.kill();
    rmSync(smokeDir, { force: true, recursive: true });
  }
}, 20_000);

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(appUrl)).ok) {
        return;
      }
    } catch {}
    await Bun.sleep(100);
  }
  throw new Error("Vite did not start.");
}
