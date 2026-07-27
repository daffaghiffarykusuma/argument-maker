---
title: Define review and output rules for gathered facts
label: wayfinder:grilling
parent: ../map.md
status: closed
assignee: codex
blocked_by:
  - "[Define the Fact Library contract](define-the-fact-library-contract.md)"
  - "[Decide how gathered facts attach to the argument](decide-how-facts-attach-to-the-argument.md)"
closed_at: 2026-07-27
resolution_comment: ../resolutions/define-review-and-output-rules-for-gathered-facts.md
---

## Question

Which gathered-fact states should affect readiness, Preview, and Copy Outline, especially for incomplete, unused, multiply used, or invalid-link facts?

## Resolution requirements

- Separate library hygiene from argument readiness so unused research does not automatically make an otherwise complete argument fail.
- Decide which incomplete states are warnings versus blockers at fact-gathering and argument-construction stages.
- Decide how selected facts appear in Argument Preview, Mermaid source, Copy Outline, and evidence-link labels.
- Decide how a reused fact is rendered in multiple destinations without losing each destination's chosen order.
- Decide whether unused facts are included in exported outline text or only retained in the `.argument.json` working file.
- Preserve the existing `http://` and `https://` URL-format check without presenting it as source verification.
- Define concise, plain-language messages and stable review targets for accessible navigation.
