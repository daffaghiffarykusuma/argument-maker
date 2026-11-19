import { mkdir } from "node:fs/promises";
import type { Browser } from "playwright";

/** Screenshots of the compact header at each width and stage, for visual review. */
export async function captureCompactHeaderVisuals(browser: Browser, url: string) {
  const output = "output/playwright/compact-header-3021";
  await mkdir(output, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(url);
  await page.getByRole("heading", { name: "Construct Argument", exact: true }).waitFor();
  await page.screenshot({ path: `${output}/new-board.png` });
  await page.getByRole("tab", { name: "Gather Facts", exact: true }).click();
  await page.getByRole("button", { name: "Worked example", exact: true }).click();
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const stage of ["Construct Argument", "Gather Facts", "Review"]) {
      await page.getByRole("tab", { name: stage, exact: true }).click();
      if (stage === "Review") await page.getByRole("button", { name: "Readable outline", exact: true }).click();
      await page.screenshot({ path: `${output}/${width}-${stage.split(" ")[0]!.toLowerCase()}.png` });
    }
  }
  await page.close();
  console.log("Compact header visual baselines captured");
}
