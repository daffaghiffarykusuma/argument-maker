import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("guides fact entry and attachment recovery", async () => {
  expect(await runBrowserWorkflow("fact-guidance.ts")).toBe(0);
}, 110_000);
