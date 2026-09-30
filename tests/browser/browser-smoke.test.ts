import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { join } from "node:path";

// Playwright's Chromium pipe hangs under Bun on Windows. Run its workflow on Node.
// Bun remains the project's package manager and primary test runner.
test("supports the complete Argument Maker browser workflow", async () => {
  const code = await new Promise<number | null>((resolve, reject) => {
    const child = spawn("node", [join(import.meta.dir, "workflow.ts")], { stdio: "inherit", windowsHide: true });
    const timer = setTimeout(() => { child.kill(); reject(new Error("Browser workflow timed out.")); }, 100_000);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => { clearTimeout(timer); resolve(code); });
  });
  expect(code).toBe(0);
}, 110_000);
