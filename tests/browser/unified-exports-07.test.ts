import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("writing formats are accessible from the header in every stage", async () => {
  expect(await runBrowserWorkflow("unified-exports-07-runner.ts")).toBe(0);
}, 110_000);
