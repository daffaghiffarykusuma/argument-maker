import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("supports optional review and draft writing exports", async () => {
  expect(await runBrowserWorkflow("writing-review-runner.ts")).toBe(0);
}, 110_000);
