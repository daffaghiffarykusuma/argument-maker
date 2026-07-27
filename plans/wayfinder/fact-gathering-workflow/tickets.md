---
title: Gather-first fact workflow implementation tickets
label: ready-for-agent
status: ready
source_spec: spec.md
---

# Tickets: Gather-first fact workflow

These tickets build the [gather-first fact workflow](spec.md) as five dependency-ordered tracer bullets.

Work the **frontier**: any ticket whose blockers are all done. Ticket 1 can start immediately; Tickets 3 and 4 may proceed independently after Ticket 2.

## 1. Gather and persist canonical facts

**What to build:** Give users a complete first slice for collecting board-scoped facts before constructing an argument. A new board opens in Gather Facts, supports the complete unused-fact lifecycle, and saves and restores those facts through the version-2 board format.

**Blocked by:** None — can start immediately.

**User stories covered:** 1–15, 61–65, 84

- [ ] A new board uses schema version 2 and opens in Gather Facts with an empty Gathered Facts collection.
- [ ] Gather Facts, Construct Argument, and Preview are directly reachable full-width stages with no progression lock.
- [ ] Add fact creates one incomplete canonical Gathered Fact with blank fact text, blank Evidence Link, and blank optional Data Type.
- [ ] A Gathered Fact can be edited and can use Data Type Fact, Observation, Example, Estimate, or no Data Type.
- [ ] A fact is complete only when it has non-empty text and a valid HTTP or HTTPS Evidence Link.
- [ ] Incomplete facts remain valid drafts and display an Incomplete status in Gather Facts.
- [ ] Move up and Move down change the Gathered Facts collection order.
- [ ] Deleting an unused fact removes only that canonical fact.
- [ ] Another fact from this source creates a new canonical fact with the same Evidence Link and blank text and Data Type.
- [ ] The Construct Argument stage retains editable SCQA statements and Supporting Arguments without legacy nested Supporting Data or Facts rows.
- [ ] Situation, Complication, and Supporting Arguments store ordered fact references; Question and Answer remain text-only.
- [ ] Direct Situation and Complication Evidence Link fields are removed from the version-2 board and editing surface.
- [ ] Downloaded version-2 files contain the canonical Gathered Facts collection, including incomplete drafts and collection order.
- [ ] Uploading a valid version-2 file restores the same facts and order.
- [ ] Version-1 and otherwise unsupported files return **Unsupported Argument Board file version.**
- [ ] No accounts, cloud sync, telemetry, browser autosave, hidden persistence, UI framework, state-store dependency, or migration framework is added.
- [ ] Focused board-model and file-contract tests cover the new canonical fact lifecycle and basic version-2 round-trip.
- [ ] Typecheck and production build pass.

## 2. Use gathered facts throughout the Argument Board

**What to build:** Let users deliberately connect canonical Gathered Facts to Situation, Complication, and Supporting Arguments, then reuse, order, revise, detach, and delete those facts without creating conflicting copies.

**Blocked by:** 1. Gather and persist canonical facts

**User stories covered:** 16–39, 71–73

- [ ] Situation and Complication each retain one short storytelling statement and accept multiple Gathered Facts.
- [ ] Each Supporting Argument accepts multiple Gathered Facts.
- [ ] Question and Answer do not accept fact attachments.
- [ ] Choose Gathered Facts offers complete facts only and supports choosing one or more facts.
- [ ] A destination cannot contain the same Gathered Fact more than once.
- [ ] The same Gathered Fact can be reused across Situation, Complication, and multiple Supporting Arguments.
- [ ] Each destination preserves its own fact order independently of the library and every other destination.
- [ ] Visible Move up and Move down actions reorder facts within one destination.
- [ ] Fact selection and placement remain manual; no relevance ranking or automatic placement is introduced.
- [ ] Create new fact here creates one canonical Gathered Fact and attaches it to the current destination as one user action.
- [ ] A newly created attached fact may remain incomplete and visible while the user finishes it.
- [ ] Each canonical fact displays Unused or Used in N places.
- [ ] Used facts display badges naming every current destination.
- [ ] Each attached placement provides Edit fact, Open in Gathered Facts, Remove from here, Move up, and Move down.
- [ ] Editing an attached fact warns **Used in N places—changes update all uses** when applicable.
- [ ] Saving a fact edit updates the one canonical record and every attached placement immediately.
- [ ] Open in Gathered Facts navigates to the canonical item rather than creating a copy.
- [ ] Remove from here detaches only the current reference and preserves the canonical fact and other placements.
- [ ] Deleting an unused canonical fact remains immediate.
- [ ] Deleting a used fact requires confirmation that names every affected destination.
- [ ] Cancelling deletion leaves the canonical fact, placements, orders, and history unchanged.
- [ ] Confirming deletion removes the canonical fact and every attachment as one atomic action.
- [ ] No dangling or duplicated fact references can result from ordinary UI operations.
- [ ] Focused board-session tests cover create-and-attach, reuse, independent ordering, shared edits, detach, and cascading deletion.
- [ ] Existing SCQA and Supporting Argument editing behavior remains operational.
- [ ] Typecheck and production build pass.

