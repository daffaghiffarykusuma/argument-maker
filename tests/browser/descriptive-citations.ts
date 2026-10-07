import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const url = "http://127.0.0.1:3005";

test("citation-only research can be entered, found, attached, revised and shared on desktop and mobile", { timeout: 90_000 }, async () => {
  const server = spawn(process.execPath, [join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--strictPort", "--port", "3005"], { cwd: root, stdio: "ignore", windowsHide: true });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(url)).ok) break; } catch {}
      if (attempt > 80) throw new Error("Citation test server did not start");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10_000);
    await page.goto(url);
    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    await page.getByRole("button", { name: "Add fact" }).click();
    await page.getByLabel("Fact text", { exact: true }).fill("Observed a delay");
    await page.getByLabel("Descriptive citation", { exact: true }).fill("Interview <notes>, page 3");
    await page.getByLabel("Descriptive citation", { exact: true }).press("Tab");
    await page.locator('[data-action="fact-data-type"]').selectOption("observation");
    assert.equal(await page.locator(".fact-status").innerText(), "Complete");
    await page.getByRole("searchbox", { name: "Search facts" }).fill("interview");
    assert.equal(await page.locator(".fact-card").count(), 1);
    await page.locator("#fact-filter").selectOption("incomplete");
    assert.equal(await page.locator(".fact-card").count(), 0);
    await page.locator("#fact-filter").selectOption("all");
    await page.getByRole("searchbox", { name: "Search facts" }).fill("");
    const output = join(root, "output/playwright/citations");
    mkdirSync(output, { recursive: true });
    await page.screenshot({ path: join(output, "desktop-entry.png"), fullPage: true });
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    for (const destination of ["situation", "complication"]) {
      await page.locator(`[data-disclosure="destination-${destination}"] > summary`).click();
      await page.locator(`[data-action="attach-fact"][data-destination-id="${destination}"]`).selectOption("fact-1");
    }
    await page.getByLabel("Descriptive citation", { exact: true }).first().fill("Interview <notes>, page 4");
    await page.getByLabel("Descriptive citation", { exact: true }).first().press("Tab");
    assert.equal(await page.getByLabel("Descriptive citation", { exact: true }).nth(1).inputValue(), "Interview <notes>, page 4");
    await page.getByRole("tab", { name: /Preview/ }).click();
    await page.getByRole("button", { name: "Readable outline", exact: true }).click();
    const outline = page.locator(".outline-preview");
    assert.match(await outline.innerText(), /Interview <notes>, page 4/);
    assert.match(await outline.innerText(), /Data Type: Observation/);
    assert.doesNotMatch(await outline.innerText(), /Missing or invalid evidence link/);
    assert.equal(await outline.locator("ol > li").count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(output, "mobile-outline.png"), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Markdown", exact: true }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let contents = "";
    for await (const chunk of stream!) contents += chunk.toString();
    assert.match(contents, /Interview \\<notes\\>, page 4/);
    await page.evaluate(() => { window.print = () => {}; });
    await page.getByRole("button", { name: "Print / Save PDF", exact: true }).click();
    await page.emulateMedia({ media: "print" });
    assert.match(await page.locator(".print-document").innerText(), /Interview <notes>, page 4/);
    await page.screenshot({ path: join(output, "print.png"), fullPage: true });
    await page.emulateMedia({ media: "screen" });
    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    await page.getByLabel("Evidence Link", { exact: true }).fill("javascript:alert(1)");
    await page.getByLabel("Evidence Link", { exact: true }).press("Tab");
    assert.match(await page.locator(".field-guidance").innerText(), /valid http/);
    await page.screenshot({ path: join(output, "mobile-entry.png"), fullPage: true });
    await page.getByRole("tab", { name: /Preview/ }).click();
    assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
    assert.match(await page.locator(".outline-preview").innerText(), /Missing or invalid evidence link/);
  } finally {
    await browser?.close();
    server.kill();
  }
});
