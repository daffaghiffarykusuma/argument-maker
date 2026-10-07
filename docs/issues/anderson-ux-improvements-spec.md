# Help first-time users build and review a defensible argument

Publication status: local specification, not published. Project issue-tracker configuration and triage vocabulary were not found. Intended publication label: `ready-for-agent`, as required by the to-spec workflow. The proposed testing boundaries below await the user's required seam check.

## Problem Statement

A first-time Argument Maker user needs to turn a question or tentative claim into an argument they can explain and defend. The current research-first entry asks them to gather facts before making their purpose clear. Immediate incomplete-state guidance can make beginning a board feel like correcting mistakes, while ambiguous attachment states leave them unsure what to do next.

Source handling excludes useful material without public URLs, including books, interviews, and observations. Repeating source entry creates unnecessary work, and copy actions do not tell the user whether they succeeded. Completing the board's structure is also different from deciding whether its reasoning supports the Answer, addresses an important objection, and serves the intended Audience.

Users need help with these decisions while retaining freedom to move around the workspace and share unfinished work. The app must not suggest that completed fields or a reasoning review certify truth or argument quality.

## Solution

Keep the individual, browser-based Argument Board and make a question or tentative claim the default starting point. Offer optional Audience and Intended outcome prompts, suggested next actions, and contextual guidance without imposing a wizard.

Allow a Gathered Fact to cite either a valid Evidence Link or a Descriptive citation. Carry that Source reference consistently through attachments, search, preview, saving, and writing outputs. Explain attachment availability, reuse source metadata, and give copy actions clear success or recovery feedback.

Before the first writing export in a board session, offer Review now and Export draft. Review brings together structural gaps, the author's purpose, and reasoning prompts. It remains optional and leads to Continue to export. Export draft produces a visible Draft label; exporting after review omits that label without certifying correctness. Download Board remains immediately available. Audience and Intended outcome remain private planning context in writing outputs while surviving in editable board files.

## User Stories

