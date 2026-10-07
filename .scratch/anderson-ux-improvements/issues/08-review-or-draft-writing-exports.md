# 08: Offer review or clearly labeled draft output before writing exports

**What to build:** Before the first writing export in a board session, the author can review the argument or export a visibly labeled draft. Review resumes the chosen output, remains optional, and never obstructs downloading the editable board.

**Blocked by:** 07: Provide an accessible Reasoning review workspace.

**Status:** complete (local; no external tracker configured)

- [x] Offer Review now and Export draft before the first Copy Outline, Markdown, text, or Print/PDF action in a board session.
- [x] Review now opens the existing Reasoning review with a Continue to export action that resumes the originally selected writing output.
- [x] Export draft bypasses review and includes a visible Draft label in the actual clipboard text, downloaded writing, or print content, as appropriate.
- [x] Continue to export after review omits the Draft label without claiming correctness; reflection fields and unresolved structural gaps do not become mandatory export gates.
- [x] Show the invitation once per board session; ordinary edits and repeated exports do not repeatedly interrupt the author.
- [x] Importing or clearing a board resets the invitation for the new board session. Keep this state separate from structural-check caching and do not persist an enduring reviewed/verified state in board files.
- [x] Keep review accessible and retain a way to choose draft output after the first invitation has been handled.
- [x] Download Board remains immediately available without entering review. Technical Mermaid export is outside the writing-review flow.
- [x] Preserve source content, canonical citation numbering, output escaping, and omission of Audience and Intended outcome in every writing format.
- [x] Preserve clipboard success/failure behavior if present, and do not lose the author's board when an output action fails or is cancelled.
- [x] Verify both review and draft paths through the existing browser workflow, including recurrence, import/clear reset, review re-entry, direct board download, and the contents of each writing format.
- [x] Inspect the invitation, review continuation, and printed Draft label; verify keyboard focus and desktop/mobile usability. Report visual/browser evidence separately from static checks.

Verification: [implementation checks and rendered evidence](../../../docs/issues/anderson-ux-verification.md).
