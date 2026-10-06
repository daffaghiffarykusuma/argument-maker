import type { ArgumentPreview } from "./argument-preview";
import type { LocalDraft } from "../board/local-draft";
import type { GatheredFactEditing } from "./gathered-fact-editing";

export interface ViewState {
  draft: LocalDraft;
  facts: GatheredFactEditing;
  preview: ArgumentPreview;
  disclosures: Map<string, boolean>;
}
export const views = new WeakMap<HTMLDivElement, ViewState>();
