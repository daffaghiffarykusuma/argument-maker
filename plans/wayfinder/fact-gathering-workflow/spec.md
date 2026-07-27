---
title: Gather facts before constructing an argument
label: ready-for-agent
status: ready
source_map: map.md
---

## Problem Statement

Argument Maker currently asks users to construct an argument before it gives them a dedicated place to collect evidence. That makes research and argument structure compete for attention. It also encourages users to repeat facts and Evidence Links directly inside Situation, Complication, or individual Supporting Arguments.

Users need to gather facts and their source links first, keep that research with the current Argument Board, and then deliberately choose which facts support each part of the argument. They must also be able to revise one fact and have every use update consistently, without being prevented from drafting a reasoning-only argument.

## Solution

Add a board-scoped **Gathered Facts** collection and make **Gather Facts** the default first stage of a three-stage workspace:

1. Gather Facts
2. Construct Argument
3. Preview

Each Gathered Fact stores fact text, an Evidence Link, and an optional Data Type. Situation, Complication, and each Supporting Argument can reference multiple complete Gathered Facts in their own order. References remain connected to one canonical fact, so editing that fact updates every placement. Users may move freely between stages, create a fact while constructing, and continue without evidence when the argument uses reasoning mode.

The entire board—including Gathered Facts and their ordered references—is downloaded and uploaded as a version-2 `.argument.json` file. Readiness evaluates attached evidence while leaving unused research drafts out of the argument verdict. Preview, Mermaid, and Copy Outline expose only facts attached to the argument and clearly mark incomplete evidence.

## User Stories

