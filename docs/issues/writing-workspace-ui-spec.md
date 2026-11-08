# Create a calmer writing workspace with clearer research, review, and exports

Delivery status: implemented on `integration/writing-workspace-ui`; all seven approved local tickets under `.scratch/writing-workspace-ui/issues/` are done. The user approved the ticket graph and browser testing boundary before implementation. See [combined verification and review](writing-workspace-ui-verification.md). Project external issue-tracker configuration was not found; no external issue or label was created. Run `/setup-matt-pocock-skills` for external tracking.

## Problem Statement

A first-time author needs to turn a Question or tentative Answer into an Argument they can explain and defend. The current workspace presents four framing fields and two optional planning fields before Supporting Arguments. Research cards expose many editing controls at once, and the interface asks the author to distinguish reasoning, evidence, and utility actions within a dense working surface.

Writing outputs are distributed between the command rail and Preview, while downloading an editable Argument Board is a different task. Authors must infer where to finish their writing and how that differs from saving a portable backup. On narrower screens the live outline disappears, and mobile toolbar labels are hidden. Entering Reasoning review replaces the current stage without a sufficiently distinct navigation context.

Authors need a calmer workspace that makes the next writing action clear, preserves orientation, and keeps research, review, and export controls understandable. These opportunities come from current source inspection, not a rendered UI audit or user research.

## Solution

Prioritize first-time writers while keeping advanced controls accessible. Refine the existing dark workspace with charcoal surfaces, fewer borders, larger writing text, restrained spacing, and a clear hierarchy from Answer to Supporting Arguments to evidence. Replace the desktop command rail with a compact header and preserve free movement between workflow tabs.

Keep Question, Answer, and Supporting Arguments visible. Place Situation and Complication in expandable Context, and Audience and Intended outcome in expandable Planning, with summaries of existing content. Keep a live outline beside the editor on wide screens and offer View outline on narrower screens without losing the author's editing position.

Show existing Gathered Facts as concise summaries with explicit editing. Introduce searchable attachment selection that explains availability and the scope of shared edits. Group writing formats under Export writing, keep editable board downloads separate, and give Reasoning review a clear location and return action. Preserve existing data, review, saving, and writing-output behavior.

## User Stories

