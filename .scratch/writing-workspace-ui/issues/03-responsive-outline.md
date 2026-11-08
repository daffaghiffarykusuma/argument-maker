# 03: Keep the outline accessible at every screen size

**What to build:** Inspect the argument alongside writing on desktop or in an on-demand panel on narrower screens.

**Blocked by:** None (can start immediately)

**Status:** implemented, integration verification pending

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
