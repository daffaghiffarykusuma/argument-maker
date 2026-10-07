import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const modulePath = "./writing-review.ts";
const { verifyWritingReview } = await import(modulePath);
const appUrl = "http://127.0.0.1:3008";
const server = spawn(process.execPath, [join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--strictPort", "--port", "3008"], { cwd: root, stdio: "ignore", windowsHide: true });
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(appUrl)).ok) break; } catch {}
    if (attempt >= 80) throw new Error("Writing review test server did not start.");
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  browser = await chromium.launch({ headless: true });
  await verifyWritingReview(browser, appUrl);
  console.log("Writing review browser workflow passed");
} finally {
  await browser?.close();
  server.kill();
}
