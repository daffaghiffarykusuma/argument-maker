# Writing workspace UI improvements

Status: design interview complete. The user confirmed the direction, core interactions, visual treatment, toolbar layout, and fact selection. This is an implementation-ready design brief; the UI has not been changed as part of this interview.

## Agreed direction

- Prioritize first-time writers learning to structure an argument. Keep advanced controls accessible.
- Soften the current dark Command Desk into a calmer writing workspace. Retain the restrained palette, improve typography and spacing, and reduce the visual weight of utility controls.
- Prioritize desktop writing, with useful mobile editing and review. Aim for an editor beside an outline on desktop and a focused single-column layout on mobile.

These decisions refine the existing Command Desk direction and replace its command rail with a compact header. The open workspace, suggested next actions, and freedom to move between stages remain established constraints from [the previous UX decisions](anderson-ux-improvements.md).

## Evidence at the time of the interview

Evidence comes from current source inspection, not a rendered UI audit or user research. Visual quality, responsive behavior, and accessibility still need current verification.

- Construction renders Question, Answer, Situation, Complication, Audience, and Intended outcome before Supporting Arguments. Consider progressive disclosure to reduce the initial form density.
- Writing actions are split between the command rail and Preview. Consider grouping writing formats while keeping editable board backup distinct.
- The live construction outline is hidden at widths of 1200px and below. Consider an on-demand outline at narrower widths.
- Research and attached-fact cards expose substantial editing controls. Consider concise summaries with explicit editing and clear shared-edit scope.
- Review replaces stage content while the selected workflow tab remains visible. Consider an explicit review destination and return action.

Relevant implementation: `src/ui/argument-board-browser.ts`, `src/ui/gathered-fact-editing.ts`, `src/ui/argument-preview.ts`, `src/ui/reasoning-review.ts`, and `src/ui/styles.css`.

## Agreed interactions

1. Keep Question, Answer, and Supporting Arguments visible. Group Situation and Complication into expandable Context and Audience/Intended outcome into expandable Planning. Collapsed sections summarize existing content.
2. Offer one labeled Export writing control containing Copy, Markdown, Text, and Print/PDF. Keep Download editable board separate and preserve the existing optional review invitation.
3. Keep the outline beside the editor on wide screens. Offer a labeled View outline panel on narrower screens; closing it returns to the same editing position.
4. Show existing facts as compact summaries with finding, source, and usage visible. Edit expands fields; newly created facts start expanded. Explain that edits to shared facts update every use.
5. Give reasoning review a clearly titled view and Back to editing action, preserving the previous tab and position. Label structural checks separately.

## Agreed visual treatment and controls

1. Use charcoal surfaces, fewer borders, larger writing text, and clearer spacing between sections. Give the Answer the strongest emphasis, supporting reasons the next level, and evidence a quieter nested treatment. Keep the system font and use text alongside status colors.
2. Replace the desktop command rail with a compact header to recover writing space. Keep Export writing visible. Group file actions under Board, with Clear separated inside that menu. On mobile, use labeled Export and More controls with comfortable touch targets. Remove workflow step numbers so tabs communicate free navigation. Preserve access to undo and redo.
3. Offer a searchable fact picker showing finding snippets, sources, and usage. Distinguish incomplete facts from already-attached facts and offer a relevant next action for each. Selecting a fact attaches it without leaving the current argument.

No product decisions remain open in this brief. Exact spacing, typography sizes, and responsive breakpoints should be tuned against the rendered layout during implementation.

## Implementation order

1. Update the shell, typography, header commands, and responsive navigation.
2. Reorganize construction fields and add responsive outline access with editing-position restoration.
3. Introduce fact summaries, explicit editing, and searchable attachment selection.
4. Unify writing exports and make the review view and return path explicit.

Keep changes within the existing UI and view state where possible. Reuse current board commands, persistence, writing formats, and review behavior.

## Acceptance checks

- On a new board, Question, Answer, and Supporting Arguments are visible; Context and Planning can be expanded. On a populated board, their collapsed summaries expose existing content without opening the fields.
- On desktop, the editor and outline remain readable together. On laptops and phones, View outline is available and closing the panel restores the editing position.
- Existing fact summaries display finding, source, and usage. New facts open for editing. Shared edits update all attachments, with that scope explained in the UI. Collapsing or reopening an editor preserves work.
- The picker searches the research collection, explains unavailable items, and attaches eligible facts to the intended destination without losing the current editing context.
- Writing formats are grouped under Export writing. Download editable board remains directly available within board actions without entering writing review. The existing review invitation and draft-label behavior remain intact.
- Review has a clear title and Back to editing action. Returning restores the prior workflow tab and position. Structural checks remain distinct from reasoning review.
- Header controls, menus, disclosures, the fact picker, and outline access work with keyboard and touch. Check accessible names, focus visibility, focus return, status announcements, readable contrast, and comfortable targets. Hover tooltips must not be the only way to identify an action.
- Inspect the rendered new-board, populated-board, research, review, and export states on desktop and mobile, including the laptop layout transition. Check long content, empty states, and absence of unintended horizontal scrolling.
- Run the existing unit suite, browser workflows, typecheck, production build, and diff whitespace check. Add focused coverage for new interaction behavior, including focus return and shared edits; do not treat source inspection as visual verification.
- Confirm board import/export, optional local draft restoration, undo/redo, and replacement protection preserve existing data and behavior.

## Domain constraints

Use [the existing glossary](../../GLOSSARY.md). A Gathered Fact is shared across its Fact Attachments; editing it changes every use. Structural completeness does not certify truth or reasoning quality. Preview remains read-only. Writing exports omit Audience and Intended outcome, while editable board files preserve them. Local draft saving remains optional.

The agreed labels describe UI organization and use the existing domain vocabulary. No new domain term or hard-to-reverse architectural trade-off was selected, so no glossary addition or ADR is required.