1. As an argument writer, I want Gather Facts to open first, so that I begin with evidence before shaping the argument.
2. As an argument writer, I want to move directly between Gather Facts, Construct Argument, and Preview, so that the staged workflow never becomes a hard-locked wizard.
3. As an argument writer, I want to construct an argument without gathered facts, so that I can draft reasoning-only work.
4. As an argument writer, I want an empty Gathered Facts collection on a new board, so that sample research is never mistaken for my work.
5. As a researcher, I want to add an incomplete fact draft, so that I can capture partial research before every field is known.
6. As a researcher, I want to write one fact statement per Gathered Fact, so that each claim remains independently reusable.
7. As a researcher, I want to save an Evidence Link with a fact, so that I can return to its source.
8. As a researcher, I want Data Type to remain optional, so that classification does not slow down gathering.
9. As a researcher, I want to classify a fact as Fact, Observation, Example, or Estimate, so that its role is visible when useful.
10. As a researcher, I want to edit a Gathered Fact, so that I can correct or refine my evidence.
11. As a researcher, I want to manually reorder Gathered Facts, so that the collection follows my working sequence.
12. As a researcher, I want Another fact from this source, so that I can capture several facts from one article without repeatedly pasting its link.
13. As a researcher, I want Another fact from this source to copy only the Evidence Link, so that the new statement and Data Type start clean.
14. As a researcher, I want incomplete facts labelled clearly, so that I can see unfinished research without opening a readiness review.
15. As an argument writer, I want only complete facts offered for normal selection, so that I do not accidentally attach unfinished research.
16. As an argument writer, I want a short Situation statement plus multiple supporting facts, so that storytelling remains concise while evidence remains explicit.
17. As an argument writer, I want a short Complication statement plus multiple supporting facts, so that I can explain several issues behind the complication.
18. As an argument writer, I want Question and Answer to remain short statements without fact rows, so that the SCQA frame stays focused.
19. As an argument writer, I want to choose one or more Gathered Facts for Situation, so that the context can be evidence-backed.
20. As an argument writer, I want to choose one or more Gathered Facts for Complication, so that several problems can support the narrative tension.
21. As an argument writer, I want to choose one or more Gathered Facts for a Supporting Argument, so that a reason can use several pieces of evidence.
22. As an argument writer, I want to create a new fact from an evidence-capable destination, so that missing research does not force me to abandon construction.
23. As an argument writer, I want a fact created in place to enter the canonical collection, so that it is available everywhere else.
24. As an argument writer, I want one Gathered Fact to support multiple destinations, so that I do not duplicate evidence.
25. As an argument writer, I want the same fact limited to one placement per destination, so that accidental duplicates do not clutter a section.
26. As an argument writer, I want each destination to keep its own fact order, so that the evidence sequence fits that part of the story.
27. As an argument writer, I want reordering in one destination to leave all other orders unchanged, so that one edit has no surprising side effects.
28. As an argument writer, I want fact placement to remain manual, so that the app does not guess relevance or argument position.
29. As an argument writer, I want each Gathered Fact marked Unused or Used in N places, so that I can see what research contributes to the board.
30. As an argument writer, I want usage badges to name Situation, Complication, or the relevant Supporting Argument, so that I can find every placement.
31. As an argument writer, I want to edit a fact from an attached placement, so that I can revise evidence without unnecessary navigation.
32. As an argument writer, I want an attached fact editor to warn that changes update all uses, so that shared edits are intentional.
33. As an argument writer, I want one saved edit to update every placement immediately, so that repeated evidence never drifts.
34. As an argument writer, I want Open in Gathered Facts, so that I can return to the canonical fact with collection context.
35. As an argument writer, I want Remove from here to detach only the current placement, so that the fact remains available for other uses.
36. As an argument writer, I want deleting an unused fact to be immediate, so that routine cleanup stays quick.
37. As an argument writer, I want deletion of a used fact to name every affected destination, so that I understand the impact.
38. As an argument writer, I want to cancel deletion of a used fact without changes, so that I can recover from a mistaken action.
39. As an argument writer, I want confirmed deletion to remove the canonical fact and every placement together, so that dangling references cannot remain.
40. As an argument writer, I want a reasoning-mode Supporting Argument to remain valid without facts, so that interpretation can stand on its own.
41. As an argument writer, I want an evidence-backed Supporting Argument to require at least one complete fact, so that its declared mode matches its support.
42. As an argument writer, I want unused incomplete facts excluded from argument readiness, so that unfinished research does not block otherwise complete work.
43. As an argument writer, I want an attached incomplete fact to block readiness, so that evidence shown in the argument is traceable.
44. As an argument writer, I want one readiness issue per canonical incomplete fact, so that reuse does not create duplicate work.
45. As an argument writer, I want a reused-fact issue to name every destination, so that I understand its full impact.
46. As a keyboard user, I want a fact issue to open Gather Facts and focus the canonical editor, so that I can correct it directly.
47. As an argument writer, I want exact field guidance for missing text, missing links, and invalid links, so that I know what to repair.
48. As an argument writer, I want Preview available before readiness is complete, so that I can inspect work in progress.
49. As an argument writer, I want Preview to omit unused facts, so that research notes are not mistaken for part of the argument.
50. As an argument writer, I want attached facts shown beneath their destinations in order, so that Preview reflects the intended evidence sequence.
51. As an argument writer, I want reused facts repeated beneath every destination, so that each section remains understandable on its own.
52. As an argument writer, I want Mermaid labels to show optional Data Type and fact text without raw URLs, so that the diagram remains readable.
53. As an argument writer, I want an evidence list grouped by destination below Mermaid, so that source access does not depend on diagram nodes.
54. As an assistive-technology user, I want each evidence link's accessible name to include its fact text, so that repeated Open evidence source links are distinguishable.
55. As an argument writer, I want invalid or missing links to remain non-clickable, so that broken evidence is not presented as a working source.
56. As an argument writer, I want incomplete facts to remain visible with explicit markers, so that Preview never hides evidence problems.
57. As an argument writer, I want Copy Outline to preserve destination order and repeat reused facts, so that exported drafting material is self-contained.
58. As an argument writer, I want Copy Outline to include optional Data Type and Evidence Link, so that evidence context survives copying.
59. As an argument writer, I want Copy Outline to end with an Incomplete Evidence summary when needed, so that unresolved source work remains visible.
60. As a critical reader, I want a disclaimer that link format is checked but source quality and factual accuracy are not verified, so that traceability is not confused with proof.
61. As a local-first user, I want Gathered Facts included in the board download, so that my research travels with my argument.
62. As a local-first user, I want version-2 files to store each fact once and placements as ordered references, so that reused evidence remains consistent.
63. As a local-first user, I want complete and incomplete facts to survive a download and upload round-trip, so that drafts are not lost.
64. As a local-first user, I want unknown valid fields preserved during round-trip, so that forward-compatible data is not silently discarded.
65. As a local-first user, I want version-1 and unsupported files rejected clearly, so that incompatible data is not guessed or partially migrated.
66. As a local-first user, I want invalid version-2 files rejected atomically, so that duplicate IDs or broken references cannot corrupt my board.
67. As a local-first user, I want upload validation to finish before replacement confirmation, so that I am not asked to replace work with an unusable file.
68. As a local-first user, I want a valid upload to ask before replacing touched content, so that current work is protected.
69. As a local-first user, I want a failed or cancelled import to leave the board and history unchanged, so that recovery remains predictable.
70. As a local-first user, I want Clear Board to remove facts and attachments with the existing download-first confirmation, so that no hidden research survives a reset.
71. As an argument writer, I want fact edits, attachments, detachments, and ordering moves to support Undo and Redo, so that experimentation is safe.
72. As an argument writer, I want create-and-attach to be one history action, so that one Undo reverses the whole action.
73. As an argument writer, I want cascading fact deletion to be one history action, so that one Undo restores the fact and all placements.
74. As an argument writer, I want Clear Board and confirmed import replacement to be undoable, so that destructive board-wide actions remain recoverable.
75. As an argument writer, I want a new action after Undo to clear Redo, so that history follows familiar behavior.
76. As a keyboard user, I want visible Move up and Move down buttons, so that ordering does not depend on drag-and-drop.
77. As a keyboard user, I want stage changes to focus the destination heading, so that I know where navigation placed me.
78. As a keyboard user, I want targeted navigation to focus the canonical fact editor, so that the relevant correction is immediately reachable.
79. As a keyboard user, I want focus restored after deletion to the next fact, previous fact, or Add fact, so that focus is never lost.
80. As an assistive-technology user, I want fields, controls, statuses, guidance, and confirmations programmatically labelled, so that the complete workflow is understandable.
81. As a narrow-screen user, I want the page to avoid horizontal overflow, so that controls and evidence remain usable.
82. As a narrow-screen user, I want only the Mermaid container to scroll horizontally when necessary, so that diagram readability does not break the page.
83. As a narrow-screen user, I want the evidence list readable without the Mermaid diagram, so that source review remains accessible.
84. As a privacy-conscious user, I want no accounts, cloud sync, telemetry, or browser autosave, so that the workflow remains explicitly local-first.

