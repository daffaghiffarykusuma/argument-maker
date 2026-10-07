import { spawn, type ChildProcess } from "node:child_process";

// Only terminate a process created by this test and its descendants.
export async function stopOwnedProcess(child: ChildProcess): Promise<void> {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  if (process.platform === "win32") {
    await new Promise<void>((resolve, reject) => {
      const stop = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      stop.once("error", reject);
      stop.once("exit", () => resolve());
    });
  } else {
    // Test processes are spawned in their own group on POSIX.
    try { process.kill(-child.pid, "SIGTERM"); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
  }
  await exited;
}
