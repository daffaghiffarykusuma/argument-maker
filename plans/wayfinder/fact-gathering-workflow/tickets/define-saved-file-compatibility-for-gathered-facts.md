---
title: Define saved-file compatibility for gathered facts
label: wayfinder:grilling
parent: ../map.md
status: closed
assignee: codex
blocked_by:
  - "[Define the Fact Library contract](define-the-fact-library-contract.md)"
  - "[Decide how gathered facts attach to the argument](decide-how-facts-attach-to-the-argument.md)"
closed_at: 2026-07-27
resolution_comment: ../resolutions/define-saved-file-compatibility-for-gathered-facts.md
---

## Question

How should canonical gathered facts and each destination's ordered fact-ID references be represented in local export files while preserving readable `.argument.json` data and safe import of existing schema-version-1 boards?

## Resolution requirements

- Decide the smallest normalized file shape for canonical facts and ordered destination references without duplicating fact content.
- Decide whether the change requires a schema-version increment, a compatible optional field, or an explicit migration path.
- Define how existing files with facts nested under Supporting Arguments are imported into the gather-first model.
- Define invalid-reference, duplicate-ID, missing-field, and unsupported-version behavior.
- Preserve unknown fields only where doing so remains safe and inspectable under the current Export File Contract.
- Keep import replacement and clear-board protections explicit; do not introduce autosave or hidden persistence.