1. As a first-time author, I want Question and Answer visible when I start, so that I understand where to begin.
2. As an author, I want to begin with either a Question or a tentative Answer, so that I can develop the idea I already have.
3. As an author, I want Supporting Arguments readily visible, so that I can connect reasons to my Answer.
4. As an author, I want Situation and Complication grouped under Context, so that supporting framing does not dominate the initial workspace.
5. As an author, I want to expand Context whenever needed, so that I can revise my framing without following a forced sequence.
6. As a returning author, I want collapsed Context to summarize existing content, so that I can see what I have already written.
7. As an author, I want Audience and Intended outcome grouped under optional Planning, so that I can add purpose without facing extra mandatory fields.
8. As a returning author, I want collapsed Planning to summarize existing content, so that my intended Audience and outcome remain discoverable.
9. As an author, I want disclosure changes to preserve my writing, so that organizing the workspace cannot discard work.
10. As an author, I want to move freely between Construct Argument, Gather Facts, and Preview, so that the workspace supports my own process.
11. As a first-time author, I want workflow tabs without numbered steps, so that I understand they do not impose a wizard.
12. As an author, I want suggested next actions to remain available, so that I have guidance when I am unsure what to do.
13. As an author, I want the Answer to have the strongest visual emphasis, so that the central claim is easy to identify.
14. As an author, I want Supporting Arguments visually distinct from attached facts, so that reasoning and evidence are easy to distinguish.
15. As an author, I want readable writing text and spacing between sections, so that I can work through a substantial argument comfortably.
16. As an author, I want a restrained dark workspace with fewer competing borders, so that utility controls do not overwhelm my writing.
17. As a desktop author, I want a compact header instead of a persistent command rail, so that more width is available for writing.
18. As an author, I want Export writing clearly visible, so that I can find the finishing action without changing stages.
19. As an author, I want file actions grouped under Board, so that board management is easy to find.
20. As an author, I want Clear separated from routine file actions and existing replacement protections retained, so that I can avoid accidental loss.
21. As an author, I want undo and redo accessible, so that I can revise safely.
22. As a mobile author, I want labeled Export and More controls, so that I do not need hover tooltips to identify actions.
23. As a touch user, I want comfortably sized and spaced controls, so that I can operate the workspace accurately.
24. As a desktop author, I want the live outline beside the editor when space permits, so that I can inspect the argument while writing.
25. As a laptop author, I want View outline when the side-by-side layout no longer fits, so that orientation does not disappear at a breakpoint.
26. As a mobile author, I want an on-demand outline and a focused single-column editor, so that both remain readable.
27. As an author, I want closing the outline panel to return to the same editing position, so that checking structure does not interrupt my work.
28. As an author, I want existing Gathered Facts summarized with finding, source, and usage, so that I can scan research without opening every editor.
29. As an author, I want an explicit Edit action for a fact, so that detailed fields appear when I need them.
30. As an author, I want newly created facts to open expanded, so that I can begin entering research immediately.
31. As an author, I want collapsing and reopening a fact editor to preserve its content, so that changing presentation cannot lose edits.
32. As an author, I want shared facts to explain that changes update every use, so that I understand the effect before editing.
33. As an author, I want edits to a Gathered Fact reflected in every Fact Attachment, so that reused research stays consistent.
34. As an author, I want to search facts while choosing evidence for a destination, so that a larger research collection remains manageable.
35. As an author, I want the picker to show finding snippets and Source references, so that I can select the intended item confidently.
36. As an author, I want the picker to show fact usage, so that I understand where research is already used.
37. As an author, I want incomplete facts distinguished from already-attached facts, so that I know why an item is unavailable.
38. As an author, I want relevant recovery actions for unavailable facts and empty selections, so that I can continue without guessing.
39. As an author, I want eligible facts attached to the current destination without leaving it, so that research selection does not interrupt construction.
40. As an author, I want citation-only facts handled consistently with URL-backed facts, so that books, interviews, and observations remain usable.
41. As an author, I want Copy, Markdown, Text, and Print/PDF grouped under Export writing, so that output formats are easy to find.
42. As an author, I want Download editable board separate from writing formats, so that I can distinguish a portable backup from audience-facing writing.
43. As an author, I want editable board download to remain available without writing review, so that I can save unfinished work immediately.
44. As an author, I want the existing optional review invitation preserved for writing exports, so that I can review or deliberately export a draft.
45. As an author, I want the chosen writing action to resume after review, so that I do not need to select the format again.
46. As an author, I want existing Draft labels preserved across writing formats, so that unfinished writing is identified consistently.
47. As an author, I want Reasoning review clearly titled with Back to editing, so that I understand where I am and how to resume.
48. As an author, I want returning from review to restore my previous workflow tab and position, so that review does not lose my place.
49. As an author, I want structural checks labeled separately from Reasoning review, so that completed fields are not confused with sound reasoning.
50. As an author, I want review to remain optional and avoid claims of verified quality, so that I retain responsibility for my conclusions.
51. As an author, I want Audience and Intended outcome retained in my board but omitted from writing exports, so that planning context stays out of audience-facing output.
52. As a keyboard user, I want to operate menus, disclosures, fact editing, the picker, and outline access, so that pointer use is not required.
53. As a keyboard user, I want visible focus and a sensible return destination after closing a panel, so that navigation does not strand me.
54. As a screen-reader user, I want named controls and appropriate status announcements, so that I can understand actions and their results.
55. As an author, I want status text alongside color, so that meaning is not conveyed by color alone.
56. As an author, I want long content and controls to fit desktop, laptop, and phone layouts, so that writing does not require unintended horizontal scrolling.
57. As a returning author, I want existing board files and enabled Local drafts to retain my work, so that the redesign does not disrupt ongoing arguments.
58. As an author, I want native text undo and board undo/redo to retain their existing behavior, so that editing remains predictable.
59. As an author, I want fact search, source reuse, attachment ordering, and removal to remain available, so that compact presentation does not remove research capabilities.
60. As an author, I want the workspace to remain lightweight and responsive, so that the visual redesign does not slow down writing.

## Implementation Decisions

- Prioritize desktop writing with useful mobile editing and review, while retaining the open workspace and suggested next actions. Do not add a strict wizard.
- Retain a dark, restrained palette with charcoal surfaces and the system font. Improve typography, spacing, and visual hierarchy using existing browser capabilities rather than introducing visual runtime dependencies.
- Update the workspace rendering and styles to replace the desktop command rail with a compact header. Keep Export writing prominent; place file actions under Board and separate Clear within that menu. Preserve undo/redo access. Mobile uses labeled Export and More controls.
- Remove step numbers from workflow tabs while preserving existing keyboard navigation and free movement between stages.
- Update construction rendering to keep Question, Answer, and Supporting Arguments visible, with expandable Context and Planning sections. Summaries expose existing content when collapsed. Disclosure behavior must preserve editor content and existing interaction state.
- Adapt the existing live outline to available width. Keep it beside the editor when readable and offer a View outline panel otherwise. Closing it restores the editing position and appropriate focus. Tune breakpoints against actual rendered content rather than retaining an arbitrary threshold.
- Update gathered-fact rendering and editing to separate concise summaries from explicit editing. Existing summaries include finding, Source reference, and usage; new facts begin expanded. Shared-edit scope remains visible and canonical Gathered Facts continue to update all Fact Attachments.
- Extend attachment selection with search, snippets, source context, and usage. Keep eligibility consistent with existing completeness rules. Distinguish incomplete, already-attached, and empty states and provide relevant recovery actions. Eligible selection attaches to the intended destination without leaving the current argument.
- Consolidate writing actions under Export writing, reusing the existing Copy, Markdown, Text, and Print/PDF implementations. Board download remains a distinct editable-file action available without the writing-review invitation.
- Preserve the existing once-per-board-session writing-review invitation, reset behavior, pending writing action, optional reasoning prompts, and Draft labeling. Ordinary edits must not introduce repeated export interruptions.
- Give Reasoning review an explicit title and Back to editing action. Preserve the originating workflow tab and position for return. Continue to export resumes the pending writing action. Keep structural checks visibly distinct.
- Reuse existing board commands, session history, fact editing, preview, writing export, and Local draft boundaries. Add UI state only where needed for presentation, menus, search, and return destinations. No board schema or import/export contract change is planned.
- Preserve source validation, Descriptive citations, source metadata reuse, source numbering, unused research in board files, and the omission of Audience and Intended outcome from writing outputs.
- Preserve read-only Preview, local operation, optional draft saving off by default, conflict resolution, and accidental replacement protection.
- Use accessible names, visible focus, keyboard interaction, focus return, status text and announcements, readable contrast, and comfortable touch targets throughout the new controls. Hover tooltips cannot be the only identification mechanism.

