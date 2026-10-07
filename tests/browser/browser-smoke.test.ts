import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("supports the complete Argument Maker browser workflow", async () => {
  expect(await runBrowserWorkflow("workflow.ts")).toBe(0);
}, 110_000);
