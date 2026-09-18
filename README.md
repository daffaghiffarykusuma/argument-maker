# argument-maker

Helps you create well-thought arguments for writing blog posts, scripting videos, giving reviews, and similar work.

The workspace starts in **Gather Facts**, where source-linked facts are collected once and can then be reused across Situation, Complication, and Supporting Arguments. **Construct Argument** shapes the SCQA and supporting reasons, while **Preview** shows the Mermaid structure and evidence grouped by destination.

Downloaded `.argument.json` files use schema version 2 and include the complete board-scoped Gathered Facts collection. Version-1 files are intentionally unsupported.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To test:

```bash
bun test
```

Bun is the package manager, script runner, and primary test runner. Vite is the development server and production bundler.

## Project layout

```text
src/
  app.ts                # Browser entry point
  board/                # Board model, session, file contract, preview and review
    *.test.ts           # Unit tests beside the modules they exercise
  ui/                   # Browser rendering, event handling and styles
tests/
  browser/              # End-to-end Chromium workflow test
public/                 # Static assets copied by Vite
docs/
  prd/                  # Product requirements
  issues/               # Implementation issue specifications
```

Start with `src/board/argument-board.ts` for board data and commands,
`src/board/argument-board-session.ts` for workflow state and undo/redo, or
`src/ui/argument-board-browser.ts` for UI changes. Product terminology lives in
[CONTEXT.md](CONTEXT.md).

## Checks

```bash
bun run test:unit       # Board logic, no browser required
bun run test:browser    # Full workflow; requires Playwright Chromium
bun run typecheck      # Application and test TypeScript
bun run build          # Production bundle in dist/
```

Install the browser once with `bunx playwright install chromium`. `bun test`
runs both test suites. The browser test starts its own Vite server on port 3000;
keep that port free. Temporary smoke-test files use `output/browser-smoke/`
and are removed after the run. Local browser-review artifacts live in
`output/playwright/`; generated output is ignored by Git.
