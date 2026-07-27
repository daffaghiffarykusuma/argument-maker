# Resolution: Define review and output rules for gathered facts

## Decision

Gathered Facts have two separate review contexts:

- **Library hygiene** helps users finish research drafts in Gather Facts.
- **Argument readiness** evaluates only facts attached to the constructed argument.

Unused research never makes an otherwise complete argument unready.

## Completeness and readiness

A Gathered Fact is complete when it has non-empty fact text and a valid `http://` or `https://` Evidence Link. Data Type remains optional.

- Unused incomplete or invalid-link facts show **Incomplete** only in Gather Facts.
- An attached fact with blank text, a missing link, or an invalid link blocks argument readiness.
- Situation and Complication do not require attached facts, but every attached fact must be complete.
- An evidence-backed Supporting Argument requires at least one complete attached fact.
- A reasoning-mode Supporting Argument may have no facts.

## Review issues and navigation

Each incomplete canonical fact produces one readiness issue even when several destinations use it. The message includes every current destination, for example:

> Complete this fact; it is used in Situation and Supporting Argument 2.

Opening the issue moves to Gather Facts, focuses the canonical item, and shows the relevant field guidance:

- **Add fact text.**
- **Add an evidence link.**
- **Use a valid http:// or https:// evidence link.**

An evidence-backed Supporting Argument with no complete facts produces:

> Attach at least one complete fact to this evidence-backed reason.

That issue targets the Supporting Argument. Review targets remain stable fact or argument IDs so keyboard and assistive-technology users can reach the owning editor. Data Type never produces an issue.

## Preview and Mermaid

Only attached facts appear in Argument Preview and Mermaid. Unused Gathered Facts remain in the `.argument.json` working file.

- Each fact appears as an ordered child of Situation, Complication, or its Supporting Argument.
- The Mermaid node label contains optional Data Type plus fact text.
- A reused fact is rendered beneath every destination using it, following each destination's independent order.
- Raw URLs do not appear inside Mermaid nodes.
- A structured evidence list below the diagram groups facts by destination and provides clickable links.
- Visible link text is **Open evidence source**; its accessible name includes the associated fact text.

## Copy Outline

Copy Outline groups attached facts beneath Situation, Complication, and each Supporting Argument in destination order. Each entry contains:

1. fact text;
2. optional Data Type; and
3. `Evidence Link: <URL>`.

A reused fact is repeated in every relevant section so each section remains self-contained. Unused facts are omitted.

## Incomplete output

Preview, Mermaid, and Copy Outline remain available before readiness is complete. Attached incomplete facts remain visible with explicit markers:

- `[Needs fact text]`
- `[Needs evidence link]`
- `[Invalid evidence link]`

Missing or invalid URLs are not clickable. Copy Outline ends with an **Incomplete Evidence** summary when any attached fact is incomplete.

## Verification boundary

Gather Facts and the Preview evidence list display:

> Link format checked; source quality and factual accuracy are not verified.

A syntactically valid URL is traceability, not proof.
