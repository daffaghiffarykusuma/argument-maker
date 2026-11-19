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

## Large boards and the first Review (2026-11-20)

Measured on the production build (`vite build` + `vite preview`) in headless
Chromium at 1280 x 800. Boards were opened through Upload with every fact
complete and attached, split evenly across Situation, Complication and the
Supporting Arguments. Before and after builds ran alternately on the same
machine, two rounds each; ranges are the two round medians. Typing times are
the synchronous input handler plus a forced layout; stage switches are the
click handler plus a forced layout. Painting is excluded.

| Board, interaction | Before | After |
| --- | ---: | ---: |
| 30 facts, typing in Answer | 4–5 ms | 2 ms |
| 30 facts, switch to Construct Argument | 34–52 ms | 15 ms |
| 100 facts, typing in Answer | 15–21 ms | 3 ms |
| 100 facts, switch to Construct Argument | 130–231 ms | 29–31 ms |
| 100 facts, switch to Gather Facts | 85 ms | 45–47 ms |
| 300 facts, typing in Answer | 59–64 ms | 10–12 ms |
| 300 facts, typing in a fact | 36–40 ms | 9–14 ms |
| 300 facts, switch to Construct Argument | 522–620 ms | 87–99 ms |
| 300 facts, switch to Gather Facts | 206–326 ms | 132–153 ms |

First visit to Review with the worked example, in-page timing from the click
to the diagram SVG, five runs each, after three seconds in Construct Argument:

| Conditions | Before | After |
| --- | ---: | ---: |
| Unthrottled | 769–1186 ms | 35–72 ms |
| 4x CPU, 150 ms latency, 1.6 Mbps | 6.9–7.6 s | 0.27–1.04 s |
| Requests / gzip on first Review, 200 ms after opening the example | 27 / 646 KB | 9 / 51 KB |

The pointer in that run rested over a Review control, so the diagram was
prepared before the click. Reaching Review with no hover or focus first, such
as by Alt+4, still waits for one Mermaid render: about 250–300 ms unthrottled.
Initial load did not change: 158 KB gzip and the same first contentful paint.

### Changes

- Mermaid 12 lays out flowcharts with ELK by default, which alone is 466 KB
  gzip. The preview sets `layout: "dagre"` with rounded edges and 40 px rank
  spacing, which renders this tree at the same size and shape.
- Once the author has started, an idle callback imports Mermaid and renders
  one hidden node, which also fetches the layout engine. Pointing at or
  focusing a Review control starts rendering the current diagram into the
  preview's one-entry cache, which the visit then reuses.
- Each board gets one lazily built index of facts by id, complete facts,
  argument positions and fact usage labels. `factUsageLabels`,
  `readFactAttachments` and `destinationLabel` no longer scan the board on
  every call. Evidence Link validity is cached per string.
- Closed attachment pickers stay empty and fill when opened. Closed fact
  editors render only their summary and receive their fields when first
  opened, by summary click before the browser opens them or by the `toggle`
  event. The fields then stay, so native undo survives collapse and reopen.
  Navigation to a field inside a closed editor reveals it first.
- Per-keystroke DOM work avoids attribute-value searches across the page,
  skips Construct-only regions on other stages, leaves unchanged regions
  untouched, and checks open menus only on Escape. The editing-position
  tracker measures scroll on the next animation frame, and settles at once
  when focus moves or a held place is needed.

### Not changed

- `content-visibility: auto` on fact and argument cards gave a mixed,
  noise-level result and empties `innerText` of off-screen cards, so it was
  removed.
- Dropping `text-rendering: optimizeLegibility` saved 5–15% of a stage switch,
  but only by skipping kerning on Caslon text.
- Mermaid deep-copies its configuration for every shape it draws, which sets
  the floor for a fresh render.

### Reproduce

Generate a board of the shape above, upload it into a fresh tab on
`bunx vite preview` after `bun run build`, and time
`element.click()` or an `input` event dispatch followed by
`document.body.offsetHeight`. Open the first fact editor before timing typing
in a fact. For the first Review, observe `.mermaid-diagram svg` with a
`MutationObserver`.

## Next candidate

Very large libraries still lay out every fact card. If 300-fact boards become
common, measure windowing the Gather Facts library before anything else.
