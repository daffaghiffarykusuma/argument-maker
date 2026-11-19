# Development

## Tooling

- **Bun** is the package manager, script runner, and unit test runner.
- **Vite** is the development server and production bundler.
- **Node.js 24.x** runs the Playwright scenarios. `.nvmrc` selects it for version
  managers, and `package.json` pins `engines.node` so Vercel deploys with Node.js 24.
- **Biome** lints TypeScript, JSON, and CSS, and formats TypeScript and JSON.

```bash
bun install
bunx playwright install chromium   # once, for the browser suite
bun run dev
```

To make `git blame` skip the one-time formatting commit:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

## Checks

```bash
bun run lint            # Biome lint and format check
bun run format          # Apply Biome formatting and safe fixes
bun run typecheck       # Application and test TypeScript
bun run test:unit       # Board logic and DOM-free UI state, no browser required
bun run test:browser    # Every browser scenario; requires Node.js 24 and Playwright Chromium
bun run test:scenario fact-picker writing-review   # Named scenarios only
bun test                # Both suites
bun run build           # Production bundle in dist/
```

GitHub Actions runs lint, typecheck, unit tests, and the build on every push to
`main` and every pull request, with the browser suite as a separate job that
uploads `output/` when it fails.

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
  issues/               # Implementation specifications and verification notes
```

Start with `src/board/argument-board.ts` for board data and commands,
`src/board/argument-board-session.ts` for workflow state and undo/redo, or
`src/ui/argument-board-browser.ts` for UI changes. UI commands are registered by
`data-action` name in the `actions` table there; buttons and keyboard shortcuts
dispatch through the same handlers. Product terminology lives in
[GLOSSARY.md](../GLOSSARY.md).

`src/board/local-draft.ts` owns draft restoration, save timing, conflict choices,
saved-board tracking, and whether to suggest turning saving on. It coordinates the
session's existing import and undo behavior. Browser controls forward events and
display its snapshot; recovery tests use memory storage and a controlled clock
through the same interface.

`src/board/fact-library.ts` owns the rules for Gather Facts and Fact
Attachments: search and filters, which facts a destination can attach and why,
fact usage, and what deleting a fact affects. `src/board/construction-guidance.ts`
suggests the next construction step. Both are unit-tested without a browser.

`src/ui/gathered-fact-editing.ts` owns fact-field rendering and editing, shared
editor updates, search/filter state, and filtered-card reconciliation. It keeps
the active editor intact and refreshes completeness across Fact Attachments.
One function decides how a fact's completeness shows, for the full render and
for partial refreshes alike.

`src/ui/writing-review-gate.ts` owns the optional Reasoning review in front of
Writing exports: which panel replaces the stage, which export is waiting, and
whether exports carry the Draft label. It has no DOM and is unit-tested.
`src/ui/editing-position.ts` remembers where the author is writing, holds that
place across the Reasoning review or outline dialog, and restores focus,
selection and scroll after re-rendering. `src/ui/region.ts` replaces one region
of markup while keeping its open disclosures and focused control.

`src/ui/app-dialog.ts` provides the in-page confirmation and shortcut dialogs
used instead of `window.confirm` and `window.alert`. A dialog settles in the same
task as the author's choice, so the outcome is applied before it is seen to close.
The notice region in `argument-board-browser.ts` shows copy feedback, file errors,
and Undo offers; an Undo offer expires as soon as the board changes again.

`src/board/argument-preview-projection.ts` is the one projection of a board for
reading: the Mermaid diagram, evidence groups, and the writing document with
numbered sources used by the readable outline, print, Reasoning review, and
Writing exports. `src/board/writing-export.ts` only formats that document.

`src/ui/argument-preview.ts` owns preview markup, mode, diagram caching, pending
renders, failure recovery, zoom, and resize handling. After replacing the app
markup, the browser calls `sync()` even when Preview is inactive, invalidating
older insertion targets. Rendering stays lazy, with one cached source per app.

## Browser scenarios

Chromium's pipe hangs under Bun on Windows, so the Bun browser test runs every
scenario in one Node process and reports each as its own test. The runner starts
one Vite server on a free port and one Chromium, runs every scenario in
`tests/browser/scenarios.ts` against them, and closes both after success,
failure, or timeout. A scenario that exceeds `ARGUMENT_SCENARIO_TIMEOUT`
(default 180000 ms) fails and the rest still run.

Add a scenario by exporting `(browser, appUrl) => Promise<void>` and registering
it in `tests/browser/scenarios.ts`. Answer the app's confirmation dialogs with
`answerAppDialog` from `tests/browser/app-dialog.ts`.

Temporary smoke-test files use `output/browser-smoke/` and are removed after the
run. Browser review artifacts live in `output/playwright/`; generated output is
ignored by Git.
