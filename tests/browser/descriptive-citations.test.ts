import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("supports descriptive citations through the browser workflow", async () => {
  expect(await runBrowserWorkflow("descriptive-citations.ts")).toBe(0);
}, 110_000);
