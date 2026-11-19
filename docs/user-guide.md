# Argument Maker user guide

Argument Maker helps you build a well-reasoned argument for a blog post, video
script, review, or similar piece of writing. Product terms are defined in
[GLOSSARY.md](../GLOSSARY.md).

## Workflow

The workspace starts in **Construct Argument** with a Question or a tentative
Answer. Suggested next actions help you develop your idea, and every workflow tab
stays available.

- **Construct Argument** keeps the Question, Answer, and Supporting Arguments
  visible. Expand **Context** for Situation and Complication, or **Planning** for
  Audience and Intended outcome; collapsed sections summarize what they contain.
- **Gather Facts** collects supporting material once for reuse across Situation,
  Complication, and Supporting Arguments.
- **Preview** shows the structure and evidence grouped by destination, as a
  fitted diagram with zoom controls or a readable outline with numbered citations.

New boards start with one supporting argument. Evidence sections collapse to keep
construction compact. Structural checks sit in a collapsed checklist, and wide
screens show a live outline. On narrower screens, **View outline** opens the
outline and returns you to your editing position when closed. Optional reasoning
notes cover the connection to the answer, assumptions, objections, and evidence
that would weaken the claim.

Use the **Worked example** in Gather Facts to explore a complete board.

## Facts and citations

A fact needs text and either an HTTP/HTTPS Evidence Link or a Descriptive
citation, such as a book passage, interview, or observation record. You can
include both. Supplied URLs receive format checks; the app does not verify source
quality or factual accuracy.

Existing facts show summaries with explicit **Edit fact** controls. The searchable
fact picker shows sources, usage, and why unavailable items cannot be attached.
Search facts by content or source metadata, or filter for unused and incomplete
facts. Source titles, dates, quotations, and reasoning notes are optional.
**Another fact from this source** reuses the source details and leaves the new
finding and quotation blank.

## Planning context

Audience and Intended outcome are optional planning prompts. They stay in board
files and enabled local drafts, and appear during Reasoning review. Writing
exports omit them.

## Review and writing exports

Use **Export writing** in the header for Copy Outline, Markdown, Text, or
Print / Save PDF. Reused facts share one source number. Writing outputs include
attached facts; board files also preserve unused research.

Before the first writing export in a board session, choose **Review now** or
**Export draft**. Review shows structural gaps, purpose, and optional reasoning
prompts. **Continue to export** resumes the selected action without requiring
answers or certifying the argument. Draft exports visibly include **Draft** in
Copy Outline, Markdown, text, and print output. Review and the Draft label remain
available afterward. Writing produced before any choice, such as a browser print, carries the
Draft label. Opening or clearing a board resets the invitation; ordinary
edits do not.

## Saving your work

**Download editable board** (in the Board menu, or <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd>)
saves a portable `.argument.json` file. Open one again with **Upload Board**, or
drag the file anywhere onto the page. Board files use schema version 2 and include
the complete Gathered Facts collection; version-1 files are not supported.

Draft saving is off by default. After your first edit, the workspace suggests
turning it on; choose **Not now** to stop the suggestion in this browser. Enable
**Save draft in this browser** to recover your board after refresh or reopening.
Drafts stay in local browser storage, which browser settings may clear. Disabling
saving removes the stored draft and keeps the current board in the tab. A conflict
notice pauses autosave when another tab changes the draft.

The browser tab shows your board title, so several open boards stay easy to tell
apart.

## Undo

Every board change can be undone with the header **Undo** and **Redo** buttons.
Deleting a supporting argument or fact, or removing a fact from a destination,
shows a notice with an **Undo** button that restores it immediately.

## Keyboard shortcuts

Press <kbd>?</kbd> outside a text field, or choose **Keyboard shortcuts** in the
Board menu, to see this list in the app.

| Keys | Action |
| --- | --- |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd> | Download editable board |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Z</kbd> | Undo board change (outside text fields) |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> or <kbd>Ctrl</kbd>+<kbd>Y</kbd> | Redo board change (outside text fields) |
| <kbd>Alt</kbd>+<kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> | Construct Argument / Gather Facts / Preview |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>Home</kbd> <kbd>End</kbd> | Move between workflow tabs |
| <kbd>Esc</kbd> | Close a menu, fact picker, or dialog |
| <kbd>?</kbd> | Show keyboard shortcuts |

Text fields keep their native text undo.
