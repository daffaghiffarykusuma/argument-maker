// Node entry for browser scenarios: `node tests/browser/run-scenarios.ts [name ...]`.
// Chromium's pipe hangs under Bun on Windows, so Bun's test runner spawns this under Node.
import { runScenarios } from "./scenario-harness.ts";
import { optInScenarios, scenarioNames, scenarios } from "./scenarios.ts";

const registry: Record<string, () => Promise<import("./scenario-harness.ts").Scenario>> = { ...scenarios, ...optInScenarios };
const requested = process.argv.slice(2);
const unknown = requested.filter((name) => !(name in registry));
if (unknown.length) {
  console.error(`Unknown scenario: ${unknown.join(", ")}. Known: ${Object.keys(registry).join(", ")}`);
  process.exit(2);
}

const names = requested.length ? requested : scenarioNames;
const results = await runScenarios(names.map((name) => ({ name, load: registry[name]! })), {
  scenarioTimeoutMs: Number(process.env.ARGUMENT_SCENARIO_TIMEOUT ?? 180_000),
  onResult(result) {
    console.log(result.ok ? `PASS ${result.name} (${result.ms} ms)` : `FAIL ${result.name} (${result.ms} ms)\n${result.error}`);
    process.send?.({ type: "result", result });
  },
});
process.exitCode = results.every((result) => result.ok) ? 0 : 1;
