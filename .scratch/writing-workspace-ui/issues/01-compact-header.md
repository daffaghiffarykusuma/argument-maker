# 01: Replace the command rail with a compact header

**What to build:** Write in a calmer dark workspace with a compact desktop header and labeled mobile controls.

**Blocked by:** None (can start immediately)

**Status:** implemented; final evidence being recorded

- [x] Replace the rail with a compact header; retain board file actions, undo/redo, local saving controls and replacement protection.
- [x] Group file actions under Board, separate Clear, use labeled mobile More, and remove workflow step numbers without losing keyboard navigation.
- [x] Use charcoal surfaces, system font, larger writing text, fewer borders and responsive comfortable targets. Keep existing writing actions functional until ticket 07.
- [x] Add browser behavior coverage, inspect desktop/mobile layout and preserve existing workflows.

## Implementation and acceptance evidence

- Branch: `t3/compact-workspace-header`. Worktree: `C:\Users\Lenovo\.t3\worktrees\argument-maker\t3-57dfc009`.
- Confirmed integration `bf59851` was an ancestor before starting. Committed implementation as `7d0303c`, then merged the current integration tip `cc4a053` with merge commit `d68e563`. This includes ticket 04, which arrived after the checkbox-formatting update. No merge conflicts; integration itself was not modified.
- Shell changes retain existing board commands, local draft controls and replacement confirmations. File commands are in a native Board disclosure, called More on mobile. Escape and completed commands close the disclosure and return focus; outside clicks dismiss it. Undo/redo remain labeled. Workflow tabs retain their existing arrow/Home/End keyboard behavior without step numbers.
- Copy Outline remains the existing writing action. Its mobile label is Export and accessible name is `Export writing: Copy Outline`. Format consolidation is still ticket 07. Review and fact markup were not changed by ticket 01; ticket 04 markup arrived through integration.
- Visual treatment uses charcoal surfaces, system fonts, fewer construction borders, and 16px writing text with an 18px Answer. Removed obsolete rail styles and kept the header out of printed writing.

### Red before green

- Cycle 1: Chromium reached the original app and failed waiting for the new `Workspace commands` banner. The compact header, native disclosure, Escape focus return and unnumbered keyboard tabs then passed.
- Cycle 2: the populated-board workflow downloaded the board, cancelled Clear and exercised undo/redo, then failed with `Board !== More` at 390px. Responsive labels and header spacing then passed, including 1440, 1024, 390 and 320px overflow checks and 44px header targets.
- Regression cycle: writing review failed because the open Board menu intercepted Preview after download. Closing menu actions fixed the obstruction. Coverage now asserts dismissal and focus after download, while retaining all existing writing assertions.
- Initial missing dependencies/Chromium and a provider usage interruption were infrastructure failures, not behavioral red tests. Locked dependencies and the matching Playwright Chromium were installed before collecting behavioral evidence.

### Checks

- Passed after merging integration: `bun test ./tests/browser/compact-header-3021.test.ts` (1 pass); `node tests/browser/compact-header-3021-regression-runner.ts --smoke` (1 pass, 67.01s); `node tests/browser/compact-header-3021-regression-runner.ts --fact-guidance` (1 pass, 45.61s).
- The smoke workflow retains question-first writing, planning context, source reuse, reasoning review, shared edits, native editor undo, clipboard success/failure recovery, preview lifecycle, file download/import/rejection, Clear/undo, local draft restoration and both cross-tab conflict choices, numbered writing downloads, print/PDF, mobile fit and cascading deletion assertions.
- Passed after merging integration: `bun run typecheck`, `bun run test:unit` (53 tests), `bun run build`, `git diff --check`. Build retains the existing large Mermaid chunk warning.
- Writing regression passed before integration merge. Final merged-state writing regression and refreshed screenshots are being recorded below.
- The uniquely named runners use the existing Chromium harness on assigned port 3021. Node runs Chromium on Windows; Bun remains the test/package runner. Shared workflow default ports and deadlines remain unchanged; the ticket runner selects 3021 and a 180-second smoke allowance. An earlier run reached all assertions but exceeded the shared 90-second deadline during cleanup; the final merged-state run completed in 67 seconds.

### Visual baseline and limits

- Generated new-board and populated construction, research, readable writing and review captures at desktop 1440px, laptop 1024px and phone 390px in ignored `output/playwright/compact-header-3021/`. Reproduce with `node tests/browser/compact-header-3021-regression-runner.ts --visual`.
- Inspected desktop construction/research, laptop construction, mobile menu/review/readable-writing captures. Header labels and menu fit; long board titles remain editable single-line inputs. This is scoped visual and keyboard behavior verification, not a screen-reader or accessibility compliance audit.
- The complete unfiltered browser suite, standalone citation/security workflows and ticket 04's dedicated port-3024 test were not rerun by ticket 01. Existing domain citation coverage and shared browser workflows remain intact.
- No PR or push. Test servers are owned and closed by the existing harness. Ticket 07 should retain the current export invitation, accessible names and focus-return coverage when it replaces the writing controls.