1. As a first-time author, I want to begin with a question, so that I know what my research needs to answer.
2. As a first-time author, I want to begin with a tentative claim, so that I can develop and test an idea I already have.
3. As an author, I want to revise my Question and Answer as I learn, so that the initial framing does not lock me into a conclusion.
4. As an author, I want to move between constructing an argument, gathering facts, and previewing it, so that I can work in the order my thinking requires.
5. As a first-time author, I want a suggested next action, so that I can make progress without learning the whole interface first.
6. As an author, I want to skip suggested guidance, so that it does not become a mandatory wizard.
7. As a first-time author, I want writing prompts on untouched fields, so that an empty board does not initially look like a list of errors.
8. As an author, I want missing-information feedback after interaction, so that I can correct incomplete work when the feedback is useful.
9. As an author, I want to identify my Audience, so that I can choose explanations and evidence relevant to them.
10. As an author, I want to state my Intended outcome, so that I can distinguish what I want readers to understand or do from the Answer itself.
11. As an author, I want those purpose prompts to be optional, so that I can start without having every detail settled.
12. As an author, I want to cite a public webpage, so that existing link-based evidence remains usable.
13. As an author, I want to describe a book passage or other offline source, so that I can use material without a public URL.
14. As an author, I want to identify interview evidence descriptively, so that I do not have to invent a link to use it.
15. As an author, I want observations and estimates to remain identifiable, so that readers can distinguish their nature from other supporting material.
16. As an author, I want to supply both a URL and a Descriptive citation when useful, so that source context is not lost merely because a link exists.
17. As an author, I want malformed supplied URLs to receive correction feedback, so that I do not unknowingly share broken or unsafe links.
18. As an author, I want to keep incomplete Gathered Facts as drafts, so that I can capture findings before completing their sources.
19. As an author, I want citation-only facts to become eligible for attachment when complete, so that offline evidence can support my argument.
20. As an author, I want one fact reused in several destinations to remain a live reference, so that editing it updates every placement.
21. As an author, I want guidance when I have gathered no facts, so that I know how to add supporting material.
22. As an author, I want guidance when my unattached facts are incomplete, so that I know what to finish before attaching them.
23. As an author, I want to know when all eligible facts are already attached to a destination, so that I do not mistake that state for missing research.
24. As an author, I want another fact from the same source to reuse its URL, title, date, and citation, so that I do not re-enter shared provenance.
25. As an author, I want the new fact's text and quotation to start empty, so that the previous finding is not silently duplicated.
26. As an author, I want source citations included in fact search, so that I can find research by its provenance.
27. As an author, I want completeness filters, attachment eligibility, structural checks, and preview to agree, so that I receive consistent guidance.
28. As an author, I want copy success feedback, so that I know when I can paste my output elsewhere.
29. As an author, I want a recoverable copy failure message, so that clipboard restrictions do not leave me guessing or lose my work.
30. As an author, I want structural completeness distinguished from reasoning quality, so that completed fields do not create false confidence.
31. As an author, I want a review invitation before my first writing export, so that I have an opportunity to examine my reasoning before sharing.
32. As an author, I want the review to show structural gaps alongside my Audience and Intended outcome, so that I can consider both completeness and purpose.
33. As an author, I want to consider how evidence supports my Answer, so that citations do not substitute for explaining the connection.
34. As an author, I want to consider an important objection and what could change my conclusion, so that I can identify limitations in my argument.
35. As an author, I want to continue to export without completing every reflection field, so that review does not become a gatekeeper.
36. As an author, I want Export draft to bypass review and visibly label the output, so that I can share unfinished work for feedback.
37. As an author, I want the prompt only once per board session, so that ordinary edits and repeated exports do not repeatedly interrupt me.
38. As an author, I want review to remain accessible after the initial prompt, so that I can return to it when my argument changes.
39. As an author, I want a newly imported or cleared board to receive its own review invitation, so that the previous board's session choice does not carry over.
40. As an author, I want editable board downloads available without review, so that I can back up or transfer work at any stage.
41. As an author, I want Copy Outline, Markdown, text, and print output to retain readable citations, so that source information survives the format I choose.
42. As an author, I want reused facts to retain consistent source numbering, so that readers can follow citations without duplicate source entries.
43. As an author, I want Audience and Intended outcome omitted from audience-facing writing, so that private planning context is not unexpectedly disclosed.
44. As an author, I want that planning context preserved in editable board files and enabled local drafts, so that I can continue working later.
45. As an author, I want older supported board files to open and new fields to round-trip, so that this improvement does not strand existing work.
46. As an author, I want undo and redo to include citations and purpose fields, so that those edits behave like other board content.
47. As an author, I want a board containing only purpose fields protected against accidental replacement, so that early planning still counts as work.
48. As a keyboard user, I want guidance, review, and copy feedback to preserve usable focus and announce relevant status, so that I can complete the workflow without a mouse.
49. As an author using a narrow screen, I want the starting prompts and review controls to remain usable, so that the same individual workflow works on mobile.

## Implementation Decisions

