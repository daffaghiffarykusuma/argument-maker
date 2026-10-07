import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { join } from "node:path";

test("supports optional review and draft writing exports", async () => {
  const code = await new Promise<number | null>((resolve, reject) => {
    const child = spawn("node", [join(import.meta.dir, "writing-review-runner.ts")], { stdio: "inherit", windowsHide: true });
    const timer = setTimeout(() => { child.kill(); reject(new Error("Writing review browser workflow timed out.")); }, 100_000);
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => { clearTimeout(timer); resolve(code); });
  });
  expect(code).toBe(0);
}, 110_000);
