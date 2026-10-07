# Argument Maker UX improvements

Status: design interview complete; product direction confirmed by the user. The decisions below describe intended behavior, not implemented functionality.

## Goal and scope

Help a first-time user build an argument they can explain and defend. Improve the existing individual, browser-based workflow.

Use Stephen P. Anderson's six-level [User Experience Hierarchy of Needs](https://poetpainter.com/thoughts/files/UX-Hierarchy-Model-StephenPAnderson.pdf): functional, reliable, usable, convenient, pleasurable, meaningful.

The current findings come from source inspection. Browser screenshot capture failed during this review; visual quality, responsive behavior, and accessibility have not been validated in this session. These are design hypotheses, not findings from user research.

## Agreed decisions

1. Start with a question or tentative claim by default. Evidence gathering supports developing and testing that initial framing.
2. Keep an open workspace with suggested next actions and freedom to skip ahead. Do not introduce a strict wizard.
3. Separate structural completeness from the author's reasoning review. Neither certifies truth or argument quality.
4. Make reasoning review part of the normal finishing flow. Ask whether evidence supports the claim, what important objection needs attention, and what could change the author's conclusion.
5. Accept a descriptive source citation as an alternative to a public URL. Support books, interviews, and observations without requiring invented links. Keep observations and estimates identifiable.
6. Offer optional Audience and Intended outcome prompts near the starting question or claim. Bring those answers back into the reasoning review.
7. Before the first writing export, offer Review now and Export draft. Review must not block sharing unfinished work. Downloading the editable board remains immediately available.
8. Introduce missing-information guidance after interaction rather than treating every untouched field as an error.

Definitions are recorded in [GLOSSARY.md](../../GLOSSARY.md).

## Opportunities by hierarchy level

| Level | Current evidence | Proposed improvement |
| --- | --- | --- |
| Functional | Gather Facts is the default stage; complete facts require URLs. | Start from the user's question or tentative claim; accept traceable sources without public URLs. |
| Reliable | Clipboard writes do not report success or failure. | Confirm successful copying and provide a recoverable failure message. |
| Usable | The attachment picker uses the same unavailable message for different situations. | Distinguish no research, incomplete research, and facts already attached, with the relevant next action. |
| Convenient | Another fact from this source reuses the URL alone. | Reuse source title, date, and descriptive citation while leaving new fact text and quotation empty. |
| Pleasurable | Newly created facts immediately show incomplete guidance. | Use inviting writing prompts, then contextual validation and a suggested next action. |
| Meaningful | Existing reasoning notes have no explicit audience or intended outcome. | Connect the author's review to whom the argument is for and what it should help them understand or do. |

The feedback, picker, and source-reuse changes are recommendations from the inspection. They have not been implemented.

## Recommended implementation order

| Order | Work | Intended result |
| --- | --- | --- |
| 1 | Copy success/failure feedback, actionable attachment-picker states, and reuse of existing source metadata. | Users can tell whether actions worked and recover without guessing. |
| 2 | Question or tentative claim first, optional audience/outcome prompts, suggested next actions, and validation after interaction. | A newcomer understands where to begin and can proceed without a strict wizard. |
| 3 | Descriptive citations across fact entry, completeness, source reuse, search, previews, all writing outputs, and board persistence. | Users can support an argument with traceable material that has no public URL. |
| 4 | The agreed reasoning-review and draft-export flow. | Users can examine their argument's purpose and reasoning, then share either a draft or their reviewed writing. |

This order starts with bounded improvements to existing interactions, then changes the core journey and source model before adding the finishing flow. It is a delivery recommendation, not an estimate or evidence of user impact.

## Compatibility and behavior constraints

- Existing board files and optional local drafts must continue to open. Optional new fields must survive board downloads, imports, saving, and undo/redo.
- A board containing only Audience or Intended outcome still contains user work and must receive the existing protection against accidental replacement.
- Source completeness must be consistent across attachment eligibility, filters, structural checks, preview, and exports.
- A citation-only item must not appear as a missing-link error in writing output. Supplied malformed URLs still need correction feedback.
- Copy Outline, Markdown, text, and Print/PDF are writing outputs. Editable board download does not enter the writing-review flow.
- Preserve the distinction between reasoning that can stand on its own and evidence-backed support. A source reference is provenance, not a credibility rating.
- Older app versions may preserve new optional fields while still treating citation-only facts as incomplete. Do not promise that older versions understand the new completeness rule.

Relevant code includes `src/board/argument-board.ts`, `src/board/export-file-contract.ts`, `src/board/argument-board-session.ts`, `src/board/writing-export.ts`, `src/board/argument-preview-projection.ts`, `src/ui/writing-view.ts`, and `src/ui/argument-board-browser.ts`.

## Agreed review and export behavior

1. Show the prompt once per board session, reset by importing or clearing a board, with review always accessible. Ordinary edits do not repeatedly interrupt export, and a prior review does not certify later work.
2. Review now shows structural gaps, audience/outcome, and reasoning prompts in a focused review surface, then offers Continue to export. Reflection fields remain optional, and there is no verified badge.
3. Export draft includes a visible Draft label. Exporting after review omits that label without claiming the argument is correct.
4. Audience/outcome remain private planning context by default. Preserve them in editable board files and show them during review, but omit them from audience-facing writing output.

No product questions remain open for this recommendation brief. Implementation details and visual validation remain future work.

## Verification needed after implementation

- Walk a new user through question or claim, evidence, supporting reasoning, review, and writing export on desktop and mobile.
- Exercise URL-only and citation-only sources, incomplete drafts, reused sources, and malformed supplied URLs.
- Check all writing formats for readable citations, consistent numbering, and the agreed draft label behavior.
- Round-trip old and new board files and local drafts. Check undo/redo and replacement protection for new fields.
- Verify keyboard navigation, focus and announcement behavior for guidance, validation, copy feedback, and review.
- Test clipboard failure recovery and confirm that the review prompt does not block exporting unfinished work.

No ADR has been created. The interview has not selected a hard-to-reverse architecture or file-format trade-off.