- Retain the existing individual Argument Board, SCQA framing, single Answer, canonical Gathered Facts, live Fact Attachments, Support Modes, optional Local draft, and supported Writing export formats. No account or server service is introduced.
- Use the existing Question and Answer concepts for the question or tentative-claim entry. Do not create a competing claim entity. Keep stage navigation available, with plain-language prompts and a suggested next action rather than a compulsory sequence.
- Extend the Argument Board's editable content with optional Audience and Intended outcome. Include them in undoable edits, touched-content detection, replacement protection, file serialization, and enabled local saving. They do not become mandatory structural-readiness fields.
- Add an optional Descriptive citation to a Gathered Fact rather than overloading Evidence Link or source title. Source reference means a valid HTTP/HTTPS Evidence Link, a nonblank Descriptive citation, or both. Do not require a public URL for a citation-only source or add mandatory citation subfields.
- Keep completeness rules centralized in the board model and use them consistently in attachments, fact filters, structural checks, Argument Preview, and exports. Non-empty fact text and an acceptable Source reference establish completeness, not accuracy. A malformed supplied URL still needs visible correction feedback and must never be rendered as an unsafe link.
- Preserve the distinction between source availability and URL errors: a Descriptive citation can supply provenance, but it does not validate an accompanying malformed URL. Prevent contradictory status messages that present malformed URLs as valid.
- Extend source reuse to include URL, title, date, and Descriptive citation. Leave the new fact text and quotation empty. Keep partial source dates at their supplied precision.
- Extend the existing fact-library search to Descriptive citations. Preserve live editing, shared-fact updates, keyboard focus, and disclosure state when filters change.
- Make attachment empty states reflect the available research. If no research exists, offer to gather a fact. If unfinished unattached research exists, offer to complete it. If every eligible fact is already attached, explain that state. Mixed states must still identify the useful next action.
- Keep existing structural checks available, but stage visible guidance around interaction. Do not weaken structural rules merely to avoid showing errors on untouched fields.
- Handle clipboard completion and failure explicitly in the browser interaction layer. Announce success only after the write succeeds. On failure, retain the board, explain the failure, and provide a usable retry or existing export alternative.
- Put reasoning review in the existing browser workflow, using a focused surface with structural gaps, Audience, Intended outcome, and the existing reasoning prompts. Continue to export resumes the selected writing action. Opening review alone must not assign a quality judgment or verified badge.
- Keep human review separate from the existing structural-check cache. The first-export invitation is transient board-session state, not a persisted certification. Importing or clearing starts a new board session; ordinary edits do not repeatedly trigger the invitation. Review remains reachable afterward.
- Include Copy Outline, Markdown, text, and Print/PDF in the writing-review flow. Leave Download Board immediately available. Technical Mermaid export remains outside the writing-review flow.
- Export draft visibly labels writing as Draft. Continue to export after review omits that label without certifying correctness. Preserve a way to choose draft output and access review after the first invitation has been handled.
- Keep Audience and Intended outcome out of audience-facing writing by default. Preserve them in editable board files and show them during review. This exclusion does not silently change the existing treatment of Reasoning notes in writing outputs.
- Carry Descriptive citations through every source presentation, including the separate outline-copy projection and readable/print rendering. Citation-only sources must not produce missing-link warnings simply because their URL is empty. Preserve source numbering by canonical fact identity and keep unused research in editable board files.
- Prefer additive optional fields within the current version-2 Export File Contract, retaining the existing Evidence Link string, including an empty string for citation-only sources. Validate the types of newly recognized fields and preserve valid unknown fields. Older supported boards need no invented metadata. Older app versions may preserve new fields but still regard citation-only facts as incomplete; do not promise backward behavioral support.
- Keep current local-saving defaults, conflict handling, incomplete-draft persistence, and rejected-import preservation. Do not persist an enduring reviewed or verified status in board files.
- Deliver in four passes: existing interaction feedback and source reuse; starting flow and purpose prompts; descriptive citations throughout the product; reasoning review and draft exports. This is implementation ordering, not a schedule or effort estimate.

## Testing Decisions

The following boundaries are proposed for the required user seam check. Prefer the existing browser workflow as the primary, highest-level boundary. Use existing public board/session and persistence contracts only for focused edge cases that would be slow or difficult to reproduce reliably in a browser. No new test-only production interface is needed.

