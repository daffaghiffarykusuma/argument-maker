import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("compact header preserves board commands and responsive navigation", async () => {
  expect(await runBrowserWorkflow("compact-header-3021-runner.ts")).toBe(0);
}, 110_000);
