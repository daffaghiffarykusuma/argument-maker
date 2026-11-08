import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("responsive outline remains available and returns to writing", async () => {
  expect(await runBrowserWorkflow("responsive-outline-03-runner.ts")).toBe(0);
}, 110_000);
