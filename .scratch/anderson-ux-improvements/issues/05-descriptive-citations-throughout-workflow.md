# 05: Support Descriptive citations throughout the argument workflow

**What to build:** An author can use a book passage, interview, observation, or other material without a public URL as a Source reference. Citation-only research works through entry, attachment, preview, search, saving, and every writing output.

**Blocked by:** None (can start immediately).

**Status:** complete (local; no external tracker configured)

- [x] Allow a Descriptive citation distinct from Evidence Link and source title, with no mandatory citation subfields or invented dates.
- [x] Non-empty fact text with a valid HTTP/HTTPS Evidence Link or a nonblank Descriptive citation supplies the required source provenance; either source form or both can be entered.
- [x] Observations and estimates remain identifiable through the existing Data Type rather than being represented as verified facts.
- [x] A malformed supplied URL receives correction feedback even when a citation exists and is never rendered as an unsafe link; missing URL alone is not an error for a citation-only source.
- [x] Apply consistent completeness guidance across fact entry, attachment eligibility, filters, structural checks, and Argument Preview. Unfinished facts remain saveable drafts.
- [x] Include Descriptive citations in research search and preserve live Fact Attachments when a canonical source or finding is edited.
- [x] Carry citation text into Copy Outline, Markdown, text, readable preview, and print output without spurious missing-link messages. Preserve canonical-fact citation numbering and existing escaping.
- [x] Preserve new data through undo/redo, editable-board round-trips, and enabled local drafts. Keep supported older boards loadable and preserve valid unknown fields.
- [x] Prefer additive optional fields in the existing version-2 contract, retain the Evidence Link string for compatibility, and validate new known-field types. Do not claim older app versions understand citation-only completeness.
- [x] Keep Reasoning or Interpretation support distinct from evidence-backed support; source completeness must not imply factual verification.
- [x] Demonstrate citation-only research from entry to exported writing in the browser. Use existing public session, persistence, and output seams for URL-only, citation-only, both, missing provenance, malformed URL, and reused-source cases.
- [x] Inspect source entry and rendered output on desktop and mobile, including keyboard editing and printable source text.

Verification: [implementation checks and rendered evidence](../../../docs/issues/anderson-ux-verification.md).
