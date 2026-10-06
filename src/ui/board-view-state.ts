import { createLocalDraft } from "../board/local-draft";
import type { ArgumentBoard } from "../board/argument-board";
import type { FactFilter } from "../board/fact-library";

export interface ViewState {
  draft: ReturnType<typeof createLocalDraft>;
  lastSavedBoard?: ArgumentBoard;
  saveTimer?: ReturnType<typeof setTimeout>;
  query: string;
  filter: FactFilter;
  previewMode: "diagram" | "outline";
  diagram?: { source: string; svg: Promise<string> };
  zoom: number;
  conflict: boolean;
  disclosures: Map<string, boolean>;
}
export const views = new WeakMap<HTMLDivElement, ViewState>();
