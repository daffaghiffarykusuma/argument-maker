import type { Browser } from "playwright";
import assert from "node:assert/strict";

import { createDefaultBoard } from "../../src/board/argument-board.ts";

const beacon = "https://diagram-beacon.invalid/pixel";
const cases = [
  `<img src=${beacon}>`,
  `<IMG SRC='${beacon}' srcset='${beacon}?srcset 2x'>`,
  `&lt;img src=${beacon}&gt;`,
  `&#60;img src=${beacon}&#62;`,
  `#60;img src=${beacon}#62;`,
  `ﬂ°lt¶ßimg src=${beacon}ﬂ°gt¶ß`,
  `%%{init: {'htmlLabels': true, 'flowchart': {'htmlLabels': true}, 'securityLevel': 'loose'}}%% <img src=${beacon}>`,
  `x"]\ninjected["<img src=${beacon}>"]\n%%`,
  `$$x^2$$ <img src=${beacon}>`,
  "style:x%",
  "classDef:x%",
  `"Yes" & <notes> > 50% #1; café 日本語 🙂`,
];

export async function verifyPreviewSecurity(browser: Browser, url: string) {
  await (async () => {
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
          // Drafts save by default; each case uploads onto an empty board.
          await page.evaluate(() => localStorage.clear());
          await page.reload();
          const board = createDefaultBoard();
          for (const slot of Object.values(board.scqa)) slot.text = text;
          board.supportingArguments[0]!.text = text;
          board.gatheredFacts.push({ id: "fact-1", text, touched: true, evidenceLink: "https://example.com/evidence", dataType: "" });
          board.scqa.situation.factIds = ["fact-1"];
          board.supportingArguments[0]!.factIds = ["fact-1"];
          externalRequests.length = 0;
          await page
            .locator('input[type="file"]')
            .setInputFiles({ name: "untrusted.argument.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(board)) });
          await page.getByRole("heading", { name: "Gather Facts", exact: true }).waitFor();
          await page.getByRole("tab", { name: /Review/ }).click();
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
            for (const viewport of [
              { width: 1440, height: 1000 },
              { width: 390, height: 844 },
            ]) {
              await page.setViewportSize(viewport);
              await page.getByRole("button", { name: "Fit to view" }).click();
              // Desktop fits the whole diagram; a phone keeps labels at reading size and scrolls the canvas sideways instead.
              assert.equal(
                await svg.evaluate((element) => {
                  const width = element.getBoundingClientRect().width;
                  const readable = (element as SVGSVGElement).viewBox.baseVal.width * 0.7;
                  return width <= element.parentElement!.clientWidth || Math.abs(width - readable) < 1;
                }),
                true,
                "diagram fits desktop and stays readable on mobile",
              );
              assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
                true,
                "a wide diagram scrolls inside its canvas, not the page",
              );
            }
          }
          await page.getByRole("button", { name: "Readable outline", exact: true }).click();
          assert.ok((await page.locator(".outline-preview").textContent())?.includes(text), "writing retains original board text");
        } finally {
          await page.close();
        }
      }
    } finally {
      await context.close();
    }
  })();
}
