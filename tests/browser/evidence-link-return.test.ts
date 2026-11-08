import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("review and outline preserve Evidence Link editing", async () => {
  expect(await runBrowserWorkflow("evidence-link-return-runner.ts")).toBe(0);
}, 110_000);
