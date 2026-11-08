import { expect, test } from 'bun:test';
import { runBrowserWorkflow } from './run-workflow';
test('searchable fact picker preserves writing and destination', async () => {
  expect(await runBrowserWorkflow('fact-picker-05.ts')).toBe(0);
}, 110_000);
