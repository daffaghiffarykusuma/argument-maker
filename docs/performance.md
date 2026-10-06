# Editing and preview performance

Measured locally on 2026-10-06 in the T3 Chromium preview at 1280 x 800,
using the Vite development server with draft saving disabled.

## Result

For a synthetic board with 100 complete, unattached facts, three runs measured
the following synchronous fact-text input handler times:

| Run | Before median | After median | Before p95 | After p95 |
| --- | ---: | ---: | ---: | ---: |
| 1 | 46.4 ms | 1.6 ms | 57.1 ms | 3.2 ms |
| 2 | 45.6 ms | 2.1 ms | 49.7 ms | 3.2 ms |
| 3 | 50.5 ms | 1.2 ms | 85.5 ms | 2.2 ms |

Each run dispatched 25 input events and discarded the first five. All 100 cards
and the focused editor remained present. An additional 300-fact run after the
change measured a 3.0 ms median and 3.3 ms p95.

These measurements exclude painting, input-device delay, network loading, and
autosave. They are not INP or production field measurements. Absolute timings
vary with machine load and warm-up; an earlier baseline run reached 111.9 ms
at the median. The repeated comparison above is the more conservative result.

## Changes

- Refresh completeness and shared editors only for the fact being edited.
  Structural actions still render the board.
- Use sets when reconciling filtered cards instead of nested array searches.
- Compute readiness once per board identity, then reuse it for subsequent
  session snapshots. Editing, undo, redo, clear, and import invalidate it.
- Stop generating the live construction outline twice per input event.

The active editor stays intact, and filtering still updates immediately.

## Reproduce

Use a disposable browser tab on `bun run dev`. Run this in its console on each
revision. Use a fresh tab after changing revisions so cached modules and
unsaved-draft navigation prompts cannot leave the old code running.

```js
const { createDefaultBoard } = await import('/src/board/argument-board.ts');
const { createArgumentBoardSession } = await import('/src/board/argument-board-session.ts');
const { mountArgumentBoardApp } = await import('/src/ui/argument-board-browser.ts');

function benchmark(count = 100) {
  const board = createDefaultBoard();
  board.gatheredFacts = Array.from({ length: count }, (_, i) => ({
    id: 'fact-' + (i + 1), text: 'Evidence item ' + i,
    evidenceLink: 'https://example.com/' + i, dataType: 'fact', touched: true,
  }));
  const root = document.createElement('div');
  root.id = 'app';
  document.querySelector('#app').replaceWith(root);
  mountArgumentBoardApp(root, createArgumentBoardSession(board));
  const input = root.querySelector('[data-action="fact-text"]');
  input.focus();
  const times = [];
  for (let i = 0; i < 25; i++) {
    input.value = 'Edited evidence ' + i;
    const start = performance.now();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    times.push(performance.now() - start);
  }
  times.splice(0, 5);
  times.sort((a, b) => a - b);
  return {
    medianMs: times[10], p95Ms: times[18],
    cards: root.querySelectorAll('.fact-card').length,
    editorPreserved: document.activeElement === input,
  };
}
[benchmark(), benchmark(), benchmark()];
```

## Gathered Fact editing refactor check

The same input benchmark was repeated on 2026-10-06 before and after moving fact
editing into `src/ui/gathered-fact-editing.ts`, with Local draft recovery changes
already present in both versions. Draft saving was disabled.

| Board size | Before median | After median | Before p95 | After p95 |
| --- | ---: | ---: | ---: | ---: |
| 100 facts, three runs each | 0.8–1.1 ms | 0.6–0.9 ms | 1.1–2.3 ms | 1.0–1.4 ms |
| 300 facts, one before and four after runs | 3.1 ms | 3.0–4.2 ms | 3.5 ms | 5.2–6.1 ms |

Every run retained all cards and the active editor. The 300-fact timing samples
are uneven and their tail latency varied; these local checks do not establish a
speedup. They still exclude painting, input-device delay and autosave.

The Chromium workflow also checks native undo, shared text and Evidence Link
edits, immediate Fact Attachment completeness styling, and Source details
filtering without losing Tab focus or disclosure state. Attachment-picker
options retain their existing full-render refresh timing.

## Preview cache

Each app instance retains one diagram promise keyed by its exact Mermaid source.
Returning to Preview or switching from Readable outline to Diagram reuses that
promise, including while rendering is still pending. Different source replaces
the entry; failed renders remove it so another visit can retry. A late result
cannot replace the current diagram or its cache entry. SVG sizing still runs
when the cached diagram is inserted, preserving fit and zoom behavior.

With the worked example on the same local development server, six consecutive
Construct Argument to Preview switches measured:

| Switch | Before | Cached |
| --- | ---: | ---: |
| 1 | 115.6 ms | 5.0 ms |
| 2 | 94.6 ms | 4.7 ms |
| 3 | 116.0 ms | 4.5 ms |
| 4 | 312.2 ms | 5.3 ms |
| 5 | 224.7 ms | 4.9 ms |
| 6 | 216.1 ms | 5.0 ms |

Timing starts immediately before clicking Preview and ends when a
MutationObserver sees `.mermaid-diagram svg`. The first visit is excluded.
These local measurements include DOM insertion and sizing, but not presentation
of the next painted frame. No first-load or production network improvement is
claimed. To repeat, load the worked example in a fresh tab for each revision,
visit Preview once, then time six Construct Argument to Preview switches.

The Chromium workflow checks SVG reuse across stage and mode switches, fresh
content after editing and undo, and navigation during a pending render.
`src/ui/argument-preview.ts` now owns this lifecycle. Each app tracks its own
current render, while Mermaid render IDs remain unique across app instances.
The shared Mermaid loader still imports and initializes only on demand.

`tests/browser/preview-lifecycle.ts` runs in Chromium with a controlled renderer
through the module's public interface. It checks pending-source reuse, stale
successes and failures, retry on a later visit, navigation away during rendering,
one-source eviction, zoom persistence and limits, resize fitting, independent
app instances, and disposal during pending work. The cache timings above predate
this ownership refactor; no additional speed improvement is claimed.

## Next candidate

Mermaid is already dynamically imported. The production build emits large
optional diagram chunks, but total build output is not initial network payload.
Measure the actual first-preview requests before changing the Mermaid bundle.
