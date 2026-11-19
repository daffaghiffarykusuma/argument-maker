import { beforeAll, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { stopOwnedProcess } from "./process-lifecycle";
import type { ScenarioResult } from "./scenario-harness";
import { scenarioNames } from "./scenarios";

// One Node process starts Vite and Chromium once and reports each scenario back over IPC.
const results = new Map<string, ScenarioResult>();
let runError: Error | undefined;
const runTimeoutMs = Number(process.env.ARGUMENT_BROWSER_RUN_TIMEOUT ?? 30 * 60_000);

beforeAll(async () => {
  try {
    await runAllScenarios();
  } catch (error) {
    runError = error as Error;
  }
}, runTimeoutMs + 10_000);

for (const name of scenarioNames) {
  test(name, () => {
    if (runError && !results.has(name)) throw runError;
    const result = results.get(name);
    if (!result) throw new Error(`${name} did not run`);
    if (!result.ok) throw new Error(result.error);
    expect(result.ok).toBe(true);
  });
}

function runAllScenarios(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [join(import.meta.dir, "run-scenarios.ts")], {
      stdio: ["ignore", "inherit", "inherit", "ipc"],
      windowsHide: true,
      detached: process.platform !== "win32",
    });
    child.on("message", (message: { type?: string; result?: ScenarioResult }) => {
      if (message.type === "result" && message.result) results.set(message.result.name, message.result);
    });
    let timedOut = false;
    let forceStop: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      timedOut = true;
      // Let the Node runner close Chromium and Vite before falling back to its process tree.
      forceStop = setTimeout(() => {
        void stopOwnedProcess(child).catch(reject);
      }, 5_000);
      if (child.connected) child.send({ type: "shutdown" }, () => {});
      else void stopOwnedProcess(child).catch(reject);
    }, runTimeoutMs);
    const clearTimers = () => {
      clearTimeout(timer);
      clearTimeout(forceStop);
    };
    child.once("error", (error) => {
      clearTimers();
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimers();
      if (timedOut) reject(new Error("Browser scenarios timed out; their browser and server were stopped."));
      else if (code === 2) reject(new Error("Browser scenario runner rejected its arguments."));
      else resolve();
    });
  });
}
