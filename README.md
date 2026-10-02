# argument-maker

Helps you create well-thought arguments for writing blog posts, scripting videos, giving reviews, and similar work.

The workspace starts in **Gather Facts**, where source-linked facts are collected once and can then be reused across Situation, Complication, and Supporting Arguments. **Construct Argument** shapes the SCQA and supporting reasons, while **Preview** shows the Mermaid structure and evidence grouped by destination.

Downloaded `.argument.json` files use schema version 2 and include the complete board-scoped Gathered Facts collection. Version-1 files are intentionally unsupported.

New boards start with one supporting argument. Evidence sections collapse to keep
construction compact, with a persistent readiness checklist and a live outline on
wide screens. Optional reasoning notes cover the connection to the answer,
assumptions, objections, and evidence that would weaken the claim.

Use the worked example to explore a complete board. Search facts by content or
source metadata, or filter for unused and incomplete facts. Source titles, dates,
quotations, and reasoning notes are optional and round-trip in version-2 files.
Older version-2 files remain supported.

Preview includes a fitted diagram with zoom controls and a readable outline with
numbered citations. Download Markdown or text for writing, or use Print / Save PDF
for the print layout. Reused facts share one source number. These outputs include
attached facts; board JSON also preserves unused research.

Draft saving is off by default. Enable **Save draft in this browser** to recover
your board after refresh or reopening. Drafts stay in local browser storage, which
may be cleared by browser settings. Disabling saving removes the stored draft and
keeps the current board in the tab. A conflict notice pauses autosave when another
tab changes the draft. Download board JSON for a portable backup.

Workflow tabs support Left/Right Arrow, Home, and End. Ctrl/Cmd+Z and redo shortcuts
operate on the board outside text editors; editors retain native text undo.

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

Use Node.js 24.x for Node-based tooling. The `.nvmrc` file selects major version 24
for compatible version managers, and `package.json` pins `engines.node` to `24.x`
so Vercel uses Node.js 24 for new deployments. Deploy the updated repository to
apply this setting on Vercel.

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

Install the browser once with `bunx playwright install chromium`. Use Node.js 24.x
for the Playwright workflow. The Bun browser test runs that
workflow in Node because Chromium's pipe hangs under Bun on Windows. `bun test`
runs both test suites. The browser test starts its own Vite server on port 3000;
keep that port free. Temporary smoke-test files use `output/browser-smoke/`
and are removed after the run. Local browser-review artifacts live in
`output/playwright/`; generated output is ignored by Git.
