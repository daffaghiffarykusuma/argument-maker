import type { ArgumentPreview } from "./argument-preview";
import type { LocalDraft } from "../board/local-draft";
import type { GatheredFactEditing } from "./gathered-fact-editing";

export type WritingAction = "copy-outline" | "markdown" | "text" | "print";

export interface ViewState {
  draft: LocalDraft;
  facts: GatheredFactEditing;
  preview: ArgumentPreview;
  disclosures: Map<string, boolean>;
  copyFeedback?: { message: string; request: symbol };
  reviewOpen?: boolean;
  writingMode?: "draft" | "reviewed";
  writingInvitationOpen?: boolean;
  pendingWriting?: WritingAction;
}
export const views = new WeakMap<HTMLDivElement, ViewState>();
