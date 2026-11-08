import type { ArgumentPreview } from "./argument-preview";
import type { LocalDraft } from "../board/local-draft";
import type { GatheredFactEditing } from "./gathered-fact-editing";
import type { WorkflowStage } from "../board/argument-board-session";

export interface EditingPosition {
  stage: WorkflowStage;
  id: string;
  index: number;
  x: number;
  y: number;
  scrollTop: number;
  scrollLeft: number;
  selection?: [number | null, number | null, "forward" | "backward" | "none"];
}

export type WritingAction = "copy-outline" | "markdown" | "text" | "print";

export interface ViewState {
  draft: LocalDraft;
  facts: GatheredFactEditing;
  preview: ArgumentPreview;
  disclosures: Map<string, boolean>;
  copyFeedback?: { message: string; request: symbol };
  reviewOpen?: boolean;
  editingPosition?: EditingPosition;
  reviewReturn?: EditingPosition;
  writingMode?: "draft" | "reviewed";
  writingInvitationOpen?: boolean;
  pendingWriting?: WritingAction;
}
export const views = new WeakMap<HTMLDivElement, ViewState>();
