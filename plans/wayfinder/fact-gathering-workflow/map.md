---
title: Gather facts before constructing an argument
label: wayfinder:map
tracker: local-markdown
status: closed
specification: spec.md
---

## Destination

Reach a decision-complete, implementation-ready product and technical plan for a gather-first workflow: users collect facts with their source links before shaping an argument, then deliberately choose gathered facts for the relevant parts of the Argument Board.

## Notes

- Planning only. Implementation starts after the map has no unresolved decisions.
- Preserve the established local-first boundary: no accounts, cloud sync, telemetry, or browser autosave unless a ticket explicitly redraws that product decision.
- Keep the structured, canvas-like Argument Board and its plain-language labels; fact gathering should become an earlier workflow stage, not a free-form research database.
- Reuse the current evidence concepts where they still fit: fact text, optional Data Type, Evidence Link, URL-format validation, readiness review, outline export, and `.argument.json` files.
- A saved link supports traceability but is not treated as verified proof.
- Use `CONTEXT.md` as the domain glossary and `src/argument-board.ts`, `src/argument-board-browser.ts`, `src/argument-board-session.ts`, `src/export-file-contract.ts`, `src/review.ts`, and `src/output.ts` as the current ownership seams.
- Use Bun for repository checks.
- The repo has no configured tracker-specific Wayfinding operations guide, so child issues are local Markdown files in `tickets/`. Frontmatter records labels, claims, and blocking edges.

## Decisions so far

<!-- Closed ticket decisions are appended here as one-line linked gists. -->

- [Define the Fact Library contract](tickets/define-the-fact-library-contract.md) — use a board-scoped Gathered Facts collection with fact text, link, and optional type; complete facts can support Situation, Complication, or Supporting Arguments without hard-locking construction.
- [Decide how gathered facts attach to the argument](tickets/decide-how-facts-attach-to-the-argument.md) — attach ordered live references that can be reused and edited anywhere, show every usage, preserve facts on detach, and confirm cascading deletion.
- [Prototype the gather-first workspace flow](tickets/prototype-the-gather-first-workspace-flow.md) — use full-width Gather Facts, Construct Argument, and Preview stages with direct navigation and Gather Facts as the default.
- [Define saved-file compatibility for gathered facts](tickets/define-saved-file-compatibility-for-gathered-facts.md) — use normalized version-2 files with canonical facts and ordered references, strict atomic validation, safe unknown-field preservation, and no version-1 migration.
- [Define review and output rules for gathered facts](tickets/define-review-and-output-rules-for-gathered-facts.md) — keep unused research out of readiness and outputs, require attached facts to be complete, and render ordered evidence transparently with explicit incomplete-state markers.
- [Define implementation acceptance and recovery](tickets/define-implementation-acceptance-and-recovery.md) — accept the workflow through atomic history and import recovery, strict version-2 round-trips, accessible focus and ordering, focused Bun gates, and a separately reported Chromium workflow.

## Not yet specified

None. The route to implementation is decision-complete.

## Out of scope

- Fetching, scraping, summarizing, or extracting facts from linked web pages.
- Automatically judging whether a fact is true or whether a source is trustworthy.
- AI-generated arguments, prose drafting, or automatic placement of facts.
- Accounts, cloud synchronization, real-time collaboration, analytics, identity, or telemetry.
- Integration with external reference managers or knowledge-base services.
- Global, cross-board, or separately importable fact collections.
- Source metadata beyond fact text, Evidence Link, and optional Data Type.
- Import or migration of schema-version-1 board files; no users or downloaded version-1 files exist.
- Fact organization aids such as sections, tags, search, filtering, bulk actions, or duplicate detection; reconsider only after real usage demonstrates the need.
