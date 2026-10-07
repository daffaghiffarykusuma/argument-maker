import { spawn } from "node:child_process";
import { join } from "node:path";
import { stopOwnedProcess } from "./process-lifecycle";

// Chromium's pipe hangs under Bun on Windows. Bun runs the tests; Node runs Playwright.
export function runBrowserWorkflow(script: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [join(import.meta.dir, script)], {
      stdio: ["ignore", "inherit", "inherit", "ipc"], windowsHide: true,
      detached: process.platform !== "win32",
    });
    let timedOut = false;
    let forceStop: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      timedOut = true;
      // Let the Node runner close Chromium and Vite before falling back to its process tree.
      forceStop = setTimeout(() => { void stopOwnedProcess(child).catch(reject); }, 5_000);
      if (child.connected) child.send({ type: "shutdown" }, () => {});
      else void stopOwnedProcess(child).catch(reject);
    }, 100_000);
    function clearTimers() { clearTimeout(timer); clearTimeout(forceStop); }
    child.once("error", (error) => { clearTimers(); reject(error); });
    child.once("exit", (code) => {
      clearTimers();
      if (timedOut) reject(new Error(`${script} timed out; its browser and server were stopped.`));
      else resolve(code);
    });
  });
}
