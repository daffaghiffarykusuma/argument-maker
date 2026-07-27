# Resolution: Prototype the gather-first workspace flow

## Decision

The user selected **A — Staged workflow**.

Argument Maker will present three directly reachable, full-width workflow stages:

1. **Gather Facts**
2. **Construct Argument**
3. **Preview**

Gather Facts is the default first stage, but the tabs never hard-lock movement. Users may construct a reasoning-only argument or return to revise facts at any time. **Open in Gathered Facts** moves directly to the canonical fact in the first stage.

## Why this direction holds

- The numbered stages make the gather-first sequence explicit without turning it into a mandatory wizard.
- One full-width stage at a time preserves the existing dense command-desk layout and avoids compressing both the fact collection and Argument Board into competing columns.
- Gathered, selectable, and used-fact counts preserve orientation between stages.
- The selected prototype exercised empty and incomplete states, choose-existing and create-here paths, usage badges, ordered attachments, edit-anywhere updates, return-to-fact navigation, deletion impact confirmation, read-only Preview, keyboard focus, and narrow-screen stacking.

## Prototype asset

[Selected staged-workflow prototype](../prototypes/gather-first-workspace-prototype.html)

The artifact is throwaway reference code with fictional sample content and in-memory state. Production implementation must rewrite the selected behavior against the real model rather than promote the prototype directly.
