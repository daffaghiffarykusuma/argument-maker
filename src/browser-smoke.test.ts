import { expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

const appUrl = "http://127.0.0.1:3000";
const smokeDir = join(import.meta.dir, "..", ".browser-smoke");
const screenshotPath = join(smokeDir, "gather-first.png");

test("supports the gather-first Argument Maker workflow in Chromium", async () => {
  const server = Bun.spawn(["bun", "run", "dev", "--", "--strictPort", "--port", "3000"], {
    cwd: join(import.meta.dir, ".."),
    stdout: "ignore",
    stderr: "ignore",
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(appUrl);
    await page.getByRole("heading", { name: "Gather Facts" }).waitFor();
    console.log("browser-smoke: opened Gather Facts");

    expect(await page.getByRole("tab").count()).toBe(3);
    expect(await page.getByRole("tab", { name: /Gather Facts/ }).getAttribute("aria-selected")).toBe("true");
    expect(await page.locator(".fact-card").count()).toBe(0);

    await page.getByRole("button", { name: "Add fact" }).click();
    await fillAndCommit(page, '[data-action="fact-text"][data-fact-id="fact-1"]', "Demand rose 20%.");
    await fillAndCommit(page, '[data-action="fact-link"][data-fact-id="fact-1"]', "https://example.com/report");
    await page.locator('[data-action="fact-data-type"][data-fact-id="fact-1"]').selectOption("fact");
    expect(await page.locator('[data-fact-id="fact-1"] .fact-status').innerText()).toBe("Complete");

    await page.locator('[data-action="another-fact-source"][data-fact-id="fact-1"]').click();
    expect(await page.locator('[data-action="fact-link"][data-fact-id="fact-2"]').inputValue()).toBe(
      "https://example.com/report",
    );
    await fillAndCommit(page, '[data-action="fact-text"][data-fact-id="fact-2"]', "Capacity stayed flat.");
    expect(await page.locator(".fact-card").count()).toBe(2);

    await fillAndCommit(page, "#board-title", "Capacity case");
    console.log("browser-smoke: gathered two complete facts");
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("stage-heading-construct");

    await fillAndCommit(page, '[data-action="scqa"][data-field="situation"]', "Demand is rising.");
    await fillAndCommit(page, '[data-action="scqa"][data-field="complication"]', "Capacity is fixed.");
    await fillAndCommit(page, '[data-action="scqa"][data-field="question"]', "What should change?");
    await fillAndCommit(page, '[data-action="scqa"][data-field="answer"]', "Expand capacity.");
    await fillAndCommit(page, '[data-action="argument-text"][data-argument-id="argument-1"]', "The gap is material.");

    await page.locator('[data-action="attach-fact"][data-destination-id="situation"]').selectOption("fact-1");
    await page.locator('[data-action="attach-fact"][data-destination-id="situation"]').selectOption("fact-2");
    await page.locator('[data-action="attach-fact"][data-destination-id="argument-1"]').selectOption("fact-1");
    await page
      .locator('[data-action="move-attached-fact"][data-destination-id="situation"][data-fact-id="fact-2"][data-direction="up"]')
      .click();
    expect(
      await page
        .locator('[aria-label="Facts supporting Situation"] .attached-fact [data-action="fact-text"]')
        .first()
        .inputValue(),
    ).toBe("Capacity stayed flat.");

    const sharedEditors = page.locator('[data-action="fact-text"][data-fact-id="fact-1"]');
    await sharedEditors.first().fill("Demand rose 25%.");
    await sharedEditors.first().blur();
    expect(
      await page
        .locator('[data-action="fact-text"][data-fact-id="fact-1"]')
        .evaluateAll((elements) => elements.map((element) => (element as HTMLTextAreaElement).value)),
    ).toEqual(["Demand rose 25%.", "Demand rose 25%."]);
    console.log("browser-smoke: constructed and reused ordered facts");

    await page.locator('[data-action="create-fact-here"][data-destination-id="complication"]').click();
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-fact-id"))).toBe("fact-3");
    await page.getByRole("button", { name: /Complete this fact/ }).click();
    expect(await page.evaluate(() => document.activeElement?.id)).toContain("fact-66-61-63-74-2d-33-text");
    await fillAndCommit(page, '[data-action="fact-text"][data-fact-id="fact-3"]', "Queues are growing.");
    await fillAndCommit(page, '[data-action="fact-link"][data-fact-id="fact-3"]', "https://example.com/queues");
    console.log("browser-smoke: repaired incomplete attached fact");

    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    await page.locator('[data-action="mode-change"][data-argument-id="argument-1"][value="evidence-backed"]').check();
    expect(await page.locator(".checklist").innerText()).toContain("Ready to preview");

    await page.getByRole("tab", { name: /Preview/ }).click();
    await page.locator(".mermaid-diagram svg").waitFor();
    expect(await page.locator(".evidence-group").count()).toBe(3);
    expect(await page.getByRole("link", { name: /Open evidence source for Demand rose 25%/ }).count()).toBe(2);
    expect(await page.locator(".verification-note").innerText()).toContain("source quality and factual accuracy are not verified");
    console.log("browser-smoke: rendered Preview and evidence links");

    mkdirSync(smokeDir, { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    expect(existsSync(screenshotPath)).toBe(true);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Board" }).click();
    const download = await downloadPromise;
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    console.log("browser-smoke: downloaded version-2 board");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Clear Board" }).click();
    expect(await page.locator(".fact-card").count()).toBe(0);
    await page.getByRole("button", { name: "Undo" }).click();
    expect(await page.locator(".fact-card").count()).toBe(3);
    console.log("browser-smoke: cleared and restored board");

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('input[data-action="upload"]').setInputFiles(downloadedPath!);
    await page.getByRole("heading", { name: "Gather Facts" }).waitFor();
    expect(await page.locator(".fact-card").count()).toBe(3);
    console.log("browser-smoke: imported downloaded board");

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('input[data-action="upload"]').setInputFiles({
      name: "version-1.argument.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, appName: "Argument Maker" })),
    });
    expect(await page.locator(".fact-card").count()).toBe(3);
    console.log("browser-smoke: rejected version-1 board");

    await page.setViewportSize({ width: 390, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.getByRole("tab", { name: /Preview/ }).click();
    await page.locator(".mermaid-diagram svg").waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    console.log("browser-smoke: verified 390-pixel Preview");

    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('[data-action="delete-fact"][data-fact-id="fact-1"]').click();
    expect(await page.locator(".fact-card").count()).toBe(2);
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-fact-id"))).toBe("fact-2");
    await page.getByRole("button", { name: "Undo" }).click();
    expect(await page.locator(".fact-card").count()).toBe(3);
    console.log("browser-smoke: restored cascading deletion");
  } finally {
    await browser?.close();
    server.kill();
    rmSync(smokeDir, { force: true, recursive: true });
  }
}, 60_000);

async function fillAndCommit(page: Page, selector: string, value: string) {
  const locator = page.locator(selector).first();
  await locator.fill(value);
  await locator.blur();
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(appUrl)).ok) return;
    } catch {}
    await Bun.sleep(100);
  }
  throw new Error("Vite did not start.");
}
