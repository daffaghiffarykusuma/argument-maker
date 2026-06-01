import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

export const defaultChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

export interface BrowserHarness {
  startServer(): Promise<void>;
  stopServer(): void;
  screenshot(options: { path: string; width: number; height: number }): void;
  openApp(): Promise<BrowserPage>;
  cleanup(): void;
}

export interface BrowserPage {
  waitFor(expression: string): Promise<void>;
  evaluate(expression: string): Promise<string | boolean | number | null>;
  close(): Promise<void>;
}

export function createBrowserHarness(options?: {
  chromePath?: string;
  appUrl?: string;
  rootDir?: string;
  smokeDir?: string;
  debugPort?: number;
}): BrowserHarness {
  const chromePath = options?.chromePath ?? defaultChromePath;
  const appUrl = options?.appUrl ?? "http://localhost:3000";
  const rootDir = options?.rootDir ?? join(import.meta.dir, "..");
  const smokeDir = options?.smokeDir ?? join(rootDir, ".browser-smoke");
  const debugPort = options?.debugPort ?? 9233;
  let serverProcess: ReturnType<typeof Bun.spawn> | undefined;

  return {
    async startServer() {
      rmSync(smokeDir, { force: true, recursive: true });
      mkdirSync(smokeDir, { recursive: true });
      serverProcess = Bun.spawn(["bun", "--hot", "index.html"], {
        cwd: rootDir,
        stdout: "ignore",
        stderr: "ignore",
      });
      await waitForServer(appUrl);
    },
    stopServer() {
      serverProcess?.kill();
      serverProcess = undefined;
    },
    screenshot({ path, width, height }) {
      const result = Bun.spawnSync([
        chromePath,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        `--user-data-dir=${join(smokeDir, "profile")}`,
        `--window-size=${width},${height}`,
        "--virtual-time-budget=5000",
        `--screenshot=${path}`,
        appUrl,
      ]);

      const screenshotExists = existsSync(path) && statSync(path).size > 0;

      if (result.exitCode !== 0 && !screenshotExists) {
        throw new Error("Chrome screenshot failed.");
      }
    },
    async openApp() {
      const profilePath = join(smokeDir, "cdp-profile");
      const chrome = Bun.spawn([
        chromePath,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${profilePath}`,
        appUrl,
      ], {
        stdout: "ignore",
        stderr: "ignore",
      });
      const client = await connectToChrome(debugPort, appUrl);
      await client.send("Page.navigate", { url: appUrl });

      return {
        waitFor(expression) {
          return waitForExpression(client, expression);
        },
        evaluate(expression) {
          return evaluate(client, expression);
        },
        async close() {
          client.close();
          chrome.kill();
          await chrome.exited;
        },
      };
    },
    cleanup() {
      this.stopServer();
      removeDir(smokeDir);
    },
  };
}

export function canRunBrowserSmoke(chromePath = defaultChromePath): boolean {
  return existsSync(chromePath);
}

async function waitForServer(appUrl: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 10_000) {
    try {
      const response = await fetch(appUrl);
      if (response.ok) {
        return;
      }
    } catch {
      await Bun.sleep(200);
    }
  }

  throw new Error("Timed out waiting for local browser smoke server.");
}

async function connectToChrome(port: number, appUrl: string): Promise<CdpClient> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 10_000) {
    try {
      const tabs = (await fetch(`http://localhost:${port}/json/list`).then((response) => response.json())) as Array<{
        url?: string;
        webSocketDebuggerUrl?: string;
      }>;
      const webSocketUrl =
        tabs.find((tab) => tab.url?.startsWith(appUrl))?.webSocketDebuggerUrl ??
        tabs.find((tab) => tab.webSocketDebuggerUrl)?.webSocketDebuggerUrl;

      if (webSocketUrl) {
        return CdpClient.connect(webSocketUrl);
      }
    } catch {
      await Bun.sleep(200);
    }
  }

  throw new Error("Timed out waiting for Chrome debugging endpoint.");
}

async function waitForExpression(client: CdpClient, expression: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 10_000) {
    if (await evaluate(client, expression)) {
      return;
    }

    await Bun.sleep(200);
  }

  throw new Error(`Timed out waiting for expression: ${expression}`);
}

async function evaluate(client: CdpClient, expression: string): Promise<string | boolean | number | null> {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  return result.result?.value ?? null;
}

class CdpClient {
  private nextId = 1;
  private pending = new Map<number, (value: CdpResult) => void>();

  private constructor(private readonly socket: WebSocket) {
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      const resolve = this.pending.get(message.id);

      if (resolve) {
        this.pending.delete(message.id);
        resolve(message.result);
      }
    });
  }

  static connect(url: string): Promise<CdpClient> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.addEventListener("open", () => resolve(new CdpClient(socket)));
      socket.addEventListener("error", () => reject(new Error("Could not connect to Chrome debugging socket.")));
    });
  }

  send(method: string, params: Record<string, unknown>): Promise<CdpResult> {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));

    return new Promise((resolve) => {
      this.pending.set(id, resolve);
    });
  }

  close() {
    this.socket.close();
  }
}

interface CdpResult {
  result?: {
    value?: string | boolean | number | null;
  };
  [key: string]: unknown;
}

function removeDir(path: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(path, { force: true, recursive: true });
      return;
    } catch {
      Bun.sleepSync(250);
    }
  }
}
