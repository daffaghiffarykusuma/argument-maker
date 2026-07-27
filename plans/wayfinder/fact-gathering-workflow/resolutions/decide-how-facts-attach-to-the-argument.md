# Resolution: Decide how gathered facts attach to the argument

## Decision

Selecting a Gathered Fact creates a live reference to its canonical board-scoped record. It does not copy or move the fact. Situation, Complication, and each Supporting Argument store ordered references to Gathered Fact IDs.

## Reuse and ordering

- One Gathered Fact may support multiple destinations across Situation, Complication, and Supporting Arguments.
- The same fact appears at most once within one destination.
- Each destination has its own manually controlled fact order.
- Reordering facts in one destination does not change Gathered Facts order or any other destination.
- Selection and placement are always manual; there is no automatic relevance ranking or placement.

## Usage indicators

Each Gathered Fact shows either **Unused** or **Used in N places**, plus destination badges such as **Situation**, **Complication**, and **Supporting Argument 2**. Each attached placement displays the fact and provides actions to edit it, open it in Gathered Facts, or remove it from that destination.

## Editing

A Gathered Fact can be edited from its canonical collection or from any attached placement:

- **Edit fact** enables inline editing of fact text, Evidence Link, and Data Type.
- When a fact has attachments, the editor states **Used in N places—changes update all uses**.
- Saving updates the one canonical fact, so every placement reflects the change immediately.
- **Open in Gathered Facts** moves to the canonical item when the user needs collection context.

This supersedes the earlier discussion of making attached facts read-only.

## Creating and attaching

Every evidence-capable destination offers:

- **Choose Gathered Facts** to attach one or more complete existing facts; and
- **Create new fact here** to create a canonical Gathered Fact and attach it to the current destination.

The gather-first workflow remains the default, but users do not need to leave argument construction when they discover missing evidence.

## Detaching and deleting

- **Remove from here** detaches a fact only from the current destination and preserves the canonical Gathered Fact.
- Deleting an unused Gathered Fact happens immediately.
- Deleting a used fact requires confirmation that lists every affected destination.
- Confirming deletes the canonical fact and removes all its attachments.
