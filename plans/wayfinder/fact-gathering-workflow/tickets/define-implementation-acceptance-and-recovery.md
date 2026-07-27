---
title: Define implementation acceptance and recovery
label: wayfinder:grilling
parent: ../map.md
status: closed
assignee: codex
closed_at: 2026-07-27
resolution_comment: ../resolutions/define-implementation-acceptance-and-recovery.md
blocked_by:
  - "[Prototype the gather-first workspace flow](prototype-the-gather-first-workspace-flow.md)"
  - "[Define saved-file compatibility for gathered facts](define-saved-file-compatibility-for-gathered-facts.md)"
  - "[Define review and output rules for gathered facts](define-review-and-output-rules-for-gathered-facts.md)"
---

## Question

Which functional, accessibility, compatibility, data-loss, and verification checks are sufficient to hand the gather-first plan to implementation with no remaining product or technical decisions?

## Resolution requirements

- Define acceptance examples for gathering, editing, ordering, selecting, reusing, detaching, and deleting facts.
- Cover empty and incomplete facts, invalid links, one fact used in multiple places, undo/redo, Clear Board, import replacement, and failed import.
- Prove unused incomplete facts do not block readiness, while attached incomplete facts do, and reused fact issues appear once with every destination named.
- Prove Preview, Mermaid, and Copy Outline preserve destination order, repeat reused facts under each destination, omit unused facts, and expose incomplete-state markers without clickable invalid links.
- Require version-2 round-trip examples plus deliberate rejection of version-1 and otherwise unsupported `.argument.json` files.
- Identify the smallest focused Bun test set plus typecheck, build, and the real-browser workflow checks required for handoff.
- Include keyboard, focus order, labels, narrow-screen layout, and Preview behavior.
- Distinguish structural verification from real-browser verification and keep known browser-smoke instability explicit.
