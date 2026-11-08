import type { ViewState } from "./board-view-state";
import { restoreEditingPosition } from "./editing-position";

// Keep the editor mounted while inspecting structure, including its native undo stack.
export function openOutline(root: HTMLDivElement, view: ViewState) {
  const panel = root.querySelector<HTMLDialogElement>("#outline-panel");
  if (!panel || panel.open) return;
  view.outlineReturn = view.editingPosition?.stage === "construct" ? { ...view.editingPosition } : undefined;
  panel.showModal();
  panel.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
}

export function closeOutline(root: HTMLDivElement, view: ViewState) {
  const panel = root.querySelector<HTMLDialogElement>("#outline-panel");
  if (!panel?.open) return;
  const position = view.outlineReturn;
  panel.close();
  view.outlineReturn = undefined;
  const fallback = root.querySelector<HTMLElement>(window.matchMedia("(min-width: 1201px)").matches ? "#stage-heading-construct" : "#view-outline");
  restoreEditingPosition(root, view, position, fallback);
}
