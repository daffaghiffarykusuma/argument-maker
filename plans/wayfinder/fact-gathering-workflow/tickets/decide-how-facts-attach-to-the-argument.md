---
title: Decide how gathered facts attach to the argument
label: wayfinder:grilling
parent: ../map.md
status: closed
assignee: codex
blocked_by:
  - "[Define the Fact Library contract](define-the-fact-library-contract.md)"
closed_at: 2026-07-27
resolution_comment: ../resolutions/decide-how-facts-attach-to-the-argument.md
---

## Question

When a user chooses a gathered fact for Situation, Complication, or a Supporting Argument, is it referenced, copied, or moved, can it support more than one destination, and what happens after the source fact is edited or deleted?

## Resolution requirements

- Decide whether selection creates a live reference or an independent copy; avoid a hybrid unless a demonstrated need requires it.
- Decide whether one fact can support multiple destinations across Situation, Complication, and Supporting Arguments.
- Decide how already-selected facts are indicated in the library and in each argument branch.
- Decide edit, detach, and delete behavior, including protection against accidental data loss.
- Decide whether users can still create support rows directly inside an argument or must select them from the gathered list.
- Keep manual selection explicit; do not add automatic relevance ranking or placement.