## Implementation Decisions

- Extend the Argument Board domain model to schema version 2.
- Store canonical Gathered Facts in one board-level ordered collection.
- Give each Gathered Fact a stable ID, fact text, touched state, Evidence Link, and optional Data Type.
- Keep the allowed Data Types as Fact, Observation, Example, and Estimate.
- Replace nested Supporting Data or Facts content with ordered Gathered Fact ID references on each Supporting Argument.
- Replace direct Situation and Complication Evidence Link fields with ordered Gathered Fact ID references.
- Keep Question and Answer as text-only SCQA slots.
- Preserve one short storytelling statement for Situation and one for Complication.
- Treat non-empty text plus a valid HTTP or HTTPS Evidence Link as fact completeness.
- Do not treat Data Type as required.
- Keep incomplete canonical fact drafts valid in memory and saved files.
- Allow only complete existing facts in the normal fact chooser.
- Allow Create new fact here to create and attach an incomplete canonical fact as one action.
- Model attachment as a live reference, never a copy or move.
- Prevent duplicate references within one destination while permitting reuse across destinations.
- Keep library order and every destination order independent.
- Add domain commands for creating, editing, moving, attaching, detaching, and deleting canonical facts.
- Make commands immutable and route user-visible mutations through the existing board session history.
- Commit a saved field edit as one history action.
- Commit create-and-attach and cascading delete-and-detach atomically.
- Preserve normal history behavior: Undo and Redo restore complete prior board states, and a new action after Undo clears Redo.
- Keep Clear Board and successful import replacement as recoverable history actions.
- Keep failed or cancelled imports out of board state and history.
- Validate an uploaded file completely before asking to replace touched content.
- Accept schema version 2 only; do not add a version-1 migration path.
- Reject duplicate Gathered Fact IDs, duplicate Supporting Argument IDs, invalid SCQA IDs, missing fact references, repeated fact references within one destination, missing or mistyped required fields, and unsupported enum values.
- Never silently repair, deduplicate, or remove invalid references during import.
- Preserve unknown fields when all known version-2 fields and relationships are valid.
- Replace the entire board atomically after a valid confirmed import.
- Clear the entire board, including facts and references, after the existing download-first confirmation.
- Add three directly reachable, full-width stages: Gather Facts, Construct Argument, and Preview.
- Make Gather Facts the default stage without locking movement to later stages.
- Retain the existing command-desk visual language and plain-language labels.
- Show Gathered Fact completeness and Unused or Used in N places status in the gathering stage.
- Show named destination badges for each used fact.
- Provide Choose Gathered Facts and Create new fact here in Situation, Complication, and every Supporting Argument.
- Provide Edit fact, Open in Gathered Facts, Remove from here, Move up, and Move down for attached placements.
- Warn before shared edits that changes update all uses.
- Confirm deletion only when a canonical fact is used, and name every affected destination.
- Separate library hygiene from argument readiness.
- Deduplicate readiness issues by canonical fact ID and include all current destinations in the message.
- Keep stable fact or Supporting Argument IDs as navigation targets for readiness issues.
- Keep Preview, Mermaid, and Copy Outline available before readiness is complete.
- Derive Preview, Mermaid, and Copy Outline from attached fact references only.
- Repeat reused facts under every destination and preserve each destination's order.
- Keep raw Evidence Links out of Mermaid nodes.
- Add a structured, destination-grouped evidence list beneath Mermaid.
- Render only valid Evidence Links as anchors.
- Mark incomplete attached facts consistently in Preview, Mermaid, and Copy Outline.
- Add an Incomplete Evidence summary to Copy Outline when needed.
- Display the link-verification disclaimer in Gather Facts and Preview.
- Use native keyboard-operable controls and visible Move up and Move down actions; do not require drag-and-drop.
- Focus a stage heading after ordinary stage navigation.
- Focus the canonical fact editor after Open in Gathered Facts or issue navigation.
- Restore focus after deletion to the next fact, previous fact, or Add fact.
- Keep document-level layout within the viewport at narrow widths and isolate Mermaid overflow inside its labelled container.
- Keep the implementation local-first with no accounts, cloud sync, telemetry, or hidden persistence.
- Reuse the selected staged-workflow prototype as a behavioral reference, not as production code.
- Do not add a new state store, migration framework, UI framework, or testing abstraction.

