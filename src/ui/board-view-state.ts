import type { ArgumentPreview } from "./argument-preview";
import type { LocalDraft } from "../board/local-draft";
import type { EditingPositionTracker } from "./editing-position";
import type { GatheredFactEditing } from "./gathered-fact-editing";
import type { WritingReviewGate } from "./writing-review-gate";

export interface ViewState {
  draft: LocalDraft;
  facts: GatheredFactEditing;
  preview: ArgumentPreview;
  positions: EditingPositionTracker;
  writing: WritingReviewGate;
  disclosures: Map<string, boolean>;
  copyFeedback?: { message: string; request: symbol };
}
export const views = new WeakMap<HTMLDivElement, ViewState>();
