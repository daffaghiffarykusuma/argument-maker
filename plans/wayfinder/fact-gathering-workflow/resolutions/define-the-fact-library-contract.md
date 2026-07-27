# Resolution: Define the Fact Library contract

## Decision

Argument Maker will introduce **Gather Facts** as the default first workflow stage and **Gathered Facts** as the board-scoped collection. Argument construction is never hard-locked: users may continue with no completed facts when drafting or building a reasoning-only argument.

Gathered Facts are part of the Argument Board. The same `.argument.json` download contains the facts, and uploading that board restores them with the rest of its state. There is no global or cross-board fact library in this effort.

## Gathered Fact shape

Each Gathered Fact has only:

- fact text;
- Evidence Link;
- optional Data Type: Fact, Observation, Example, or Estimate.

Incomplete drafts are allowed during gathering. A fact becomes selectable only when it has non-empty text and a valid `http://` or `https://` Evidence Link. Data Type remains optional. The URL check supports traceability and does not verify that the claim or source is true.

## Collection behavior

- The collection starts empty.
- Users can add, edit, delete, and manually reorder facts.
- There is no generic duplicate action.
- **Another fact from this source** creates a new fact with the same Evidence Link, blank fact text, and blank Data Type. This supports several facts from one article without introducing a separate Source entity or repeated link entry.
- Tags, sections, search, filters, bulk actions, duplicate detection, and extra source metadata are not part of this contract.

## Evidence destinations

- Situation keeps one short storytelling statement and may have multiple selected Gathered Facts.
- Complication keeps one short storytelling statement and may have multiple selected Gathered Facts.
- Each Supporting Argument may have multiple selected Gathered Facts.
- Question and Answer remain short statements without fact rows.
- The current single Evidence Link fields on Situation and Complication are replaced by Gathered Fact selection so the product has one evidence system.

Whether selection creates references, copies, or moves—and how edits, reuse, detachments, and deletions propagate—remains owned by [Decide how gathered facts attach to the argument](../tickets/decide-how-facts-attach-to-the-argument.md).
