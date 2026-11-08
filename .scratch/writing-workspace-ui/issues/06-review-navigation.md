# 06: Make Reasoning review a clear, reversible destination

**What to build:** Review reasoning in an explicitly identified view and return to the exact writing context.

**Blocked by:** None (can start immediately)

**Status:** implemented

- [x] Give Reasoning review a clear title and Back to editing action; preserve originating tab, scroll/editing position and focus.
- [x] Keep structural checks separately labeled and preserve optional prompts, planning privacy and no quality-certification claims.
- [x] Preserve existing writing invitation, pending-format continuation and draft labels; test return from all applicable stages and keyboard behavior.

## Acceptance evidence

- Approved seam: real Chromium through the existing browser workflow harness, Node on Windows. Ticket-specific runners use port 3026. No board schema, construction markup, header, or production test interface changes.
- Red/green cycle 1: Back failed to restore the Answer editor's focus. After the UI return-position change, focus, text selection, textarea scroll, page scroll, and content all passed.
- Red/green cycle 2: Back followed by reopening review lost Continue to export, with zero matching buttons rather than one. Keeping the pending format passed, including the actual Text download and omission of private Audience text and Draft labeling after review.
- Red/green cycle 3: mobile Gather Facts returned to Y=53 instead of Y=233 after wheel scrolling. Recording wheel/touch movement passed. The focused workflow also covers selection and focus return in Gather Facts and keyboard return to Readable outline in Preview.
- Existing reasoning-review and writing-review workflows pass with their coverage retained. Focus assertions now target the originating Intended outcome editor or Gather Facts heading. Existing checks cover review-note edits, undo/redo, local draft restoration, optional prompts, structural-check wording, every writing format, Draft labels, planning privacy, invitation reset/cancel rules, and editable board preservation.
- Passed: focused Chromium workflow, existing review/export workflows, 53 board unit tests, typecheck, production build, and whitespace check. The production build reports large Mermaid chunks.
- Inspected desktop 1440px and mobile 390px review screenshots, including long Answer text, title/Back action, separately labeled structural checks, and optional reflection fields. Artifacts are ignored under `output/playwright/review-navigation-06/`.

## Reproduction and limits

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH="$PWD/.browser-check/chromium"
bun test tests/browser/review-navigation-06.test.ts
bun run test:unit
bun run typecheck
bun run build
git diff --check
```

The worktree needed a local Chromium installation: `bunx playwright install chromium` with the same environment variable. Missing Chromium and a launch attempted during extraction were setup failures, not behavioral red evidence. A combined reasoning/export regression runner passed directly but later exceeded the harness's 100-second timeout. The two existing workflows now run separately, retaining the existing timeout and every assertion. The entire repository browser suite and assistive-technology testing were not run; these checks do not establish accessibility compliance. Header/export-menu and construction-disclosure changes belong to other tickets.
