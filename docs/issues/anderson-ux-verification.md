# Argument UX implementation verification

Implemented on `feat/anderson-ux` on 2026-10-07, against [the approved specification](anderson-ux-improvements-spec.md). All eight local tickets are under `.scratch/anderson-ux-improvements/issues/`. No external tracker is configured; no tracker issues or pull request were created.

The implementation starts with a Question or tentative Answer, preserves optional private Audience and Intended outcome, supports descriptive citations and source reuse, improves fact and clipboard guidance, and adds optional Reasoning review with visibly labeled draft writing exports. Editable board downloads remain direct.

## Automated verification

Final reviewed implementation: `3f8e76a`, merged without conflicts as `b246ad6`. Their committed trees are identical. Checks below passed on that implementation before the merge; subsequent completion edits change documentation and remove a trailing blank line in a test file only.

| Check | Result |
| --- | --- |
| `bun run test:unit` | 53 passed, 0 failed |
| `bun run typecheck` | Passed |
| Browser smoke workflow | Passed, including question/claim entry, planning context, clipboard recovery, source reuse, review, persistence, keyboard and existing workflow behavior |
| Descriptive citations browser workflow | Passed |
| Fact guidance browser workflow | Passed |
| Writing review browser workflow | Passed, including contents of all four writing formats, import/clear resets and optional review |
| `bun run build` | Passed; existing large-chunk advisory remains |
| `git diff --check` | Passed |

The four browser suites were run sequentially through the Bun wrappers and Node/Chromium runners. The original combined run found a stale exact-label locator in source reuse; that locator was corrected and the full workflow then passed. Browser startup and cleanup now share a harness. Successful and failed test cleanup were exercised; an additional shutdown-protocol probe did not reach startup, so forced-timeout cleanup is not claimed as experimentally verified.

## Rendered inspection

Desktop (1440 x 1000 CSS pixels) and mobile (390 x 844) inspection covered the starting flow, populated review, export invitation, fact/citation editor, source-reuse controls, readable citation output and clipboard failure feedback. Keyboard/focus assertions ran separately in the browser tests. No horizontal overflow was observed in the inspected mobile states.

Saved local evidence is in the ignored `output/playwright/anderson-ux/` directory:

- `finalDesktop.png`, `mobileStart.png`: question/claim entry.
- `desktopReview.png`, `mobileReview.png`, `mobileExport.png`: review and invitation.
- `fresh-fact-desktop.png`, `fresh-fact-mobile.png`: neutral Draft prompts before interaction.
- `mobileFact.png`: interacted fact guidance and source-reuse controls.
- `mobileSources.png`: readable source URL, descriptive citation and Data Type.
- `mobileCopyFeedback.png`: injected clipboard denial with visible retry guidance.
- `draft-print.png`: visible Draft label in Chromium print-media rendering; this is not an exported PDF inspection.

The collaborative preview snapshot appeared to blur and refocus a fresh editor, triggering expected post-blur guidance. A Chromium regression following the same worked-example/review/add-fact sequence stayed in Draft with no missing-field guidance and retained focus, including during screenshot capture. No production change was made for the preview-tool observation.

This inspection does not establish full accessibility conformance or measured improvements in users' reasoning or task completion.

## Review corrections

Final independent static rechecks found 0 Standards breaches or remaining heuristic findings and 0 Spec findings. The rechecks verified the corrections below; they did not rerun the automated suites.

- Standards: consolidated repeated source-status/Data Type presentation policy at the preview projection boundary and shared browser runner lifecycle code.
- Spec: restored Copy Outline's existing omission of Reasoning notes and its Support Mode labels, while retaining source numbering, metadata and optional Draft label. A public-output regression failed before the fix and passed afterward. Markdown, text and print retain their prior Reasoning-note behavior.

Audience and Intended outcome remain in editable board files and enabled local drafts, but are excluded from writing output. Review does not persist a certification or require completed reflection fields.
