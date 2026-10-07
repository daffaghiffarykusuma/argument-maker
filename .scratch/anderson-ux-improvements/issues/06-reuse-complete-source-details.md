# 06: Reuse complete source details when adding another fact

**What to build:** Another fact from this source creates a new Gathered Fact with the source provenance already filled in, while leaving the new finding and quotation for the author to write.

**Blocked by:** 05: Support Descriptive citations throughout the argument workflow.

**Status:** complete (local; no external tracker configured)

- [x] Reuse the source's Evidence Link, source title, source date, and Descriptive citation in the new fact.
- [x] Leave the new fact text and quotation empty, with a distinct canonical fact identity and no accidental duplication of the prior finding.
- [x] Preserve partial dates exactly as supplied; do not infer missing date precision.
- [x] Support URL-only, citation-only, and combined sources as well as partially recorded source metadata.
- [x] The new item remains an incomplete draft until its required finding and provenance are supplied.
- [x] Creating the fact and editing its fields obey existing undo/redo behavior; all copied provenance survives editable-board round-trips and enabled local saving.
- [x] Move focus to a useful input for the new finding without disrupting keyboard navigation.
- [x] Verify reuse through the browser and focused existing public board/session and persistence checks, including untouched source facts and blank quotation/text.
- [x] Inspect the action and resulting fact on desktop and mobile.

Verification: [implementation checks and rendered evidence](../../../docs/issues/anderson-ux-verification.md).