## Testing Decisions

- Approved primary seam: the running Argument Board application through the existing Chromium browser workflow harness. Exercise the redesign as an author would, through visible controls, keyboard actions, downloads, and resulting writing output. No new production injection interface or lower-level test seam is proposed.
- Good tests assert external behavior and preservation of work. Avoid snapshots of full markup, private view-state assertions, CSS class coupling, or tests that mirror renderer implementation.
- Exercise the workspace shell, construction disclosures, gathered-fact editing and selection, responsive outline, review navigation, and writing actions through this single application boundary. Reuse current board and export unit tests as regression protection rather than creating duplicate unit coverage for presentation.
- Prior art includes the existing complete question-first workflow, fact-entry guidance and attachment-recovery workflows, source-reuse and shared-edit checks, descriptive-citation workflows, reasoning-review keyboard checks, and writing-review/export workflows. Extend these patterns instead of creating a separate harness.
- Cover fresh and populated boards. Verify Context and Planning summaries, expansion, and preservation of edits; existing facts as summaries; new facts as editors; shared changes visible in all uses; and search results with eligible, incomplete, already-attached, empty, and citation-only cases.
- Cover opening and closing the responsive outline and Reasoning review from relevant stages. Verify return to the originating workflow tab, editing position, and sensible focus without loss of content.
- Cover Export writing formats and direct editable-board download. Verify review versus draft paths, pending-format continuation, existing invitation reset rules, Draft labels, citation numbering, and planning-context omission. Retain clipboard success/failure recovery checks.
- Verify keyboard operation, visible focus, focus restoration, accessible names, and status feedback. Pair automated checks with manual keyboard and visual review; screenshots alone cannot establish accessibility compliance.
- Inspect rendered new-board, populated-board, research, review, and export states at desktop, laptop, and mobile widths, including the transition between side-by-side and panel outlines. Include long content and empty states and check for unintended horizontal scrolling. Screenshots document actual observed states rather than replacing behavior assertions.
- Run the existing board unit suite and Chromium browser workflows, plus typecheck, production build, and whitespace validation. The existing browser harness uses Node for Chromium workflows on Windows; retain that execution boundary.
- Verify board-file round trips, enabled Local draft restoration, undo/redo, native editor undo, shared-edit synchronization, and replacement protection. Reuse existing fixtures and regression coverage where it already establishes these contracts.
- Validation is future implementation work. This specification does not claim that the redesigned UI, accessibility, or responsive behavior has already passed checks.

## Out of Scope

- A light theme, theme selector, new font delivery, decorative imagery, or a new visual runtime library.
- A forced wizard, required planning fields, mandatory reasoning review, or truth, credibility, persuasiveness, or quality scoring.
- Changes to the Argument Board domain model, schema version, compatibility contract, or writing format definitions.
- Changing source completeness rules or certifying source accuracy.
- Cloud synchronization, accounts, collaborative editing, automatic fact retrieval, or changes to the Local draft opt-in policy.
- Making Preview the editing surface or replacing the existing diagram engine.
- Including Audience or Intended outcome in audience-facing writing exports.
- Unrelated architecture refactoring, dependency upgrades, or cleanup.

## Further Notes

The user confirmed the product direction and each recommended interaction in the design interview. This specification synthesizes those decisions and the current domain glossary. No new domain terminology or consequential architectural trade-off requires a glossary change or ADR.

Recommended delivery order is the shell and responsive controls, construction and outline access, fact summaries and selection, then consolidated writing exports and explicit review navigation. Exact spacing, font sizes, and breakpoints remain implementation choices to tune against rendered content.

The current code already includes question-first guidance, a worked example, optional planning context, Descriptive citations, shared research, delayed validation, review invitations, and draft exports. Preserve those behaviors; they are not new features in this specification. The older Command Desk brief contains obsolete starting-slot assumptions. Retain the current one-Supporting-Argument default and current shared-fact model.

External tracker publication remains pending configuration through `/setup-matt-pocock-skills`. The approved local ticket graph is the implementation record for this run. No parent issue should be modified or closed.
