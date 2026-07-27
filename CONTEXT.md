# Context Glossary

## Argument Board

A temporary visual workspace where a user constructs an argument. The board starts empty each session by default, and users can export a board file to local storage or import a previous board file to continue work.

## Argument

A structured line of reasoning that connects a communication goal to a clear recommendation, claim, review, post, script, or other output.

## Answer

The single main response to the board's Question. An Argument Board has exactly one Answer.

## SCQA

The argument framing pattern: Situation, Complication, Question, Answer. In this product, SCQA defines the top-level narrative frame for the argument.

## Plain-Language Label

A user-facing prompt that explains what to write without requiring knowledge of SCQA or Minto Pyramid Principles. Formal framework terms can appear as secondary labels or tooltips.

## Minto Pyramid

The argument hierarchy pattern where a main answer is supported by grouped reasoning and data. In this product, Minto Pyramid defines the supporting structure beneath the SCQA Answer.

## Supporting Argument

A reasoning point under the SCQA Answer. A Supporting Argument explains why the Answer holds and does not require an evidence link.

## Support Mode

The status of a Supporting Argument. Reasoning or Interpretation mode can stand alone without evidence. Evidence-backed mode expects at least one complete Gathered Fact.

## Data Type

An optional classification for a Gathered Fact: Fact, Observation, Example, or Estimate.

## Gathered Fact

A canonical, board-scoped research item containing fact text, an Evidence Link, and an optional Data Type. A Gathered Fact requires non-empty text and a valid HTTP or HTTPS Evidence Link to be complete, but may remain an incomplete draft in Gather Facts.

## Fact Attachment

An ordered live reference from Situation, Complication, or a Supporting Argument to a canonical Gathered Fact. One fact may be reused in several destinations, and edits to the canonical fact update every placement.

## Gather Facts

The default first workflow stage where users collect, revise, order, and review the usage of Gathered Facts before constructing the argument.

## Evidence Link

A URL stored on a Gathered Fact. The app checks HTTP or HTTPS format for traceability but does not verify source quality or factual accuracy.

## Export File

A local file downloaded by the user that contains the board state needed to reopen, revise, or continue an argument in a later session.

## Export File Contract

The schema metadata, filename policy, validation result shape, and compatibility boundary for `.argument.json` files. Version 2 stores canonical Gathered Facts once and destinations as ordered fact references. Valid unknown future fields are preserved.

## Argument Preview

A read-only visualization of the current argument structure. The preview helps users inspect flow and hierarchy but is not the primary editing surface.

## Argument Preview Projection

The render-ready structure derived from an Argument Board for Argument Preview, Mermaid source, outline export, and readiness labels. It owns active branch selection and evidence-link labeling so those rules stay consistent across outputs.
