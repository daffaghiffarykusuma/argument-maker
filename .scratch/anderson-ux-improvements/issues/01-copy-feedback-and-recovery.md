# 01: Make copy actions report success and recover from failure

**What to build:** Copying an outline or Mermaid source gives the author reliable, accessible feedback. If clipboard access fails, the board stays intact and the author has a usable way to retry or obtain the output.

**Blocked by:** None (can start immediately).

**Status:** complete (local; no external tracker configured)

- [x] Copy Outline and Copy Mermaid announce success only after the clipboard write succeeds.
- [x] A denied, unavailable, or rejected clipboard operation shows a clear failure message rather than a success message or silent failure.
- [x] The failure state offers a retry or an existing alternative appropriate to that output; it does not discard or modify board content.
- [x] Feedback is accessible to assistive technology and does not unexpectedly move keyboard focus away from the action.
- [x] Repeated attempts update feedback accurately without leaving a stale success indication after a failure.
- [x] Verify successful and failed clipboard operations through the existing browser workflow, asserting visible/accessible outcomes and preserved content rather than private helper calls.
- [x] Inspect affected controls and feedback at desktop and mobile widths. Run relevant existing checks and report browser results separately from non-browser results.

Verification: [implementation checks and rendered evidence](../../../docs/issues/anderson-ux-verification.md).
