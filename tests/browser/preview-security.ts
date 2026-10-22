import { test } from "node:test";
import assert from "node:assert/strict";

const boardModule = "../../src/board/argument-board.ts";
const { createDefaultBoard }: typeof import("../../src/board/argument-board") = await import(boardModule);
const harnessModule = "./browser-harness.ts";
const { withBrowserWorkflow }: typeof import("./browser-harness") = await import(harnessModule);

const beacon = "https://diagram-beacon.invalid/pixel";
const cases = [
  `<img src=${beacon}>`,
  `<IMG SRC='${beacon}' srcset='${beacon}?srcset 2x'>`,
  `&lt;img src=${beacon}&gt;`,
  `&#60;img src=${beacon}&#62;`,
  `#60;img src=${beacon}#62;`,
  `ﬂ°lt¶ßimg src=${beacon}ﬂ°gt¶ß`,
  `%%{init: {'htmlLabels': true, 'flowchart': {'htmlLabels': true}, 'securityLevel': 'loose'}}%% <img src=${beacon}>`,
  `x\"]\ninjected[\"<img src=${beacon}>\"]\n%%`,
  `$$x^2$$ <img src=${beacon}>`,
  "style:x%",
  "classDef:x%",
  `\"Yes\" & <notes> > 50% #1; café 日本語 🙂`,
];

test("imported SCQA, argument and reused fact labels cannot load external resources", { timeout: 90_000 }, async () => {
  await withBrowserWorkflow(3011, async (browser, url) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const externalRequests: string[] = [];
    await context.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
      externalRequests.push(route.request().url());
      // Satisfy a vulnerable image without contacting its destination.
      await route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' });
    });
    try {
      for (const text of cases) {
        const page = await context.newPage();
        page.setDefaultTimeout(15_000);
        try {
          await page.goto(url);
          const board = createDefaultBoard();
          for (const slot of Object.values(board.scqa)) slot.text = text;
          board.supportingArguments[0]!.text = text;
          board.gatheredFacts.push({ id: "fact-1", text, touched: true, evidenceLink: "https://example.com/evidence", dataType: "" });
          board.scqa.situation.factIds = ["fact-1"];
          board.supportingArguments[0]!.factIds = ["fact-1"];
          externalRequests.length = 0;
          await page.locator('input[type="file"]').setInputFiles({ name: "untrusted.argument.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(board)) });
          await page.getByRole("heading", { name: "Gather Facts", exact: true }).waitFor();
          await page.getByRole("tab", { name: /Preview/ }).click();
          const svg = page.locator(".mermaid-diagram svg");
          await svg.waitFor();
          assert.deepEqual(externalRequests, [], `External requests for ${JSON.stringify(text)}`);
          assert.equal(await svg.locator(".node").count(), 7, "all expected nodes render without injected statements");
          assert.equal(await svg.locator("img, image, iframe, script, a").count(), 0, "labels cannot introduce active markup");
          if (text === cases.at(-1) || text === "style:x%" || text === "classDef:x%") {
            const labelText = await svg.locator(".node .label").first().textContent();
            assert.equal(labelText, text, "ordinary punctuation and Unicode stay readable");
          }
          if (text === cases.at(-1)) {
            for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
              await page.setViewportSize(viewport);
              await page.getByRole("button", { name: "Fit to view" }).click();
              assert.equal(await svg.evaluate((element) => element.getBoundingClientRect().width <= element.parentElement!.clientWidth), true, "diagram fits desktop and mobile");
            }
          }
          await page.getByRole("button", { name: "Readable outline", exact: true }).click();
          assert.ok((await page.locator(".outline-preview").textContent())?.includes(text), "writing retains original board text");
        } finally { await page.close(); }
      }
    } finally { await context.close(); }
  });
});
