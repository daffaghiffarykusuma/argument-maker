import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const testDir = dirname(fileURLToPath(import.meta.url));
function expect(actual: unknown) { return { toBe: (value: unknown) => assert.equal(actual, value), toEqual: (value: unknown) => assert.deepEqual(actual, value), toContain: (value: string) => assert.ok(String(actual).includes(value)), toBeTruthy: () => assert.ok(actual) }; }
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

const appUrl = "http://127.0.0.1:3000";
const smokeDir = join(testDir, "../..", "output", "browser-smoke");
const screenshotPath = join(smokeDir, "gather-first.png");

test("supports the gather-first Argument Maker workflow in Chromium", { timeout: 90_000 }, async () => {
  const server = spawn(process.execPath, [join(testDir, "../..", "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--strictPort", "--port", "3000"], {
    cwd: join(testDir, "../.."), stdio: "ignore", windowsHide: true,
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    console.log("browser-smoke: starting Vite");
    await waitForServer();
    console.log("browser-smoke: launching Chromium");
    browser = await chromium.launch({ headless: true });
    const planningContextModule = "./planning-context.ts";
    const { verifyPlanningContext } = await import(planningContextModule);
    await verifyPlanningContext(browser, appUrl);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(appUrl);
    await page.getByRole("heading", { name: "Gather Facts" }).waitFor();
    console.log("browser-smoke: opened Gather Facts");

    const previewChecks = await page.evaluate(async () => {
      const modulePath = "/tests/browser/preview-lifecycle.ts";
      const { verifyPreviewLifecycle } = await import(/* @vite-ignore */ modulePath);
      return verifyPreviewLifecycle();
    });
    console.log(`browser-smoke: preview lifecycle checked ${previewChecks}`);

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
    await page.locator('[data-action="fact-text"][data-fact-id="fact-1"]').fill("");
    await page.locator("#fact-filter").selectOption("incomplete");
    const filteredEditor = page.locator('[data-action="fact-text"][data-fact-id="fact-1"]');
    await filteredEditor.fill("Demand rose 20%.");
    await filteredEditor.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-action"))).toBe("fact-link");
    expect(await page.locator("#fact-results").innerText()).toBe("0 of 2 facts");
    await page.locator("#board-title").focus();
    await page.locator('.fact-card[data-fact-id="fact-1"]').waitFor({ state: "detached" });
    expect(await page.locator(".fact-card").count()).toBe(0);
    await page.locator("#fact-filter").selectOption("all");
    await page.getByRole("searchbox", { name: "Search facts" }).fill("Demand");
    await page.locator('[data-action="fact-text"][data-fact-id="fact-1"]').fill("Updated finding");
    await page.locator("#board-title").focus();
    await page.locator('.fact-card[data-fact-id="fact-1"]').waitFor({ state: "detached" });
    await page.getByRole("searchbox", { name: "Search facts" }).fill("");
    await fillAndCommit(page, '[data-action="fact-text"][data-fact-id="fact-1"]', "Demand rose 20%.");
    console.log("browser-smoke: reconciled edited filters without interrupting Tab focus");
    console.log("browser-smoke: gathered two complete facts");
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("stage-heading-construct");

    await fillAndCommit(page, '[data-action="scqa"][data-field="situation"]', "Demand is rising.");
    await fillAndCommit(page, '[data-action="scqa"][data-field="complication"]', "Capacity is fixed.");
    await fillAndCommit(page, '[data-action="scqa"][data-field="question"]', "What should change?");
    await fillAndCommit(page, '[data-action="scqa"][data-field="answer"]', "Expand capacity.");
    await fillAndCommit(page, '[data-action="argument-text"][data-argument-id="argument-1"]', "The gap is material.");

    for (const destination of ["situation", "argument-1"]) {
      await page.locator(`[data-disclosure="destination-${destination}"] > summary`).click();
    }
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
    expect(
      await page
        .locator('[data-action="fact-text"][data-fact-id="fact-1"]')
        .evaluateAll((elements) => elements.map((element) => (element as HTMLTextAreaElement).value)),
    ).toEqual(["Demand rose 25%.", "Demand rose 25%."]);
    await sharedEditors.first().blur();
    console.log("browser-smoke: constructed and reused ordered facts");

    // Start with newly rendered editors so native undo belongs to this typing session.
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    await sharedEditors.first().focus();
    await sharedEditors.first().press("End");
    const activeFactEditor = await sharedEditors.first().elementHandle();
    await sharedEditors.first().pressSequentially("!");
    expect(await sharedEditors.evaluateAll((elements) => elements.map((element) => (element as HTMLTextAreaElement).value)))
      .toEqual(["Demand rose 25%.!", "Demand rose 25%.!"]);
    expect(await activeFactEditor!.evaluate((element) => element === document.activeElement)).toBe(true);
    await sharedEditors.first().press(process.platform === "darwin" ? "Meta+z" : "Control+z");
    expect(await sharedEditors.evaluateAll((elements) => elements.map((element) => (element as HTMLTextAreaElement).value)))
      .toEqual(["Demand rose 25%.", "Demand rose 25%."]);
    expect(await activeFactEditor!.evaluate((element) => element === document.activeElement)).toBe(true);
    await activeFactEditor!.dispose();

    const sharedLinks = page.locator('[data-action="fact-link"][data-fact-id="fact-1"]');
    const picker = page.locator('[data-action="attach-fact"][data-destination-id="complication"]');
    const pickerOptions = await picker.innerHTML();
    await sharedLinks.first().fill("invalid-link");
    expect(await sharedLinks.evaluateAll((elements) => elements.map((element) => (element as HTMLInputElement).value)))
      .toEqual(["invalid-link", "invalid-link"]);
    expect(await page.locator('.attached-fact.incomplete[data-fact-id="fact-1"]').count()).toBe(2);
    expect(await picker.innerHTML()).toBe(pickerOptions);
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-action"))).toBe("fact-link");
    await sharedLinks.first().fill("https://example.com/report");
    expect(await page.locator('.attached-fact.incomplete[data-fact-id="fact-1"]').count()).toBe(0);
    await sharedLinks.first().blur();
    const sharedTypes = page.locator('[data-action="fact-data-type"][data-fact-id="fact-1"]');
    await sharedTypes.first().selectOption("observation");
    expect(await sharedTypes.evaluateAll((elements) => elements.map((element) => (element as HTMLSelectElement).value)))
      .toEqual(["observation", "observation"]);
    await sharedTypes.first().selectOption("fact");
    console.log("browser-smoke: preserved native undo and synchronized shared fields and completeness");

    await page.locator('[data-disclosure="destination-complication"] > summary').click();
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
    expect(await page.locator(".preview-view > .verification-note").innerText()).toContain("source quality and factual accuracy are not verified");
    console.log("browser-smoke: rendered Preview and evidence links");

    const diagram = page.locator(".mermaid-diagram svg");
    const originalDiagramId = await diagram.getAttribute("id");
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    await page.getByRole("tab", { name: /Preview/ }).click();
    await diagram.waitFor();
    expect(await diagram.getAttribute("id")).toBe(originalDiagramId);
    await page.getByRole("button", { name: "Readable outline", exact: true }).click();
    await page.getByRole("button", { name: "Diagram", exact: true }).click();
    await diagram.waitFor();
    expect(await diagram.getAttribute("id")).toBe(originalDiagramId);

    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    await fillAndCommit(page, '[data-action="scqa"][data-field="answer"]', "Expand capacity safely.");
    // Leave and return while the changed diagram is still rendering.
    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>("#stage-tab-preview")!.click();
      document.querySelector<HTMLButtonElement>("#stage-tab-construct")!.click();
      document.querySelector<HTMLButtonElement>("#stage-tab-preview")!.click();
    });
    await diagram.waitFor();
    expect(await diagram.getAttribute("id") === originalDiagramId).toBe(false);
    expect(await diagram.textContent()).toContain("Expand capacity safely.");
    // Undo must invalidate the changed diagram even when the original source returns.
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await diagram.waitFor();
    expect(await diagram.textContent()).toContain("Expand capacity.");
    expect((await diagram.textContent())!.includes("Expand capacity safely.")).toBe(false);
    console.log("browser-smoke: reused unchanged diagrams and refreshed edits and undo");

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

    // Metadata, searchable library, and writing exports use the canonical fact.
    await page.locator('[data-disclosure="source-fact-1"] > summary').click();
    await fillAndCommit(page, '[data-field="sourceTitle"][data-fact-id="fact-1"]', "Demand report");
    await fillAndCommit(page, '[data-field="sourceDate"][data-fact-id="fact-1"]', "September 2026");
    await fillAndCommit(page, '[data-field="quotation"][data-fact-id="fact-1"]', "Illustrative quotation");
    await page.getByRole("searchbox", { name: "Search facts" }).fill("quotation September");
    expect(await page.locator(".fact-card").count()).toBe(1);
    const sourceDate = page.locator('[data-field="sourceDate"][data-fact-id="fact-1"]');
    const sourceDisclosure = page.locator('[data-disclosure="source-fact-1"]');
    expect(await sourceDisclosure.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(true);
    await sourceDate.fill("October 2026");
    expect(await page.locator("#fact-results").innerText()).toBe("0 of 3 facts");
    expect(await page.locator(".fact-card").count()).toBe(1);
    await sourceDate.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-field"))).toBe("quotation");
    await page.locator("#board-title").focus();
    await page.locator('.fact-card[data-fact-id="fact-1"]').waitFor({ state: "detached" });
    await page.getByRole("searchbox", { name: "Search facts" }).fill("quotation October");
    expect(await sourceDisclosure.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(true);
    expect(await sourceDate.inputValue()).toBe("October 2026");
    await sourceDate.fill("September 2026");
    await page.locator("#fact-filter").selectOption("unused");
    expect(await page.locator(".fact-card").count()).toBe(0);
    await page.locator("#fact-filter").selectOption("all");
    await page.getByRole("searchbox", { name: "Search facts" }).fill("");
    expect(await sourceDisclosure.evaluate((element) => (element as HTMLDetailsElement).open)).toBe(true);
    await page.getByRole("tab", { name: /Construct Argument/ }).click();
    await page.locator('[data-disclosure="reasoning-argument-1"] > summary').click();
    await fillAndCommit(page, '[data-field="objection"][data-argument-id="argument-1"]', "Demand may fall next year.");
    await page.getByRole("tab", { name: /Construct Argument/ }).focus();
    await page.keyboard.press("ArrowRight");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("stage-tab-preview");
    await page.locator(".mermaid-diagram svg").waitFor();
    expect(await page.locator(".mermaid-diagram svg").evaluate((svg) => svg.getBoundingClientRect().height <= 500)).toBe(true);
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    expect(await page.locator(".zoom-status").innerText()).toContain("125%");
    await page.getByRole("button", { name: "Fit to view" }).click();
    await page.getByRole("button", { name: "Readable outline", exact: true }).click();
    expect(await page.locator(".outline-preview").innerText()).toContain("Demand may fall next year.");
    expect(await page.locator(".outline-preview .writing-document > section:last-of-type li").count()).toBe(3);
    const markdownDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Markdown" }).click();
    const markdownDownload = await markdownDownloadPromise;
    const markdown = await import("node:fs/promises").then(async (fs) => fs.readFile((await markdownDownload.path())!, "utf8"));
    expect(markdown).toContain("Source date: September 2026");
    expect(markdown).toContain("Quotation: Illustrative quotation");
    const textDownloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download text" }).click();
    expect((await textDownloadPromise).suggestedFilename().endsWith(".txt")).toBe(true);
    await page.emulateMedia({ media: "print" });
    expect(await page.locator(".print-document").isVisible()).toBe(true);
    expect(await page.locator(".command-rail").isVisible()).toBe(false);
    const pdf = await page.pdf({ format: "A4" });
    expect(pdf.length > 1000).toBe(true);
    await page.emulateMedia({ media: "screen" });
    console.log("browser-smoke: verified search, metadata, reasoning notes, numbered sources, downloads and print PDF");

    await page.getByRole("checkbox", { name: "Save draft in this browser" }).check();
    await page.getByRole("textbox", { name: "Board title" }).fill("Recovered case");
    await page.getByRole("textbox", { name: "Board title" }).press("Tab");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("autosave");
    await page.reload();
    expect(await page.getByRole("textbox", { name: "Board title" }).inputValue()).toBe("Recovered case");
    expect(await page.locator(".save-status").innerText()).toContain("restored");
    const otherTab = await page.context().newPage();
    await otherTab.goto(appUrl);
    await fillAndCommit(otherTab, "#board-title", "Other tab revision");
    await page.getByRole("button", { name: "Keep saving this board" }).waitFor();
    await page.getByRole("textbox", { name: "Board title" }).fill("Keep my case");
    // Deliberate conflict choice resumes saves without silently overwriting.
    await page.getByRole("button", { name: "Keep saving this board" }).click();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("autosave");
    await page.reload();
    expect(await page.getByRole("textbox", { name: "Board title" }).inputValue()).toBe("Keep my case");
    // The other choice preserves the current board on cancellation and remains undoable on acceptance.
    await otherTab.getByRole("button", { name: "Keep saving this board" }).click();
    const loadOther = page.getByRole("button", { name: "Load other draft" });
    await loadOther.waitFor();
    page.once("dialog", (dialog) => dialog.dismiss());
    await loadOther.click();
    expect(await page.getByRole("textbox", { name: "Board title" }).inputValue()).toBe("Keep my case");
    expect(await page.locator(".save-status").innerText()).toContain("Choose which board");
    page.once("dialog", (dialog) => dialog.accept());
    await loadOther.click();
    expect(await page.getByRole("textbox", { name: "Board title" }).inputValue()).toBe("Other tab revision");
    expect(await page.locator(".conflict-actions").count()).toBe(0);
    expect(await page.locator(".save-status").innerText()).toContain("restored");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("autosave");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    expect(await page.getByRole("textbox", { name: "Board title" }).inputValue()).toBe("Keep my case");
    await otherTab.close();
    await page.getByRole("checkbox", { name: "Save draft in this browser" }).uncheck();
    console.log("browser-smoke: verified recovery, Tab focus, both conflict choices, cancellation and undo");

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
});

async function fillAndCommit(page: Page, selector: string, value: string) {
  const locator = page.locator(selector).first();
  await locator.fill(value);
  await locator.blur();
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(appUrl, { signal: AbortSignal.timeout(1500) })).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Vite did not start.");
}
