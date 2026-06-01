# Command Desk UI Refresh Issues

Source PRD: `docs/prd/command-desk-ui-refresh.md`

Issue tracker publication status: not published. This session does not include issue tracker setup or triage label vocabulary for the `to-issues` workflow, so these are local ready-for-agent issue drafts.

## Proposed Breakdown

1. **Command Desk shell and SCQA frame**
   - **Type**: AFK
   - **Blocked by**: None
   - **User stories covered**: 1, 2, 3, 4, 15, 16, 25, 26, 27, 28, 29, 35

2. **Supporting Argument and Supporting Data or Facts hierarchy**
   - **Type**: AFK
   - **Blocked by**: Issue 1
   - **User stories covered**: 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 34, 36, 37, 38, 40

3. **Command Desk preview and readiness review**
   - **Type**: AFK
   - **Blocked by**: Issues 1 and 2
   - **User stories covered**: 19, 20, 21, 22, 23, 24, 36, 37, 39

4. **Import, export, undo/redo, clear, and compatibility verification**
   - **Type**: AFK
   - **Blocked by**: Issues 1 and 2
   - **User stories covered**: 30, 31, 32, 33, 40

5. **Responsive, accessibility, and performance hardening**
   - **Type**: AFK
   - **Blocked by**: Issues 1, 2, 3, and 4
   - **User stories covered**: 25, 26, 27, 28, 29, 35

6. **Design review against selected prototype**
   - **Type**: HITL
   - **Blocked by**: Issues 1, 2, 3, 4, and 5
   - **User stories covered**: 1, 25, 27, 28, 36, 39

## Issue 1: Command Desk Shell And SCQA Frame

## What to build

Refresh the main Argument Board surface so it opens into the selected Command Desk direction while preserving the existing SCQA editing flow. The user should see a polished, dark-only workspace with a compact command area, board title/status area, and a clear SCQA frame where Situation, Complication, Question, and Answer remain individually editable.

This slice should be demoable without changing the Supporting Argument editing model yet: the page shell, toolbar, SCQA frame, focus states, and dark Command Desk visual language should be visible and usable.

## Acceptance criteria

- [ ] The app opens into a Command Desk-style shell inspired by Prototype 1.
- [ ] The board title remains editable.
- [ ] Situation, Complication, Question, and Answer remain visible, editable, and labeled.
- [ ] The Answer is visually positioned as the root of the argument rather than just another text field.
- [ ] Existing command actions remain present: preview toggle, copy outline, download, upload, undo, redo, and clear.
- [ ] Icon or compact controls have accessible labels and hover/focus tooltips.
- [ ] The UI remains dark-only.
- [ ] The implementation does not add heavy UI dependencies or decorative image assets.
- [ ] Existing SCQA editing behavior still passes automated tests.

## Blocked by

None - can start immediately.

## Issue 2: Supporting Argument And Supporting Data Or Facts Hierarchy

## What to build

Implement the Command Desk treatment for the Minto Pyramid editing area. Supporting Arguments must be visually distinct from their child Supporting Data or Facts. Each Supporting Data or Facts row must keep its own text statement, Evidence Link, Data Type, and row controls. Evidence Links must read as attached to the fact/data row, not to the Supporting Argument claim.

The default board must continue to show three Supporting Arguments and three Supporting Data or Facts under each Supporting Argument.

## Acceptance criteria

- [ ] The default visible board contains three Supporting Arguments.
- [ ] Each default Supporting Argument contains three Supporting Data or Facts rows.
- [ ] Supporting Argument labels clearly identify reasoning claims.
- [ ] Supporting Data or Facts rows are visually nested under the Supporting Argument they support.
- [ ] Each Supporting Data or Facts row has a statement field.
- [ ] Each Supporting Data or Facts row has its own Evidence Link field.
- [ ] Each Supporting Data or Facts row has a Data Type control with Fact, Observation, Example, and Estimate options.
- [ ] Each Supporting Argument keeps its Support Mode control.
- [ ] Adding, moving, duplicating, and deleting Supporting Arguments still works.
- [ ] Adding, moving, duplicating, and deleting Supporting Data or Facts still works.
- [ ] Existing board model and command tests still pass.

## Blocked by

- Issue 1: Command Desk Shell And SCQA Frame

## Issue 3: Command Desk Preview And Readiness Review

## What to build

Integrate the rendered Argument Preview and readiness review into the Command Desk layout. The preview should remain read-only and visually secondary to the editing surface, but easy to inspect when enabled. Readiness checks should explain structural and traceability problems without judging truth, persuasiveness, compliance, or source credibility.

## Acceptance criteria

