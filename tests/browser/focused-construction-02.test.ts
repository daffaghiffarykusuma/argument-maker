import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("focused construction preserves framing and optional planning", async () => {
  expect(await runBrowserWorkflow("focused-construction-02-runner.ts")).toBe(0);
}, 110_000);
