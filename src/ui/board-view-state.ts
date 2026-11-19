import type { ArgumentPreview } from "./argument-preview";
import type { LocalDraft } from "../board/local-draft";
import type { EditingPositionTracker } from "./editing-position";
import type { GatheredFactEditing } from "./gathered-fact-editing";
import type { WritingReviewGate } from "./writing-review-gate";
import type { ArgumentBoard } from "../board/argument-board";

/** Transient status in the notice region. An undo offer expires once the board changes. */
export interface Notice {
  message: string;
  request: symbol;
  tone?: "error";
  undo?: { board: ArgumentBoard; focusId: string; label: string };
}

export interface ViewState {
  draft: LocalDraft;
  facts: GatheredFactEditing;
  preview: ArgumentPreview;
  positions: EditingPositionTracker;
  writing: WritingReviewGate;
  disclosures: Map<string, boolean>;
  notice?: Notice;
}
export const views = new WeakMap<HTMLDivElement, ViewState>();