- A good test drives a public user action or public module operation and asserts an observable result: visible guidance, focus, accessible status, exported contents, preserved data, or a recoverable failure. Avoid private-state assertions, helper call counts, style snapshots, and tests that merely repeat implementation logic.
- Extend the current complete Chromium workflow to cover question/claim-first entry, free navigation, purpose prompts, fact entry, source reuse, attachment states, reasoning review, and both writing-export paths. Existing prior art already covers shared facts, ordered attachments, filter reconciliation, keyboard focus, native undo, readable outline, diagram preview, imports, and local-draft interactions.
- At the browser boundary, verify fresh versus interacted-with guidance, citation-only attachment, all three unavailable-picker situations, copy success/failure, one invitation per board session, import/clear reset, review re-entry, and immediate editable-board download. Exercise keyboard use and a narrow viewport as well as desktop.
- Verify visible Draft labels in Copy Outline, Markdown, text, and print output when the draft path is chosen, and their absence after Continue to export. Test artifact content rather than only the button or download event. Confirm Audience and Intended outcome are absent from writing output and that source citations remain readable.
- Use the existing Argument Board session public interface for undo/redo, touched-content detection, rejected-import preservation, and structural readiness following edits. Existing session tests cover atomic create-and-attach, cascading-delete undo, clear/import replacement, and readiness recomputation. Extend that pattern for purpose fields and citation-only support.
- Use the existing Export File Contract for representative round-trips: an older supported board, a new board with all optional fields, citation-only research, incomplete research, reused fact references, and valid unknown fields. Reject malformed known-field types without replacing the active board. Existing board-file and product-feature tests provide this prior art.
- Use the existing writing-export and preview-projection public outputs for a compact source matrix: URL only, citation only, both, missing provenance, malformed supplied URL, and one source reused in several destinations. Assert consistent numbering, source text, incomplete-state guidance, and safe rendering. Preserve existing escaping and unsafe-URL behavior.
- Extend the existing Local draft tests only where the new fields could be lost or fail to count as user work. Reuse its injected storage and clock boundaries for save/restore and failure cases; preserve its current opt-in and cross-tab conflict guarantees without duplicating the full suite.
- Do not assert that a review confirms truth or that filling reflection fields proves quality. Assert the absence of certification claims and the ability to export unfinished work.
- Run the relevant Bun tests, typecheck, and build during implementation. The existing browser workflow is launched through Node from the Bun test runner because of its Windows Chromium transport requirements. Report browser results separately from non-browser checks, and report any harness failure as an incomplete check rather than a successful UX validation.
- Inspect rendered desktop and mobile states after implementation, including starting prompts, validation, the review surface, and print output. Automated checks do not replace visual inspection or establish full accessibility conformance.

## Out of Scope

- Accounts, shared editing, team workflows, cloud synchronization, server storage, and publication hosting.
- AI-generated arguments, source discovery, automatic fact-checking, credibility scoring, or certification of a Defensible argument.
- A mandatory wizard, compulsory reasoning fields, or blocking exports until an argument meets a quality threshold.
- A broad visual redesign, a new design system, or replacement of SCQA and Minto Pyramid concepts.
- Changing local saving to opt-out, removing existing conflict protection, or persisting a permanent reviewed badge.
- Mandatory citation-style formatting, external citation services, or requiring exact dates when only partial dates are known.
- A general file-format migration or support for file versions the app already rejects.
- Unrelated dependency work, performance refactoring, or test-suite restructuring.
- Treating the lower-level UI recommendations as already implemented or claiming measured improvement in learning, reasoning, completion, or retention.

## Further Notes

- Product decisions were confirmed during the grill-with-docs conversation. This spec synthesizes that agreement and current source inspection; technical details above explain how the agreed behavior fits existing module boundaries.
- The framework is Stephen P. Anderson's six-level User Experience Hierarchy of Needs: functional, reliable, usable, convenient, pleasurable, and meaningful. The original model is available at https://poetpainter.com/thoughts/files/UX-Hierarchy-Model-StephenPAnderson.pdf.
- Browser screenshot capture failed during the design review. The opportunities are grounded in source inspection and product decisions, not a completed visual audit or user study. No implementation tests were run for this documentation-only specification.
- No applicable ADR was found, and no hard-to-reverse architectural choice was settled during the interview. Preserve the existing architecture and prefer additive changes.
- Issue publication is pending project tracker setup via `/setup-matt-pocock-skills` and the to-spec workflow's test-boundary check. Once those prerequisites are satisfied, publish this specification with `ready-for-agent`; do not substitute another label or claim it has been published locally.
