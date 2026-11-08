import type { EditingPosition, ViewState } from "./board-view-state";

/** Return to a writing control after a temporary review or outline view. */
export function restoreEditingPosition(root: HTMLDivElement, view: ViewState, position: EditingPosition | undefined, fallback: HTMLElement | null) {
  const panel = root.querySelector('[role="tabpanel"]');
  const target = (position
    ? (position.id ? root.querySelector<HTMLElement>(`#${CSS.escape(position.id)}`) : panel?.querySelectorAll<HTMLElement>('button, input, textarea, select, summary, [tabindex]')[position.index])
    : undefined) ?? fallback;
  target?.focus({ preventScroll: true });
  if (!position) return;
  if (target) {
    if (position.selection && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) target.setSelectionRange(...position.selection);
    target.scrollTop = position.scrollTop;
    target.scrollLeft = position.scrollLeft;
  }
  window.scrollTo(position.x, position.y);
  view.editingPosition = position;
}