- [ ] The Argument Preview renders as a visual workflow, not raw Mermaid as the primary preview.
- [ ] Mermaid source remains available as secondary inspectable/copyable content.
- [ ] The preview reflects the Answer, Supporting Arguments, and Supporting Data or Facts hierarchy.
- [ ] The preview does not become the primary editing surface.
- [ ] Readiness checks remain visible in the Command Desk layout.
- [ ] Invalid Evidence Links are flagged at the Supporting Data or Facts row level.
- [ ] Incomplete evidence-backed Supporting Arguments are flagged clearly.
- [ ] Readiness copy does not claim to validate truth, persuasiveness, legal sufficiency, compliance, or source credibility.
- [ ] Existing preview/output/review tests still pass.

## Blocked by

- Issue 1: Command Desk Shell And SCQA Frame
- Issue 2: Supporting Argument And Supporting Data Or Facts Hierarchy

## Issue 4: Import, Export, Undo/Redo, Clear, And Compatibility Verification

## What to build

Verify that the Command Desk UI refresh preserves local-first board operations and `.argument.json` compatibility. Existing boards should import into the refreshed layout without data loss. Exported boards should preserve the existing schema. Undo, redo, and clear confirmation behavior should continue to work after the UI refresh.

## Acceptance criteria

- [ ] Existing `.argument.json` board files import into the refreshed Command Desk UI.
- [ ] Exported board files preserve the existing schema and data hierarchy.
- [ ] Exported files preserve SCQA, Supporting Arguments, Supporting Data or Facts, Data Type, and Evidence Link values.
- [ ] Undo works after SCQA edits, Supporting Argument edits, and Supporting Data or Facts edits.
- [ ] Redo works after undoing the same edit types.
- [ ] Clear still asks for confirmation when the board has touched content.
- [ ] Upload still asks before replacing touched content.
- [ ] No autosave or browser persistence is introduced.
- [ ] Existing file persistence and session tests still pass.

## Blocked by

- Issue 1: Command Desk Shell And SCQA Frame
- Issue 2: Supporting Argument And Supporting Data Or Facts Hierarchy

## Issue 5: Responsive, Accessibility, And Performance Hardening

## What to build

Harden the refreshed Command Desk UI for real use across desktop and mobile widths. The dense default state with three Supporting Arguments and nine Supporting Data or Facts must remain usable without horizontal overflow. The app must remain lightweight, accessible, and dark-only.

## Acceptance criteria

- [ ] Desktop layout supports editing with the preview visible.
- [ ] Mobile layout avoids horizontal overflow.
- [ ] The dense default state with three Supporting Arguments and nine Supporting Data or Facts remains readable on mobile.
- [ ] Text does not overlap controls, cards, rows, or neighboring content.
- [ ] Focus-visible styles are clear for fields, buttons, file upload, and compact controls.
- [ ] Primary text, labels, controls, and review states meet practical contrast expectations for the dark theme.
- [ ] The refresh does not add heavy UI dependencies.
- [ ] The refresh does not add large decorative image assets.
- [ ] The refresh does not add unnecessary runtime animation loops.
- [ ] Build and browser smoke checks pass.

## Blocked by

- Issue 1: Command Desk Shell And SCQA Frame
- Issue 2: Supporting Argument And Supporting Data Or Facts Hierarchy
- Issue 3: Command Desk Preview And Readiness Review
- Issue 4: Import, Export, Undo/Redo, Clear, And Compatibility Verification

## Issue 6: Design Review Against Selected Prototype

## What to build

Run a human-in-the-loop design review comparing the implemented main app against the selected Command Desk prototype. The goal is to decide whether the production implementation is close enough to the accepted direction before removing or archiving the prototype reference.

## Acceptance criteria

- [ ] The implemented main app is reviewed against Prototype 1 Command Desk.
- [ ] The review checks visual hierarchy, density, clarity, and modernity.
- [ ] The review confirms the SCQA and Minto Pyramid separation remains obvious.
- [ ] The review confirms Supporting Arguments and Supporting Data or Facts are not visually conflated.
- [ ] The review confirms Evidence Links appear attached to Supporting Data or Facts rows.
- [ ] The review confirms the app still feels fast enough after visual changes.
- [ ] Any final visual polish requests are captured before prototype removal or archival.

## Blocked by

- Issue 1: Command Desk Shell And SCQA Frame
- Issue 2: Supporting Argument And Supporting Data Or Facts Hierarchy
- Issue 3: Command Desk Preview And Readiness Review
- Issue 4: Import, Export, Undo/Redo, Clear, And Compatibility Verification
- Issue 5: Responsive, Accessibility, And Performance Hardening
