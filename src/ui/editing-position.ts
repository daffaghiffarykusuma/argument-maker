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

/** A temporary view the author can step into and return from: the Reasoning review or the outline dialog. */
export type Excursion = "review" | "outline";

const focusable = "button, input, textarea, select, summary, [tabindex]";

function hasTextSelection(element: Element): element is HTMLInputElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLTextAreaElement || (element instanceof HTMLInputElement && ["text", "search", "url"].includes(element.type))
  );
}

/**
 * Remembers where the author is writing, holds that place across an
 * Excursion, and puts focus, selection and scroll back after the app's
 * markup is replaced.
 */
export function createEditingPosition(root: HTMLDivElement, currentStage: () => WorkflowStage) {
  let current: EditingPosition | undefined;
  const held = new Map<Excursion, EditingPosition>();

  function find(position: EditingPosition): HTMLElement | undefined {
    if (position.id) return root.querySelector<HTMLElement>(`#${CSS.escape(position.id)}`) ?? undefined;
    return root.querySelector('[role="tabpanel"]')?.querySelectorAll<HTMLElement>(focusable)[position.index];
  }

  return {
    /** Record a writing control as the author's place; utility controls outside a stage panel are ignored. */
    track(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("#outline-panel, #view-outline")) return;
      const panel = target.closest('[role="tabpanel"]');
      if (!panel || !target.matches(focusable)) return;
      current = {
        stage: currentStage(),
        id: target.id,
        index: [...panel.querySelectorAll(focusable)].indexOf(target),
        x: window.scrollX,
        y: window.scrollY,
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft,
        selection: hasTextSelection(target) ? [target.selectionStart, target.selectionEnd, target.selectionDirection ?? "none"] : undefined,
      };
    },

    /** Hold the place to return to after an Excursion. Without a place in this stage, anchor to `anchorId` when given. */
    hold(excursion: Excursion, anchorId?: string) {
      const stage = currentStage();
      if (current?.stage === stage) held.set(excursion, { ...current });
      else if (anchorId)
        held.set(excursion, { stage, id: anchorId, index: -1, x: window.scrollX, y: window.scrollY, scrollTop: 0, scrollLeft: 0 });
      else held.delete(excursion);
    },

    /** Take the held place, if any; it is forgotten either way. */
    release(excursion: Excursion): EditingPosition | undefined {
      const position = held.get(excursion);
      held.delete(excursion);
      return position;
    },

    /** Return the author to a place in the current markup, or focus `fallback` when the place is gone. */
    restore(position: EditingPosition | undefined, fallback: HTMLElement | null) {
      const target = (position && find(position)) ?? fallback;
      target?.focus({ preventScroll: true });
      if (!position) return;
      if (target) {
        if (position.selection && hasTextSelection(target)) target.setSelectionRange(...position.selection);
        target.scrollTop = position.scrollTop;
        target.scrollLeft = position.scrollLeft;
      }
      window.scrollTo(position.x, position.y);
      current = position;
    },

    /** Replace the app's markup without moving focus, caret or scroll. */
    rerender(render: () => void) {
      const active = document.activeElement as HTMLElement | null;
      const index = active ? [...root.querySelectorAll(focusable)].indexOf(active) : -1;
      const id = active?.id;
      const selection = active && hasTextSelection(active) ? ([active.selectionStart, active.selectionEnd] as const) : undefined;
      const x = window.scrollX,
        y = window.scrollY;
      render();
      const replacement = id ? document.getElementById(id) : [...root.querySelectorAll<HTMLElement>(focusable)][index];
      replacement?.focus({ preventScroll: true });
      if (selection && replacement && hasTextSelection(replacement)) replacement.setSelectionRange(selection[0], selection[1]);
      window.scrollTo(x, y);
    },

    /** Move focus to a control by id, opening any disclosures that hide it. */
    focus(id: string | undefined) {
      if (!id) return;
      const target = document.getElementById(id);
      for (let ancestor = target?.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
      }
      target?.focus();
    },

    /** Forget every place, for a replaced or cleared board. */
    reset() {
      current = undefined;
      held.clear();
    },
  };
}

export type EditingPositionTracker = ReturnType<typeof createEditingPosition>;
