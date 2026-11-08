# 07: Unify writing exports in the header

**What to build:** Find every writing format in one labeled control, distinct from editable board backups.

**Blocked by:** 01: Replace the command rail with a compact header

**Status:** implemented

- [x] Offer header Export writing with Copy, Markdown, Text and Print/PDF, usable on desktop/mobile and from every stage.
- [x] Keep Download editable board in board actions, immediately available without writing review; remove fragmented duplicate writing-format entry points.
- [x] Preserve once-per-session invitation/reset rules, Review now/Export draft, pending-format continuation and Draft labeling.
- [x] Verify actual writing outputs, citations, planning omission, clipboard recovery and direct editable board download through existing browser workflows.

## Implementation and verification, 2026-11-08

Started on isolated branch `t3/unified-writing-exports` at exact integration tip `7579f2af596e65b5f0adc2f960b8118cabe53ad3`, with a clean worktree. `git merge-base --is-ancestor 7579f2af596e65b5f0adc2f960b8118cabe53ad3 HEAD` succeeded. Required spec, PRD, glossary, TDD skill and its tests/mocking references were read. Approved seam remains the running app through the existing Chromium harness; no production injection seam, schema or dependency change.

Red before production changes: `node tests/browser/unified-exports-07-runner.ts` exited 1 after the app loaded, with `locator.waitFor: Timeout 5000ms exceeded` waiting for the visible header `Export writing` control. An earlier attempt failed to load Playwright before dependencies were installed with `bun install --frozen-lockfile`; that infrastructure failure is not the behavioral red. The initial sandboxed attempt stalled and its verified owned runner/Vite process tree was stopped with elevated permissions before retrying. Successful browser runs use the process permissions needed for Chromium launch and cleanup.

Green: the same focused runner exited 0, printing `Ticket 07 unified writing exports passed`. It checks all stages, keyboard disclosure activation, Escape, focus return, cancellation, removal of duplicate Preview writing controls, visible mobile labels, 44px format controls, no horizontal overflow at 1024/390/320px, and real editable JSON downloads that bypass review. Desktop and 390px menu screenshots were visually inspected at `output/playwright/unified-exports-07/desktop-menu.png` and `mobile-menu.png`.

`node tests/browser/unified-exports-07-regression-runner.ts` passed sequentially on port 3027: existing writing-review workflow, review06 editor/selection/scroll return, planning-context privacy, and clipboard pending/denied/unavailable/retry checks. Writing-review now uses the real disclosure and verifies all four formats for Draft/reviewed paths, one source description for a reused citation-only fact, both placements, planning omission, direct editable-file preservation, accepted/rejected/cancelled import reset behavior, ordinary edits, Clear, and pending export continuation. Initial added fixture assertions were corrected to the actual `+ Add fact` control and the existing format contract, where finding text also appears in its source description.

`bun run typecheck`, `bun run build`, and `git diff --check` passed. Build reports the existing large-chunk advisory. Existing browser workflows were migrated to the actual header controls without dropping their output assertions. The parent owns the whole unit/browser suite, including the migrated comprehensive smoke, descriptive-citation and fact-guidance workflows, so these were not run here. Print verification intercepts the browser boundary and inspects print content; native OS print/PDF dialogs and assistive-technology/manual touch testing were not performed. No claim of full accessibility compliance.