## 3. Review and export attached evidence

**What to build:** Make attached evidence reviewable and exportable without exposing unused research. Readiness, Preview, Mermaid, and Copy Outline should tell one consistent story about ordering, reuse, links, and incomplete evidence.

**Blocked by:** 2. Use gathered facts throughout the Argument Board

**User stories covered:** 40–60

- [ ] Gather Facts marks unused incomplete or invalid-link facts as Incomplete without adding argument-readiness issues.
- [ ] Situation and Complication require no attached facts, but every fact they do use must be complete.
- [ ] A reasoning-mode Supporting Argument can be ready without facts.
- [ ] An evidence-backed Supporting Argument with no complete attached fact reports **Attach at least one complete fact to this evidence-backed reason.**
- [ ] An attached fact with blank text, missing Evidence Link, or invalid Evidence Link blocks readiness.
- [ ] One incomplete canonical fact creates one readiness issue even when reused.
- [ ] A reused-fact issue names every current destination.
- [ ] Fact issues use stable canonical fact targets; missing-support issues use stable Supporting Argument targets.
- [ ] Opening a fact issue navigates to Gather Facts and targets the canonical fact editor.
- [ ] Field guidance is exactly **Add fact text.**, **Add an evidence link.**, or **Use a valid http:// or https:// evidence link.**
- [ ] Data Type remains optional and never creates a readiness issue.
- [ ] Completing, detaching, or deleting a fact updates or removes its issue without stale destinations.
- [ ] Preview, Mermaid, and Copy Outline include attached facts only and omit all unused facts.
- [ ] Attached facts appear beneath every destination using them and follow that destination's independent order.
- [ ] Mermaid fact labels contain optional Data Type and fact text without raw URLs.
- [ ] Preview includes a destination-grouped evidence list beneath the diagram.
- [ ] Valid links use visible text **Open evidence source** and an accessible name containing the associated fact text.
- [ ] Missing and invalid links are not rendered as clickable anchors.
- [ ] Incomplete placements remain visible with **[Needs fact text]**, **[Needs evidence link]**, or **[Invalid evidence link]**.
- [ ] Copy Outline repeats reused facts in every relevant section.
- [ ] Copy Outline includes fact text, optional Data Type, and `Evidence Link: <URL>` in destination order.
- [ ] Copy Outline ends with **Incomplete Evidence** when any attached fact is incomplete.
- [ ] Gather Facts and Preview display **Link format checked; source quality and factual accuracy are not verified.**
- [ ] Focused readiness, preview-projection, and outline tests cover unused facts, reuse, independent order, issue deduplication, accessible links, and every incomplete marker.
- [ ] Typecheck and production build pass.

## 4. Recover fact and file operations atomically

**What to build:** Protect users from data loss while they revise facts, clear a board, or replace it from a file. Every successful operation should have predictable history, and every failed or cancelled import should leave the current board untouched.

**Blocked by:** 2. Use gathered facts throughout the Argument Board

**User stories covered:** 63–75

