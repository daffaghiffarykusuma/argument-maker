# 03: Keep the outline accessible at every screen size

**What to build:** Inspect the argument alongside writing on desktop or in an on-demand panel on narrower screens.

**Blocked by:** None (can start immediately)

**Status:** done

Closed after combined integration verification: all 15 browser tests, 53 board tests, typecheck, production build, and whitespace checks passed. See [combined verification and review](../../../docs/issues/writing-workspace-ui-verification.md) for review outcomes and remaining validation limits.

- [x] Retain readable side-by-side live outline where space permits; offer labeled View outline otherwise.
- [x] Closing the panel restores editing position and sensible focus without discarding edits; outline remains live and read-only.
- [x] Test desktop, laptop and mobile transitions, long content, keyboard entry/exit and no unintended horizontal scrolling.

## Implementation and evidence

- Started on `t3/responsive-live-outline` in isolated worktree `t3-88867900`. `git merge-base --is-ancestor 4f0641dc3315bc2ee2def83f1353e6f87e6b5f66 HEAD` returned 0 before edits. Prior slices 01/02/04/06 were present.
- Approved seam: running app through the existing Chromium harness, unique `responsive-outline-03` runner/test and port 3023. Node runs Chromium on Windows; Bun remains the package/test runner. No new dependencies, injection seams, schema or Preview editing.
- Red 1: laptop test failed `Laptop authors can open the outline`, false vs true. Green: native read-only outline dialog using the existing compact projection and EditingPosition boundary. Editors remain mounted through opening/closing, preserving native undo.
- Red 2: Tab left document focus from the modal's only control. Green: Tab/Shift+Tab retain Close outline focus, Escape closes, Enter/Space open and Enter closes.
- Red 3: widening an open panel before using any editor failed sensible focus return. Green: desktop fallback focuses the Construct Argument heading; existing editors restore focus, selection and scroll. Narrowing leaves the panel closed until requested.
- `node tests/browser/responsive-outline-03-runner.ts` passed. Checks 1440, 1280, 1201, 1200, 1024, 390 and 320px widths, separate readable columns, long unbroken content, live changes, read-only content, textarea selection direction/internal scroll, page scroll, native undo and viewport transitions. Screenshots saved under ignored `output/playwright/responsive-outline-03/`; desktop, laptop panel and mobile panel visually inspected.
- `bun run typecheck`, `bun run build`, and `git diff --check` passed before integration merge. Build reports existing large Mermaid chunk warnings.
- Environment limit: an initial sandboxed browser attempt timed out during startup without a feature assertion and cleaned up its processes. The same Node runner with process permissions reached the red assertion, and subsequent runs passed. Broad suites intentionally left to the parent for sequential execution.

## Final integration verification

- Merged integration tip `bca7d2746e9b0896f774893926d0cce3e3572010` into this branch as `e13c5bd49cc089d471ee1429b00e2b4dfdeee9e9`, preserving slices 01/02/04/05/06/07. One conflict in `board-controls.ts` keyboard handling was resolved by keeping outline Tab containment alongside picker Escape and Board/Export menu handling. Integration ancestry check returned 0 after merge.
- Red 4 from screenshot inspection: rendered geometry showed sticky Structural checks covering the desktop outline heading while scrolled. Green: keep Structural checks in the editor column, so its sticky strip cannot cover the adjacent outline. The focused workflow now asserts this geometry at each wide viewport.
- Final `bun test tests/browser/responsive-outline-03.test.ts` with process permissions: 1 pass, 0 fail, 18.29 seconds. Includes seven viewport widths and the merged searched picker, attached-fact native undo, Context/Planning disclosure preservation, review06 focus return, export menu access, and fresh construction return after research. A draft assertion requiring the opener after stage navigation was corrected: stage navigation intentionally focuses Construct Argument, which is the appropriate location to restore before a field is used.
- Final `bun run typecheck`, `bun run build` and `git diff --check` passed. Build retains Mermaid chunk-size warnings. Final desktop 1440px, laptop 1024px editor and mobile 390px dialog screenshots were inspected after the overlap fix; 1280px desktop and 320px dialog captures were also inspected during verification.
- Scope limits: Chromium only, simulated viewports rather than physical devices or assistive-technology testing. Full domain/browser suites, import/export round trips and Local draft workflows are left for the parent's sequential integration validation. No PR, push, new dependency, root integration edit or schema change.
