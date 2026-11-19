import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { Browser, Page } from "playwright";
import { answerAppDialog, notice } from "./app-dialog.ts";

const isFocused = (page: Page, selector: string) => page.locator(selector).evaluate((element) => element === document.activeElement);

async function dropFile(page: Page, name: string, contents: string) {
  await page.evaluate(
    ([name, contents]) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([contents!], name!, { type: "application/json" }));
      const fire = (type: string) =>
        document.body.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }));
      fire("dragenter");
      fire("dragover");
      (window as any).dropOverlayShown = document.querySelector("#app")!.classList.contains("file-drop-active");
      fire("drop");
    },
    [name, contents],
  );
}

export async function verifyQualityOfLife(browser: Browser, url: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  try {
    await page.goto(url);
    await page.getByRole("heading", { name: "Construct Argument", exact: true }).waitFor();

    // The tab title follows the board title.
    assert.equal(await page.title(), "Argument Maker");
    // Drafts save by default and say they stay in this browser.
    const saving = page.getByRole("checkbox", { name: "Save draft in this browser" });
    assert.equal(await saving.isChecked(), true);
    assert.match(await page.locator(".save-status").innerText(), /this browser only/);
    await page.getByRole("textbox", { name: "Board title" }).fill("Pilot plan");
    assert.equal(await page.title(), "Pilot plan · Argument Maker");
    console.log("quality-of-life: document title follows the board title");

    // The draft survives reopening with no setup.
    await page.getByRole("textbox", { name: "Board title" }).blur();
    const reopened = await context.newPage();
    await reopened.goto(url);
    assert.equal(await reopened.getByRole("textbox", { name: "Board title" }).inputValue(), "Pilot plan");
    await reopened.close();
    // Turning saving off removes the draft and is remembered for later visits in this browser.
    await saving.uncheck();
    assert.equal(await isFocused(page, "#autosave"), true, "Turning saving off keeps focus on the switch");
    const fresh = await context.newPage();
    await fresh.goto(url);
    assert.equal(await fresh.getByRole("textbox", { name: "Board title" }).inputValue(), "");
    assert.equal(await fresh.getByRole("checkbox", { name: "Save draft in this browser" }).isChecked(), false);
    await fresh.close();
    console.log("quality-of-life: drafts save by default, restore on reopening, and opting out is remembered");

    // Deleting a supporting argument offers Undo, which restores it with focus.
    const argument = page.locator('[data-action="argument-text"]').first();
    await argument.fill("Pilots expose demand early.");
    await argument.blur();
    await page.getByRole("button", { name: "Delete Supporting Argument", exact: true }).first().click();
    assert.equal(await page.locator('[data-action="argument-text"]').count(), 0);
    assert.equal(await notice(page).locator("span").first().innerText(), "Supporting Argument 1 deleted.");
    await notice(page).getByRole("button", { name: "Undo deletion", exact: true }).click();
    assert.equal(await page.locator('[data-action="argument-text"]').first().inputValue(), "Pilots expose demand early.");
    assert.equal(
      await page
        .locator('[data-action="argument-text"]')
        .first()
        .evaluate((element) => element === document.activeElement),
      true,
    );
    assert.equal(await notice(page).innerText(), "Restored.");

    // An undo offer expires once the board changes again.
    await page.getByRole("button", { name: "Delete Supporting Argument", exact: true }).first().click();
    await page.getByRole("button", { name: "+ Argument", exact: true }).click();
    assert.equal(await notice(page).getByRole("button").count(), 0, "A stale undo offer must not undo a later change");
    console.log("quality-of-life: deletion notices undo the right change and expire after later edits");

    // Removing a fact from a destination offers Undo too.
    await page.locator('details[data-disclosure="context"] > summary').click();
    const situation = page.locator('[data-disclosure="destination-situation"]');
    await situation.locator(":scope > summary").click();
    await situation.getByRole("button", { name: "Create new fact here" }).click();
    await situation.locator(".attached-fact").first().getByLabel("Fact text", { exact: true }).fill("Pilot sign-ups doubled.");
    await situation.locator(".attached-fact").first().getByLabel("Descriptive citation", { exact: true }).fill("Field notes, p. 4");
    await situation.getByRole("button", { name: "Remove from here", exact: true }).click();
    assert.equal(await situation.locator(".attached-fact").count(), 0);
    assert.equal(await notice(page).locator("span").first().innerText(), "Fact removed from Situation.");
    await notice(page).getByRole("button", { name: "Undo removal", exact: true }).click();
    assert.equal(await situation.locator(".attached-fact").count(), 1);
    console.log("quality-of-life: removing an attached fact can be undone");

    // Deleting a used fact asks in-page, then offers Undo.
    await page.keyboard.press("Alt+2");
    await page.getByRole("heading", { name: "Gather Facts", exact: true }).waitFor();
    assert.equal(await page.getByRole("tab", { name: "Gather Facts", exact: true }).getAttribute("aria-selected"), "true");
    await page.getByRole("button", { name: "Delete fact", exact: true }).click();
    assert.match(await page.locator("dialog.app-dialog[open]").innerText(), /removed from Situation/);
    await answerAppDialog(page, "confirm");
    assert.equal(await page.locator(".fact-card").count(), 0);
    await notice(page).getByRole("button", { name: "Undo deletion", exact: true }).click();
    assert.equal(await page.locator(".fact-card").count(), 1);
    console.log("quality-of-life: Alt+2 opens Gather Facts; fact deletion confirms in-page and can be undone");

    // Ctrl+S downloads the editable board, even from a text field.
    await page.getByRole("textbox", { name: "Board title" }).focus();
    const download = page.waitForEvent("download");
    await page.keyboard.press("Control+S");
    assert.match((await download).suggestedFilename(), /\.argument\.json$/);
    await page.keyboard.press("Alt+1");
    await page.getByRole("heading", { name: "Construct Argument", exact: true }).waitFor();
    console.log("quality-of-life: Ctrl+S downloads and Alt+1 returns to Construct Argument");

    // ? opens the shortcut list; Escape closes it and focus returns.
    await page.locator("#stage-tab-construct").focus();
    await page.keyboard.press("Shift+Slash");
    const shortcuts = page.getByRole("dialog", { name: "Keyboard shortcuts", exact: true });
    await shortcuts.waitFor();
    assert.match(await shortcuts.innerText(), /Download editable board/);
    assert.match(await shortcuts.innerText(), /Go to Gather Facts/);
    await page.keyboard.press("Escape");
    await shortcuts.waitFor({ state: "detached" });
    assert.equal(await isFocused(page, "#stage-tab-construct"), true);
    await page.locator("#board-menu-toggle").click();
    await page.getByRole("button", { name: "Keyboard shortcuts", exact: true }).click();
    await shortcuts.getByRole("button", { name: "Close", exact: true }).click();
    assert.equal(await isFocused(page, "#board-menu-toggle"), true);
    console.log("quality-of-life: shortcut list opens from ? and the Board menu");

    // Dropping a board file opens it after confirmation; invalid files show an error notice.
    await page.locator("#board-menu-toggle").click();
    const saved = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download editable board", exact: true }).click();
    const contents = (await readFile((await (await saved).path())!, "utf8")).replace("Pilot plan", "Dropped plan");
    await dropFile(page, "dropped.argument.json", contents);
    assert.equal(await page.evaluate(() => (window as any).dropOverlayShown), true, "Dragging a file shows the drop target");
    assert.match(await page.locator("dialog.app-dialog[open]").innerText(), /Replace this board/);
    await answerAppDialog(page, "confirm");
    await page.getByRole("heading", { name: "Gather Facts", exact: true }).waitFor();
    assert.equal(await page.getByRole("textbox", { name: "Board title" }).inputValue(), "Dropped plan");
    assert.equal(await page.locator("#app").evaluate((element) => element.classList.contains("file-drop-active")), false);
    await dropFile(page, "broken.argument.json", "not JSON");
    await notice(page)
      .getByText(/^Could not open broken\.argument\.json\./)
      .waitFor();
    assert.equal(await notice(page).evaluate((element) => element.classList.contains("notice-error")), true);
    assert.equal(
      await page.getByRole("textbox", { name: "Board title" }).inputValue(),
      "Dropped plan",
      "Invalid files leave the board unchanged",
    );
    console.log("quality-of-life: dropped board files open after confirmation and invalid files report an error");

    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