- [ ] A saved fact-field edit is one Undo/Redo history action.
- [ ] Attach, detach, and each ordering move are individually undoable and redoable.
- [ ] Create new fact here and its attachment occupy one history action.
- [ ] Confirmed cascading deletion and detachment occupy one history action.
- [ ] Undo of cascading deletion restores the canonical fact, library position, every attachment, and every destination order.
- [ ] A new committed action after Undo clears the Redo stack.
- [ ] Clear Board retains the existing download-first confirmation.
- [ ] Confirmed Clear Board removes the complete board, including Gathered Facts and references, as one undoable and redoable action.
- [ ] Upload validation completes before replacement confirmation.
- [ ] A valid upload asks for confirmation only when the current board has touched content.
- [ ] Confirmed import replaces the entire board as one undoable and redoable action.
- [ ] Cancelling Clear Board or import changes neither the board nor history.
- [ ] Malformed JSON, version 1, unsupported versions, missing or mistyped required fields, invalid enums, duplicate Gathered Fact IDs, duplicate Supporting Argument IDs, invalid SCQA IDs, missing fact references, and repeated references within one destination are rejected.
- [ ] Invalid import never partially replaces, repairs, deduplicates, or removes current data.
- [ ] Failed import leaves the board, Undo stack, and Redo stack unchanged.
- [ ] A version-2 round-trip preserves complete and incomplete facts, stable IDs, library order, destination orders, reuse, SCQA, both Support Modes, and timestamps.
- [ ] Unknown fields at board, fact, SCQA-slot, and Supporting Argument levels survive a valid import and later download.
- [ ] The normalized version-2 download contains board-level Gathered Facts and destination fact references, with no nested Supporting Data or Facts and no direct Situation or Complication Evidence Link fields.
- [ ] Focused board-session and file-contract tests prove atomic history, strict validation, unchanged-state failures, and the comprehensive version-2 round-trip.
- [ ] Typecheck and production build pass.

## 5. Harden the complete staged workflow in Chromium

**What to build:** Complete the gather-first workflow as an accessible, narrow-screen-safe browser experience and verify the full user journey in Chromium without treating structural checks as browser proof.

**Blocked by:** 3. Review and export attached evidence; 4. Recover fact and file operations atomically

**User stories covered:** 1–84

- [ ] The three stages are keyboard-reachable in Gather Facts, Construct Argument, Preview order and expose their selected state and associated panel.
- [ ] Ordinary stage navigation focuses the destination stage heading.
- [ ] Open in Gathered Facts and readiness-issue navigation focus the canonical fact editor.
- [ ] After fact deletion, focus moves to the next fact, previous fact, or Add fact when none remain.
- [ ] Every fact field, Evidence Link field, Data Type control, chooser, action, usage status, validation message, and confirmation has a programmatic label or association.
- [ ] Move up and Move down are visible keyboard-operable buttons; drag-and-drop is not required.
- [ ] Keyboard focus order follows visible reading order and focus indicators remain visible.
- [ ] Preview keeps the Mermaid diagram's accessible image role and name.
- [ ] The grouped evidence list remains understandable without relying on the diagram.
- [ ] At a 390-pixel viewport, stages, controls, facts, attachments, readiness issues, and evidence content stack without document-level horizontal overflow.
- [ ] Only the labelled Mermaid container may scroll horizontally.
- [ ] The staged workflow follows the selected full-width prototype's hierarchy without promoting prototype code into production.
- [ ] One Chromium workflow covers the default stage, gathering, Another fact from this source, attachment, reuse, ordering, shared edits, detach, cascading deletion, readiness navigation, Preview, Mermaid, Copy Outline, Undo/Redo, Clear Board, download/upload, and failed-import recovery.
- [ ] The Chromium workflow asserts stage-heading focus, canonical-fact focus, deletion focus recovery, labels, keyboard ordering, and 390-pixel overflow behavior.
- [ ] Focused Bun tests, TypeScript typecheck, and production build pass before the browser check.
- [ ] The Chromium check runs and is reported separately from structural gates.
- [ ] If the browser check times out, it is retried once; a repeated timeout reports the exact last completed step and marks browser verification **UNVERIFIED**.
- [ ] Firefox and WebKit certification remain out of scope.
- [ ] No new testing abstraction, UI framework, heavy dependency, account system, cloud service, telemetry, or hidden persistence is introduced.
