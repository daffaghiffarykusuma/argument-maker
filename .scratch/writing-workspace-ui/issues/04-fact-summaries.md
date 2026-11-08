# 04: Make Gathered Facts easier to scan and edit

**What to build:** Scan existing research as concise summaries and explicitly open editors without losing shared-fact behavior.

**Blocked by:** None (can start immediately)

**Status:** implemented, focused verification passed; broader browser checks limited below

- [x] Existing library and attached fact summaries show finding, Source reference and usage; Edit expands fields, new facts open expanded.
- [x] Explain changes update every use. Canonical edits update all Fact Attachments and summaries without losing text, native undo or focus.
- [x] Preserve metadata, citation-only facts, source reuse, search/filter behavior, attachment ordering and removal.
- [x] Add browser red/green coverage for summaries, editing, shared edits and new facts; verify desktop/mobile.

## Implementation and acceptance evidence

- Existing facts use native Edit fact disclosures with finding and Source reference summaries. Usage and shared-edit scope remain visible. New facts open expanded in the library and at destinations. Editor disclosure state survives normal rerenders and filtered-card restoration.
- Canonical edits update visible summaries and other editors in place. Leaving fact fields reconciles rather than rebuilding their DOM, preserving native text undo across collapse/reopen. Metadata controls and existing source reuse, attachment selection, ordering and removal remain available. No schema or picker redesign.
- Approved seam: real Chromium through the existing harness. Added `tests/browser/fact-summaries-04.ts` and its Bun wrapper, using assigned port 3024 and Node on Windows.
- Red 1: existing library fact editor was visible (`true !== false`, "Existing facts start as summaries"). Green after library disclosure implementation.
- Red 2: attached editor was visible (`true !== false`, "Attached facts start as summaries"). Green after attachment disclosures and in-place shared editing. Native undo uses a single typed character because Chromium may group multi-character typing into separate undo entries.
- Final focused run: 1 passed, 0 failed, 55.14 seconds. Covers keyboard disclosure; collapsed finding/source/usage; collapse/reopen text; active field focus; shared fields and summaries; native undo; citation-only sources; search and unused filter; source reuse; new library and attached editors; attachment ordering/removal; 390px fit with long text.
- Visually inspected generated desktop (1440x1000) and mobile (390x844) screenshots at `output/playwright/fact-summaries-04/desktop-summary.png` and `mobile-editor.png`. No unintended horizontal scrolling in the focused mobile assertion. This is scoped visual verification, not an accessibility compliance audit.
- Passed: `bun run typecheck`, `bun run build`, `bun test ./src/board` (53 tests, 370 assertions), `git diff --check`. Existing fact-guidance browser workflow passed on sequential retry, including Tab focus, source completion, attachment recovery and desktop/mobile new-fact states.
- Adapted shared source-reuse, citation and smoke workflows to open the explicit editor without removing their assertions. Source-reuse checks completed within the smoke run before the main workflow began.

## Verification limits and integration

- Broader smoke run exceeded its 90-second workflow deadline after logging successful edited-filter reconciliation and gathering two complete facts; the parent runner stopped its remaining processes. It is not a full smoke pass.
- Citation browser retries were blocked before UI assertions: first `Vite did not start`, then `page.goto: Timeout 10000ms exceeded` at `http://127.0.0.1:3005/`. Initial concurrent fact-guidance and focused runs also hit page-load timeouts; both later passed sequentially. No harness timeout changes or weakened assertions were made.
- Browser bootstrap initially required installing the matching Chromium into the ignored worktree-local `.scratch/chromium-04` cache because the default cache was inaccessible/missing. To reproduce here, set `PLAYWRIGHT_BROWSERS_PATH` to that directory before running the Bun wrapper. Standard Playwright installations need no special path.
- Integration `375b76e` was merged into this branch before implementation. Changes are limited to ticket 04 UI, its browser checks/adaptations, styles, and this evidence. Ticket 05 should retain the summary/editor behavior when changing attachment selection. Broad browser suites should be rerun after integrating the other UI tickets.
