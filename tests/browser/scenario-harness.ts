import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";
import { stopOwnedProcess } from "./process-lifecycle.ts";

export type Scenario = (browser: Browser, appUrl: string) => Promise<void>;
export type ScenarioResult = { name: string; ok: true; ms: number } | { name: string; ok: false; ms: number; error: string };

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Starts one Vite server on a free port and one Chromium, runs each named
 * scenario against them in order, and always stops both. A failing or
 * hanging scenario is recorded and the rest still run.
 */
export async function runScenarios(
  scenarios: Array<{ name: string; load: () => Promise<Scenario> }>,
  options: { scenarioTimeoutMs: number; onResult?: (result: ScenarioResult) => void },
): Promise<ScenarioResult[]> {
  const port = await freePort();
  const appUrl = `http://127.0.0.1:${port}`;
  const server = spawn(
    process.execPath,
    [join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--strictPort", "--port", String(port)],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      detached: process.platform !== "win32",
      // Vite colours its banner when the terminal supports it; readiness is checked by request, not by banner text.
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
    },
  );
  let output = "";
  let serverError: Error | undefined;
  server.stdout.on("data", (chunk) => {
    output += String(chunk);
  });
  server.stderr.on("data", (chunk) => {
    output += String(chunk);
  });
  server.once("error", (error) => {
    serverError = error;
  });

  let browser: Browser | undefined;
  let cleanup: Promise<void> | undefined;
  const close = () =>
    (cleanup ??= (async () => {
      try {
        await browser?.close();
      } catch {
      } finally {
        await stopOwnedProcess(server);
      }
    })());
  const shutdown = () => {
    void close().finally(() => process.exit(1));
  };
  const onMessage = (message: unknown) => {
    if (message && typeof message === "object" && "type" in message && message.type === "shutdown") shutdown();
  };
  process.on("message", onMessage);
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  try {
    await waitForServer(
      appUrl,
      () => {
        if (serverError) throw serverError;
        if (server.exitCode !== null || server.signalCode !== null) throw new Error(`Vite exited before startup: ${output}`);
      },
      () => output,
    );
    browser = await chromium.launch({ headless: true });
    const results: ScenarioResult[] = [];
    for (const { name, load } of scenarios) {
      const started = Date.now();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const scenario = await load();
        await Promise.race([
          scenario(browser, appUrl),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`timed out after ${options.scenarioTimeoutMs} ms`)), options.scenarioTimeoutMs);
          }),
        ]);
        results.push({ name, ok: true, ms: Date.now() - started });
      } catch (error) {
        results.push({
          name,
          ok: false,
          ms: Date.now() - started,
          error: error instanceof Error ? (error.stack ?? error.message) : String(error),
        });
        // A timed-out scenario may still hold pages; give the next one a clean browser.
        if (String(error).includes("timed out")) {
          await browser.close().catch(() => {});
          browser = await chromium.launch({ headless: true });
        }
      } finally {
        clearTimeout(timer);
      }
      options.onResult?.(results.at(-1)!);
    }
    return results;
  } finally {
    await close();
    process.off("message", onMessage);
    process.off("SIGTERM", shutdown);
    process.off("SIGINT", shutdown);
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() => (address && typeof address === "object" ? resolve(address.port) : reject(new Error("No free port"))));
    });
  });
}

async function waitForServer(appUrl: string, check: () => void, output: () => string) {
  const deadline = Date.now() + 30_000;
  while (true) {
    check();
    // Wait for this Vite to report readiness, not an unrelated server that grabbed the port first.
    // ANSI codes are stripped because some terminals colour the banner despite NO_COLOR.
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the escape character starts every ANSI colour code.
    const banner = output().replace(/\x1b\[[0-9;]*m/g, "");
    if (banner.includes(`127.0.0.1:${new URL(appUrl).port}`)) {
      try {
        if ((await fetch(appUrl, { signal: AbortSignal.timeout(1_000) })).ok) return;
      } catch {}
    }
    if (Date.now() >= deadline) throw new Error(`Vite did not start: ${output()}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