## Testing Decisions

- Test observable board behavior and serialized contracts, not private helper structure.
- Use the board session as the primary structural seam for gathering, editing, attachment, history, review state, output access, Clear Board, and import replacement.
- Keep focused domain-model tests for immutable fact operations, unique identities, independent ordering, reuse, detach, and cascading deletion.
- Keep focused file-contract tests for strict version-2 validation, atomic rejection, unknown-field preservation, and human-inspectable round-trips.
- Keep focused readiness tests for unused-versus-attached incomplete facts, evidence-backed requirements, one issue per canonical reused fact, complete destination names, and stable targets.
- Keep focused preview-projection tests for attached-only output, destination ordering, reused facts, Data Type formatting, incomplete markers, and omission of raw URLs.
- Keep focused outline tests for section order, repeated reused facts, Evidence Links, incomplete markers, and the Incomplete Evidence summary.
- Use one version-2 round-trip fixture containing complete and incomplete facts, reused references, different library and destination orders, both Support Modes, and unknown fields at several levels.
- Prove that version-1, unsupported, malformed, and structurally invalid files leave both board state and history unchanged.
- Prove Clear Board and successful import replacement can each be undone and redone.
- Prove create-and-attach and cascading deletion each occupy one history step.
- Extend the existing Chromium workflow as the real-browser seam for the complete user journey.
- In Chromium, verify the default stage, gathering, Another fact from this source, attachment, reuse, independent ordering, shared edits, detach, cascading deletion, readiness navigation, Preview, Mermaid, Copy Outline, Clear Board, download/upload, and import recovery.
- In Chromium, verify stage-heading focus, targeted fact focus, deletion focus recovery, programmatic labels, visible focus, and keyboard ordering controls.
- At a 390-pixel viewport, verify no document-level horizontal overflow and allow horizontal scrolling only inside the Mermaid container.
- Run the focused Bun tests, TypeScript typecheck, and production build as structural gates.
- Run Chromium separately because structural gates do not prove browser rendering or interaction.
- Firefox and WebKit certification are not required for this specification.
- If the known browser-smoke timeout occurs, retry once. If it repeats, report the exact last completed step and mark browser verification Unverified without misrepresenting structural passes as browser proof.

## Out of Scope

- Fetching, scraping, summarizing, or extracting facts from linked pages.
- Automatically judging whether a fact is true or whether a source is trustworthy.
- AI-generated arguments, prose drafting, or automatic fact placement.
- Accounts, cloud synchronization, real-time collaboration, analytics, identity, or telemetry.
- Browser autosave or hidden persistence.
- External reference-manager or knowledge-base integrations.
- Global, cross-board, or separately importable fact libraries.
- Source metadata beyond fact text, Evidence Link, and optional Data Type.
- Import or migration of schema-version-1 files.
- Fact sections, tags, search, filters, bulk actions, duplicate detection, or automatic relevance ranking.
- Drag-and-drop as a required ordering interaction.
- Firefox or WebKit certification.
- Promotion of the throwaway prototype into production code.

## Further Notes

- **Audience:** the implementation agent and reviewers responsible for product behavior, accessibility, compatibility, and data-loss prevention.
- **Use case:** a user gathers source-linked facts, shapes them into an SCQA and Minto Pyramid argument, reviews the evidence structure, and preserves the complete board locally.
- **Decision authority:** the closed [Wayfinder map](map.md) and its linked resolutions.
- **Prototype reference:** the selected [staged gather-first workspace](prototypes/gather-first-workspace-prototype.html).
- **Source quality:** this specification is grounded in the current repository and the completed product decisions. It makes no external factual, legal, or source-quality claims.
- **Assumption:** there are no users or downloaded version-1 board files requiring migration.
- **Compatibility boundary:** a syntactically valid Evidence Link provides traceability only; the app does not verify source quality or factual accuracy.
- **Delivery boundary:** the specification is ready for implementation, but none of its new behavior is considered verified until the structural and Chromium gates run against production code.
