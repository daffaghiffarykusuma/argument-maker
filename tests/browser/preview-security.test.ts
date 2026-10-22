import { expect, test } from "bun:test";
import { runBrowserWorkflow } from "./run-workflow";

test("keeps imported diagram labels inert without losing their text", async () => {
  expect(await runBrowserWorkflow("preview-security.ts")).toBe(0);
}, 110_000);
