import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";

const lifecycleModule = "./process-lifecycle.ts";
const { stopOwnedProcess } = await import(lifecycleModule);
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

export async function withBrowserWorkflow(port: number, run: (browser: Browser, appUrl: string) => Promise<void>) {
  const appUrl = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--strictPort", "--port", String(port)], {
    cwd: root, stdio: ["ignore", "pipe", "pipe"], windowsHide: true, detached: process.platform !== "win32",
  });
  let output = "";
  let serverError: Error | undefined;
  server.stdout.on("data", (chunk) => { output += String(chunk); });
  server.stderr.on("data", (chunk) => { output += String(chunk); });
  server.once("error", (error) => { serverError = error; });
  let launch: Promise<Browser> | undefined;
  let cleanup: Promise<void> | undefined;
  const close = () => cleanup ??= (async () => {
    try { await (await launch?.catch(() => undefined))?.close(); }
    finally { await stopOwnedProcess(server); }
  })();
  const shutdown = () => { void close().finally(() => process.exit(1)); };
  const onMessage = (message: unknown) => {
    if (message && typeof message === "object" && "type" in message && message.type === "shutdown") shutdown();
  };
  process.on("message", onMessage);
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  try {
    const deadline = Date.now() + 15_000;
    while (true) {
      if (serverError) throw serverError;
      if (server.exitCode !== null || server.signalCode !== null) throw new Error(`Vite exited before startup: ${output}`);
      // Wait for this Vite process, not an unrelated server that already owns the port.
      if (output.includes("Local:")) {
        try { if ((await fetch(appUrl, { signal: AbortSignal.timeout(1_000) })).ok) break; } catch {}
      }
      if (Date.now() >= deadline) throw new Error(`Vite did not start: ${output}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    launch = chromium.launch({ headless: true });
    await run(await launch, appUrl);
  } finally {
    await close();
    process.off("message", onMessage);
    process.off("SIGTERM", shutdown);
    process.off("SIGINT", shutdown);
  }
}
