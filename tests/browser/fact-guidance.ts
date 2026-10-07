import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const url = "http://127.0.0.1:3002";

test("new facts invite writing before validation and preserve keyboard editing", { timeout: 90_000 }, async () => {
  const server = spawn(process.execPath, [join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--strictPort", "--port", "3002"], { cwd: root, stdio: "ignore", windowsHide: true });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    for (let attempt = 0; ; attempt++) {
      if (server.exitCode !== null) throw new Error("Fact guidance server exited before startup");
      try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) break; } catch {}
      if (attempt > 80) throw new Error("Fact guidance server did not start");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on("pageerror", (error) => console.error("fact-guidance page error:", error));
    page.setDefaultTimeout(10_000);
    await page.goto(url, { timeout: 30_000 });
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    let situation = page.locator('[data-disclosure="destination-situation"]');
    await situation.locator("summary").click();
    assert.match(await situation.innerText(), /No facts gathered yet/);
    assert.equal(await situation.getByRole("button", { name: "Create new fact here" }).isVisible(), true);
    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    await page.getByRole("button", { name: "Add fact" }).click();
    assert.equal(await page.locator(".fact-card.incomplete").count(), 0);
    assert.equal(await page.locator(".field-guidance").count(), 0);
    assert.match(await page.locator(".fact-card").innerText(), /Write a finding and identify its source/);
    await page.getByRole("textbox", { name: "Fact text", exact: true }).press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-action")), "fact-link");
    assert.match(await page.locator(".field-guidance").innerText(), /Add fact text/);
    await page.getByRole("textbox", { name: "Fact text", exact: true }).fill("Observed a delay");
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    situation = page.locator('[data-disclosure="destination-situation"]');
    assert.match(await situation.innerText(), /Finish an incomplete fact to attach it/);
    await situation.getByRole("button", { name: "Complete a gathered fact" }).click();

    assert.equal(await page.getByRole("textbox", { name: "Fact text", exact: true }).inputValue(), "Observed a delay");
    await page.getByLabel("Descriptive citation", { exact: true }).fill("Field notes, page 3");
    await page.getByLabel("Descriptive citation", { exact: true }).press("Tab");
    assert.equal(await page.locator(".fact-status").innerText(), "Complete");
    assert.equal(await page.locator(".field-guidance").count(), 0);
    console.log("fact-guidance: fresh and interacted fields, citation completion and Tab focus passed");
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    await situation.getByRole("combobox").selectOption("fact-1");
    assert.match(await situation.innerText(), /All complete facts are already attached here/);
    await page.getByRole("tab", { name: /Gather Facts/ }).click();
    await page.getByRole("button", { name: "Add fact" }).click();
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    assert.match(await situation.innerText(), /All complete facts are already attached here/);
    assert.match(await situation.innerText(), /Finish an incomplete fact to attach it/);
    await situation.getByRole("button", { name: "Complete a gathered fact" }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-fact-id")), "fact-2");
    await page.getByRole("textbox", { name: "Fact text", exact: true }).nth(1).fill("Another finding");
    await page.getByLabel("Descriptive citation", { exact: true }).nth(1).fill("Field notes, page 4");
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    await situation.getByRole("combobox").first().selectOption("fact-2");
    assert.equal(await situation.locator(".attached-fact").count(), 2);
    assert.equal(await situation.getByRole("button", { name: "Complete a gathered fact" }).count(), 0);
    await situation.getByRole("button", { name: "Remove from here" }).last().click();
    assert.equal(await situation.locator('[data-action="attach-fact"]').isEnabled(), true);
    assert.doesNotMatch(await situation.locator(".attachment-guidance").innerText(), /already attached/);
    console.log("fact-guidance: empty, incomplete, all-attached, mixed and attachment recovery passed");
  } finally {
    server.kill();
    await browser?.close();
  }
});
