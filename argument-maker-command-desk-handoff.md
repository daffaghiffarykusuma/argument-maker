# Argument Maker Command Desk Handoff

## Context

Workspace: `C:\Users\Lenovo\Documents\VS Code Projetcs\argument-maker`

The user prototyped five UI directions for Argument Maker, selected Prototype 1 "Command Desk", asked for a PRD, then asked for implementation issues. The next session will likely continue from these planning artifacts into implementation of the selected Command Desk UI refresh in the main app.

## Current State

- Selected visual reference: `prototype/1/index.html`
- Selected prototype stylesheet: `prototype/1/style.css`
- Prototype landing page now links only to the selected Command Desk direction: `prototype/index.html`
- Prototype server helper exists: `prototype/server.ts`
- Rejected prototype routes `/2`, `/3`, `/4`, and `/5` were deleted.
- Local PRD exists: `docs/prd/command-desk-ui-refresh.md`
- Local issue breakdown exists: `docs/issues/command-desk-ui-refresh-issues.md`

The PRD and issues were not published to an issue tracker because this session did not include tracker setup or triage label vocabulary.

## Important Product Decisions

- Keep the app dark-only.
- Keep the app local-first.
- Preserve the existing `.argument.json` schema.
- Do not introduce autosave or browser persistence.
- Preserve the existing Argument Board model:
  - SCQA frame
  - one Answer
  - Supporting Arguments
  - Supporting Data or Facts
  - Data Type
  - Evidence Link
  - Export File
  - rendered Argument Preview
- Evidence Links attach to individual Supporting Data or Facts rows, not to Supporting Arguments.
- The default board should show 3 Supporting Arguments and 3 Supporting Data or Facts under each Supporting Argument.
- The refreshed main app should use the selected Command Desk visual direction but reuse existing production behavior rather than copying static prototype markup directly.

## Codebase Notes

- Current domain model already supports the desired default 3 x 3 structure in `src/argument-board.ts`.
- Production rendering is in `src/argument-board-browser.ts`.
- Existing production styling is in `src/styles.css`.
- Current rendered preview uses Mermaid and should remain a rendered visual workflow with source secondary/collapsible.
- Existing tests cover board commands, session behavior, view model, file persistence, output, review, and browser smoke.

## Suggested Skills

- `tdd`: Use if implementing the issue slices test-first or updating browser smoke coverage before changing production UI.
- `browser:control-in-app-browser`: Use after UI changes to verify the local app visually at desktop and mobile widths.
- `vercel:react-best-practices`: Not directly applicable unless the app is converted into React; current app is TypeScript DOM rendering.
- `to-issues`: Use only if the user wants the issue breakdown revised or published elsewhere.
- `github:yeet`: Use only if the user asks to publish a branch/PR.

## Recommended Next Steps

1. Read `docs/prd/command-desk-ui-refresh.md`.
2. Read `docs/issues/command-desk-ui-refresh-issues.md`.
3. Start with Issue 1: Command Desk Shell And SCQA Frame.
4. Preserve behavior first; treat visual refresh as a renderer/style refactor unless a small view-model seam is clearly useful.
5. Run `bun run typecheck`, `bun test`, and `bun run build`.
6. Use browser verification for desktop and mobile after meaningful UI changes.

## Last Known Verification

Before this handoff:

- `bun run typecheck` passed.
- `bun test` passed with 19 passing tests.
- `bun run build` passed.
- Prototype route `/` and `/1/` returned 200.
- Deleted prototype routes `/2/` through `/5/` returned 404.

## Dirty Worktree

Current untracked paths are expected from this planning/prototype work:

- `docs/`
- `prototype/`

No sensitive information was found or included in this handoff.
