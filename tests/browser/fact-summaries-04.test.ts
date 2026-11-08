import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("fact summaries preserve shared research editing", async () => {
  expect(await runBrowserWorkflow("fact-summaries-04.ts")).toBe(0);
}, 110_000);
