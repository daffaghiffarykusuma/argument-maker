# argument-maker

Helps you create well-thought arguments for writing blog posts, scripting videos, giving reviews, and similar work.

The workspace starts in **Construct Argument** with a Question or tentative Answer. Suggested next actions help you develop your idea, and every workflow tab stays available. **Gather Facts** collects supporting material once for reuse across Situation, Complication, and Supporting Arguments. **Preview** shows the structure and evidence grouped by destination.

Downloaded `.argument.json` files use schema version 2 and include the complete board-scoped Gathered Facts collection. Version-1 files are intentionally unsupported.

New boards start with one supporting argument. Evidence sections collapse to keep
construction compact, with structural checks available in a collapsed checklist and a live outline on
wide screens. Optional reasoning notes cover the connection to the answer,
assumptions, objections, and evidence that would weaken the claim.

Use the worked example to explore a complete board. Search facts by content or
source metadata, or filter for unused and incomplete facts. Source titles, dates,
quotations, and reasoning notes are optional and round-trip in version-2 files.
Older version-2 files remain supported.

A fact needs text and either an HTTP/HTTPS Evidence Link or a Descriptive citation,
such as a book passage, interview, or observation record. You can include both.
Supplied URLs still receive format checks; the app does not verify source quality
or factual accuracy. Another fact from this source reuses the source details and
leaves the new finding and quotation blank.

Audience and Intended outcome are optional planning prompts. They stay in board
files and enabled local drafts, and appear during Reasoning review. Writing
exports omit them.

Preview includes a fitted diagram with zoom controls and a readable outline with
numbered citations. Download Markdown or text for writing, or use Print / Save PDF
for the print layout. Reused facts share one source number. These outputs include
attached facts; board JSON also preserves unused research.

Before the first writing export in a board session, choose **Review now** or
**Export draft**. Review shows structural gaps, purpose, and optional reasoning
prompts. **Continue to export** resumes the selected action without requiring
answers or certifying the argument. Draft exports visibly include **Draft** in
Copy Outline, Markdown, text, and print output. Review and the Draft label remain
available afterward. Importing or clearing a board resets the invitation;
ordinary edits do not. Download Board is always immediately available.

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
[GLOSSARY.md](GLOSSARY.md).

`src/board/local-draft.ts` owns draft restoration, save timing, conflict choices,
and saved-board tracking. It coordinates the session's existing import and undo
behavior. Browser controls forward events and display its snapshot; recovery
tests use memory storage and a controlled clock through the same interface.

`src/ui/gathered-fact-editing.ts` owns fact-field rendering and editing, shared
editor updates, search/filter state, and filtered-card reconciliation. It keeps
the active editor intact and refreshes completeness across Fact Attachments.
Board commands and history remain in `src/board/`; browser workflow tests cover
focus, native undo, filtering, and shared edits.

`src/ui/argument-preview.ts` owns preview markup, mode, diagram caching, pending
renders, failure recovery, zoom, and resize handling. After replacing the app
markup, the browser calls `sync()` even when Preview is inactive, invalidating
older insertion targets. Rendering stays lazy, with one cached source per app.
The Chromium suite exercises this interface with a controlled renderer and
checks actual Mermaid rendering in the complete workflow.

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
runs both test suites. Browser workflows start their own Vite servers on ports
3000, 3002, 3005, and 3008; keep those ports free. The shared runner closes
Chromium and its test server after success, failure, or timeout.
Temporary smoke-test files use `output/browser-smoke/`
and are removed after the run. Local browser-review artifacts live in
`output/playwright/`; generated output is ignored by Git.
