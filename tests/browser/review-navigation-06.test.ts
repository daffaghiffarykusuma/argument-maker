import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("returns from reasoning review to the writing context", async () => {
  expect(await runBrowserWorkflow("review-navigation-06-runner.ts")).toBe(0);
}, 110_000);

test("preserves reasoning review notes and keyboard navigation", async () => {
  expect(await runBrowserWorkflow("review-navigation-06-regression-runner.ts")).toBe(0);
}, 110_000);

test("preserves optional review and writing exports", async () => {
  expect(await runBrowserWorkflow("review-navigation-06-writing-runner.ts")).toBe(0);
}, 110_000);
