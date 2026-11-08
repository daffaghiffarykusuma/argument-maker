import type { ViewState } from "./board-view-state";

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
  const stage = root.querySelector('[role="tabpanel"]');
  const target = position
    ? (position.id ? document.getElementById(position.id) : stage?.querySelectorAll<HTMLElement>('button, input, textarea, select, summary, [tabindex]')[position.index])
    : root.querySelector<HTMLElement>(window.matchMedia("(min-width: 1201px)").matches ? "#stage-heading-construct" : "#view-outline");
  target?.focus({ preventScroll: true });
  if (position) {
    if (position.selection && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) target.setSelectionRange(...position.selection);
    if (target) { target.scrollTop = position.scrollTop; target.scrollLeft = position.scrollLeft; }
    window.scrollTo(position.x, position.y);
    view.editingPosition = position;
  }
}
