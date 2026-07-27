# Resolution: Define implementation acceptance and recovery

## Decision

The gather-first plan is ready for implementation when the examples and verification gates below pass. The implementation should extend the existing immutable board, session history, file contract, review, preview projection, and output seams. It does not need a second state store, a migration layer, drag-and-drop, or cross-browser certification.

## Functional acceptance

### Gather and maintain facts

- A new board opens in **Gather Facts** with an empty Gathered Facts collection.
- **Add fact** creates an incomplete canonical fact with blank text, blank Evidence Link, and blank optional Data Type.
- **Another fact from this source** creates a separate canonical fact with the same Evidence Link and blank text and Data Type.
- Saving edits to fact text, Evidence Link, or Data Type updates the canonical record and every attached placement.
- Move up and Move down change only the Gathered Facts collection order.
- A complete fact has non-empty text and a valid `http://` or `https://` Evidence Link. Data Type remains optional.

### Select, create, reuse, order, and detach

- **Choose Gathered Facts** lists only complete facts and prevents the same fact from being selected twice in one destination.
- **Create new fact here** creates one canonical fact and attaches it to the current destination as one user action. Until completed, it remains visible and blocks readiness.
- One fact may be attached to Situation, Complication, and multiple Supporting Arguments.
- Each destination preserves its own fact order. Reordering one destination does not change the library or another destination.
- **Remove from here** removes only that destination reference and leaves the canonical fact intact.
- Usage status changes between **Unused** and **Used in N places**, with every current destination named.

### Delete

- Deleting an unused fact removes it immediately.
- Deleting a used fact first names every affected destination.
- Cancelling the confirmation changes nothing.
- Confirming removes the canonical fact and all references as one atomic history action.
- Undo restores the fact, its library position, every attachment, and every destination order. Redo removes them again.

## Readiness and incomplete states

- An unused blank, missing-link, or invalid-link fact is marked **Incomplete** in Gather Facts but creates no argument-readiness issue.
- An attached incomplete fact creates one issue keyed to its canonical fact ID, even when reused.
- That issue names every destination and opens Gather Facts with focus on the canonical fact editor.
- Field guidance is exactly:
  - **Add fact text.**
  - **Add an evidence link.**
  - **Use a valid http:// or https:// evidence link.**
- Situation and Complication require no fact, but every attached fact must be complete.
- An evidence-backed Supporting Argument with no complete attached fact receives **Attach at least one complete fact to this evidence-backed reason.**
- A reasoning-mode Supporting Argument may have no facts.
- Completing, detaching, or deleting the owning fact removes or updates the issue without leaving stale destinations.

## Output acceptance

Use a board containing unused facts, reused facts, independently ordered facts, and attached incomplete facts.

- Preview, Mermaid, and Copy Outline omit every unused fact.
- Each attached fact appears under every destination using it and follows that destination's order.
- Mermaid labels contain optional Data Type and fact text, never raw URLs.
- The Preview evidence list is grouped by destination.
- Valid links are clickable with visible text **Open evidence source** and an accessible name containing the fact text.
- Missing and invalid links are not anchors.
- Incomplete placements remain visible using **[Needs fact text]**, **[Needs evidence link]**, or **[Invalid evidence link]**.
- Copy Outline repeats reused facts in every destination, includes optional Data Type and `Evidence Link: <URL>`, and ends with **Incomplete Evidence** when needed.
- Gather Facts and Preview display **Link format checked; source quality and factual accuracy are not verified.**

## History and data-loss recovery

- A saved field edit is one history action.
- Create-and-attach and cascading delete-and-detach are each one atomic history action.
- Attach, detach, and each ordering move are individually undoable and redoable.
- A new committed action after Undo clears the redo stack.
- **Clear Board** keeps the existing download-first confirmation, clears the entire board including Gathered Facts and references, and is undoable and redoable.
- A valid confirmed import replaces the entire board as one undoable and redoable action.
- A cancelled import, malformed JSON, version-1 file, unsupported version, invalid field, duplicate ID, missing reference, or repeated destination reference changes neither the board nor Undo/Redo history.
- Import validation completes before replacement confirmation. The current board remains intact until a valid replacement is confirmed.

## Version-2 compatibility acceptance

One round-trip fixture must contain:

- complete and incomplete Gathered Facts;
- one reused fact;
- different library and destination orders;
- reasoning and evidence-backed Supporting Arguments;
- unknown fields at board, fact, SCQA-slot, and Supporting Argument levels.

Download, import, and download again must preserve all known values, IDs, reference orders, incomplete drafts, and unknown fields. The normalized file uses `schemaVersion: 2`, board-level `gatheredFacts`, and destination `factIds`; it contains no nested Supporting Data or Facts and no direct Situation or Complication Evidence Link fields.

Version 1 and otherwise unsupported versions return **Unsupported Argument Board file version.** Structurally invalid version-2 files return the existing missing-or-invalid-data error and never partially import or repair data.

## Accessibility and responsive acceptance

- The three stages are keyboard-reachable in Gather Facts, Construct Argument, Preview order and expose their selected state and associated panel.
- An ordinary stage change focuses the destination stage heading.
- **Open in Gathered Facts** and review-issue navigation focus the canonical fact editor.
- After fact deletion, focus moves to the next fact, then the previous fact, or **Add fact** when none remain.
- Every text field, URL field, Data Type control, chooser, action, usage status, validation message, and confirmation has a programmatic label or association.
- Ordering uses visible keyboard-operable Move up and Move down buttons. Drag-and-drop is not required.
- Focus order follows the visible reading order, and focus indicators remain visible.
- At a 390-pixel viewport, controls and evidence content stack without document-level horizontal scrolling. Only the Mermaid diagram may scroll horizontally inside its own labelled container.
- Preview preserves the diagram's accessible image role and name, and the evidence list remains readable without relying on the diagram.

## Verification gates

### Focused structural checks

Run:

```text
bun test src/argument-board.test.ts src/argument-board-session.test.ts src/board-file.test.ts src/review.test.ts src/argument-preview-projection.test.ts src/output.test.ts
bun run typecheck
bun run build
```

The focused tests own the model operations, atomic history, strict version-2 parsing and round-trip, readiness deduplication, preview projection, and outline ordering and markers.

### Real-browser check

Extend the existing `src/browser-smoke.test.ts` Chromium scenario and run it separately:

```text
bun test src/browser-smoke.test.ts
```

The single workflow must cover:

1. Gather Facts is the default stage.
2. Add and complete facts, create another fact from the same source, reorder, and observe incomplete and usage states.
3. Attach and reuse facts, create one in place, reorder destination references, edit once and observe every use, detach, and exercise confirmed cascading deletion.
4. Navigate by stage, Open in Gathered Facts, and readiness issue; assert the required focus target.
5. Verify Preview, rendered Mermaid, evidence links, incomplete markers, Copy Outline, and the verification disclaimer.
6. Verify Undo/Redo for atomic fact actions, Clear Board, and import replacement.
7. Verify a version-2 download/import round-trip and that failed version-1 and invalid imports preserve the current board.
8. Repeat layout assertions at a 390-pixel viewport and confirm no document-level horizontal overflow.

Chromium is the required real-browser boundary. Firefox and WebKit are out of scope.

## Verification reporting

Structural tests, typecheck, and build do not prove browser behavior. Report the Chromium check separately. If the known browser-smoke timeout recurs, retry once; if it still times out, report the exact last completed step and mark real-browser verification **UNVERIFIED** rather than treating structural passes as browser proof.
