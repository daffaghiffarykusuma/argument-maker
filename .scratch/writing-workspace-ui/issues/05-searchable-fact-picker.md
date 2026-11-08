# 05: Search and attach facts without leaving the argument

**What to build:** Find suitable research in a searchable picker and attach it to the current destination.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] Search with finding snippets, Source references and usage; distinguish eligible, incomplete, already-attached, empty research and no results.
- [x] Provide relevant recovery actions; keep eligibility aligned with existing completeness including Descriptive citations.
- [x] Selecting eligible research attaches only to the intended destination without leaving construction or losing writing; accessible keyboard operation and focus return.
- [x] Test mixed eligibility, source/text search, citation-only selection, recovery and desktop/mobile behavior in the current browser harness.

## Implementation and TDD evidence

- Starting branch `t3/searchable-fact-picker` at `cc4a0534990bf1ded3deb53e026c0bf3d09c9f4f` contains the supplied integration base. Integration advanced to `86225ae` during implementation; it will be merged into this branch only.
- Approved seam: real running application in Chromium, Bun test wrapper with the existing Windows Node harness. New workflow `tests/browser/fact-picker-05.ts` owns port 3025. No lower-level tests added.
- Slice 1 red: `bun test ./tests/browser/fact-picker-05.test.ts` reached construction and failed `locator.focus: Timeout 10000ms exceeded` looking for `Choose Gathered Facts`. Green after implementation: 1 pass, 0 fail, 33.96 seconds. Source search, citation-only keyboard attachment, correct destination, preserved Answer, construction stage and focus return asserted.
- Slice 2 red: same command failed `Opening the picker focuses search`, actual false, expected true. Added opening focus. This exposed an additional failed focus-return assertion because the existing ancestor-opening helper reopened the picker after attachment; attachment now renders and focuses the closed picker summary directly.
- Recovery checks passed in a subsequent 52.23-second run: mixed availability, finding search, no-results/clear recovery, Escape focus return, already-attached navigation, incomplete completion and attachment to a Supporting Argument, preserved writing, mobile fit, and empty research creation at Situation. The recovery textbox assertion uses its accessible role/name because rendered textarea content affects label text matching.
- Adapted native-select flows in `workflow.ts`, `fact-guidance.ts`, `descriptive-citations.ts`, and `fact-summaries-04.ts` through a shared visible-result chooser. Existing ordering, shared-edit, completeness, citation and recovery assertions retained. The hidden Complication picker assertion explicitly includes hidden controls so it still checks eligibility.
- `bun install --frozen-lockfile` succeeded. Initial browser attempts were infrastructure failures: missing dependencies, sandbox process timeout, then the owned stalled server occupying 3025. Stopped only the identified owned process tree; focused browser runs use approved process access and harness cleanup. These are not behavioral reds.
- `bun run typecheck` passes. `bun run build` passes with existing large-chunk advisory. `git diff --check` passes. Final integrated validation and additional shared-summary/native-undo coverage are recorded below when complete.
- Limits: no broad browser or unit suite run in this isolated implementation, per assignment. Parent runs full regressions sequentially. Screenshots document observed desktop/mobile states; keyboard assertions and focus checks do not establish full accessibility compliance.

## Final integrated verification

- Implementation commit `4da61d2`; merged integration `7579f2af596e65b5f0adc2f960b8118cabe53ad3` in `a09e713`. Resolved the shared `board-controls.ts` click/keydown conflict by retaining both Board-menu close/Escape handling and picker actions/Escape handling.
- Integration advanced again to `4f0641dc3315bc2ee2def83f1353e6f87e6b5f66` with ticket02. Merged cleanly into this branch; new picker workflow now opens Context through its visible disclosure. Integration was not modified by this implementer.
- Final `bun test ./tests/browser/fact-picker-05.test.ts`: **1 pass, 0 fail**, 15.69 seconds. Windows Node runs Chromium through the existing harness on port3025. Includes all recovery/eligibility checks above plus canonical shared-summary updates and native text undo after opening/closing the picker.
- Final `bun run typecheck`: exit0. Final `bun run build`: exit0, 7.40 seconds, existing >500kB chunk advisory. Final `git diff --check`: exit0.
- Desktop and 390px mobile screenshots inspected under `output/playwright/fact-picker-05/`; no horizontal overflow in the mobile workflow. Screenshot artifacts are ignored, not committed.
- Adapted existing broader workflows were not run separately here. Full browser/unit regressions, board-file round trips, draft restoration, export/review coverage, long-source stress cases and full accessibility review remain for sequential integration verification. Focused tests establish shared editing and native undo through observed behavior, not every existing contract.
