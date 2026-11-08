# 02: Focus construction on Question, Answer, and Supporting Arguments

**Status:** done

Closed after combined integration verification: all 15 browser tests, 53 board tests, typecheck, production build, and whitespace checks passed. See [combined verification and review](../../../docs/issues/writing-workspace-ui-verification.md) for review outcomes and remaining validation limits.

- [x] Question, Answer and Supporting Arguments remain visible. Situation/Complication are under Context; Audience/Intended outcome are under Planning.
- [x] Default-collapsed disclosures show labeled snippets of populated fields. Existing disclosure state survives rerenders and stage/review navigation. Draft restoration starts collapsed and summarizes retained content.
- [x] Answer typography and surface have strongest emphasis, followed by reasons and nested evidence. Framing attachments retain their existing editors and behavior.
- [x] Fresh/populated boards, keyboard interaction, native undo, review return, draft restoration, attachments, responsive fit and planning privacy verified at the approved running-app Chromium seam.

## Ticket02 evidence

Base ancestry confirmed at 86225aedef0693c88f0f4572f847b1787cffa441, including fact04 and review06. Only ticket02 production behavior changed. Existing workflows now open Context/Planning explicitly without removing assertions. The focused runner uses port3022, the existing harness and Node Chromium on Windows; Bun runs its test wrapper.

Red/green cycles:

1. The running app failed `Context is available as a disclosure` with 0 versus 1. Added native Context/Planning disclosures, populated summaries and in-place summary refresh. Fresh-field visibility, keyboard Enter/Space toggles, populated summaries and preservation across rerender passed.
2. Corrected an initially mistaken review-button label before counting behavioral evidence. Review-to-hidden-Context focus already worked through the existing ancestor-opening path. The next behavioral failure was `Answer has stronger type hierarchy than supporting reasons`. Scoped construction styles made it pass.
3. Collapsing/reopening Context after typing a single character lost native undo, leaving `!` instead of empty text. Prevented delayed DOM replacement while a construction summary has focus. The same external interaction now passes. Shared fact editing from04 is unchanged.

Passed before integration merge:

- `bun test tests/browser/focused-construction-02.test.ts`, 1 pass, 0 fail, 38.75 seconds. Includes focused assertions plus existing question-first, planning-context, review-navigation06 and reasoning-review workflows sequentially on3022.
- `bun run typecheck`, `bun run build`, `git diff --check`. Build retains the existing large Mermaid chunk warning.
- Inspected fresh and populated desktop1440/mobile390 screenshots under ignored `output/playwright/focused-construction-02/`. Long unbroken summary content fits without horizontal overflow. Screenshots are visual evidence, not accessibility certification.

Initial sandbox Chromium runs stalled. The sandboxed Bun run timed out and a direct run was terminated by its identified process tree. Running the existing harness with execution escalation succeeded. These setup failures are not behavioral red evidence. Locked dependencies were installed without lockfile changes.

Full browser and board suites are intentionally deferred to the parent for sequential integration validation. Adapted fact-guidance, fact04, descriptive-citation, broad smoke and writing-review workflows retain assertions but were not run in this child. No assistive-technology compliance claim. No new test seams, dependencies, PR, push, or integration-branch mutation.

## Integration handoff verification

Merged integration tip 7579f2af596e65b5f0adc2f960b8118cabe53ad3, including ticket01, into this branch with merge commit 7684427. The only conflict was adjacent construction CSS additions; retained both ticket02 disclosure/hierarchy rules and ticket01 charcoal construction rules. No unresolved conflicts.

Post-merge `bun test tests/browser/focused-construction-02.test.ts` passed, 1 pass / 0 fail, 36.99 seconds. Its four included existing workflows passed with assertions intact. Post-merge typecheck, production build and whitespace checks passed. Re-inspected desktop and mobile screenshots against the merged compact header. Broad suites remain the parent's responsibility.
