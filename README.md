# argument-maker

Helps you create well-thought arguments for writing blog posts, scripting videos, giving reviews, and similar work.

The workspace starts in **Construct Argument** with a Question or tentative Answer. Suggested next actions help you develop your idea, and every workflow tab stays available. **Gather Facts** collects supporting material once for reuse across Situation, Complication, and Supporting Arguments. **Preview** shows the structure and evidence grouped by destination.

Downloaded `.argument.json` files use schema version 2 and include the complete board-scoped Gathered Facts collection. Version-1 files are intentionally unsupported.

New boards start with one supporting argument. Evidence sections collapse to keep
construction compact, with structural checks available in a collapsed checklist and a live outline on
wide screens. Optional reasoning notes cover the connection to the answer,
assumptions, objections, and evidence that would weaken the claim.

Question, Answer, and Supporting Arguments stay visible. Expand Context for
Situation and Complication, or Planning for Audience and Intended outcome;
collapsed sections summarize existing content. On narrower screens, View outline
opens the live outline and returns you to your editing position when closed.
Existing facts show summaries with explicit Edit fact controls. The searchable
fact picker shows sources, usage, and why unavailable items cannot be attached.

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
numbered citations. Use Export writing in the header for Copy Outline, Markdown,
Text, or Print / Save PDF. Board actions include Download editable board for a
portable backup. Reused facts share one source number. Writing outputs include
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
    *.test.ts           # Unit tests for DOM-free UI state
tests/
  browser/              # Chromium scenarios sharing one app server and browser
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

`src/board/fact-library.ts` owns the rules for Gather Facts and Fact
Attachments: search and filters, which facts a destination can attach and why,
fact usage, and what deleting a fact affects. `src/board/construction-guidance.ts`
suggests the next construction step. Both are unit-tested without a browser.

`src/ui/gathered-fact-editing.ts` owns fact-field rendering and editing, shared
editor updates, search/filter state, and filtered-card reconciliation. It keeps
the active editor intact and refreshes completeness across Fact Attachments.
One function decides how a fact's completeness shows, for the full render and
for partial refreshes alike. Browser scenarios cover focus, native undo,
filtering, and shared edits.

`src/ui/writing-review-gate.ts` owns the optional Reasoning review in front of
Writing exports: which panel replaces the stage, which export is waiting, and
whether exports carry the Draft label. It has no DOM and is unit-tested.
`src/ui/editing-position.ts` remembers where the author is writing, holds that
place across the Reasoning review or outline dialog, and restores focus,
selection and scroll after re-rendering. `src/ui/region.ts` replaces one region
of markup while keeping its open disclosures and focused control.

`src/board/argument-preview-projection.ts` is the one projection of a board for
reading: the Mermaid diagram, evidence groups, and the writing document with
numbered sources used by the readable outline, print, Reasoning review, and
Writing exports. `src/board/writing-export.ts` only formats that document.

`src/ui/argument-preview.ts` owns preview markup, mode, diagram caching, pending
renders, failure recovery, zoom, and resize handling. After replacing the app
markup, the browser calls `sync()` even when Preview is inactive, invalidating
older insertion targets. Rendering stays lazy, with one cached source per app.
The Chromium suite exercises this interface with a controlled renderer and
checks actual Mermaid rendering in the complete workflow.

## Checks

```bash
bun run test:unit       # Board logic and DOM-free UI state, no browser required
bun run test:browser    # Every browser scenario; requires Playwright Chromium
bun run test:scenario fact-picker writing-review   # Named scenarios only
bun run typecheck      # Application and test TypeScript
bun run build          # Production bundle in dist/
```

Install the browser once with `bunx playwright install chromium`. Use Node.js 24.x
for the Playwright scenarios. The Bun browser test runs them in one Node process
because Chromium's pipe hangs under Bun on Windows, then reports each scenario as
its own test. `bun test` runs both suites. The runner starts one Vite server on
a free port and one Chromium, runs every scenario in `tests/browser/scenarios.ts`
against them, and closes both after success, failure, or timeout. A scenario that
exceeds `ARGUMENT_SCENARIO_TIMEOUT` (default 180000 ms) fails and the rest still
run. Add a scenario by exporting `(browser, appUrl) => Promise<void>` and
registering it in `tests/browser/scenarios.ts`.
Temporary smoke-test files use `output/browser-smoke/`
and are removed after the run. Local browser-review artifacts live in
`output/playwright/`; generated output is ignored by Git.
