import { createArgumentPreview } from "./argument-preview";
import { createLocalDraft } from "../board/local-draft";
import type { ArgumentBoardSession, WorkflowStage } from "../board/argument-board-session";
import { views, type ViewState } from "./board-view-state";
import { escapeHtml } from "./html";
import { createEditingPosition, type EditingPositionTracker } from "./editing-position";
import { createGatheredFactEditing } from "./gathered-fact-editing";
import { createWritingReviewGate } from "./writing-review-gate";
import { type ActionData, stageForShortcut } from "./argument-board-browser";
import { isModalOpen } from "./app-dialog";

type Editor = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
interface Controls {
  render(root: HTMLDivElement, session: ArgumentBoardSession): void;
  change(root: HTMLDivElement, session: ArgumentBoardSession, target: Editor, refresh?: boolean): void;
  action(root: HTMLDivElement, session: ArgumentBoardSession, action: string, data?: ActionData): void;
  upload(root: HTMLDivElement, session: ArgumentBoardSession, file: File): Promise<void>;
  refresh(root: HTMLDivElement, session: ArgumentBoardSession): void;
}

export function mountBoardControls(root: HTMLDivElement, initial: ArgumentBoardSession | undefined, controls: Controls) {
  const draft = createLocalDraft({
    storage: {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => window.localStorage.setItem(key, value),
      removeItem: (key) => window.localStorage.removeItem(key),
    },
    initialSession: initial,
    onChange: () => updateDraftControls(root),
  });
  const session = draft.session;
  const disclosures = new Map<string, boolean>();
  const facts = createGatheredFactEditing(root, session, disclosures);
  views.get(root)?.preview.dispose();
  const preview = createArgumentPreview(root);
  const positions = createEditingPosition(root, () => session.snapshot().stage);
  const view: ViewState = {
    draft,
    facts,
    preview,
    positions,
    writing: createWritingReviewGate(),
    disclosures,
    draftSuggestionDismissed: readSuggestionDismissed(),
  };
  views.set(root, view);
  const wideOutline = window.matchMedia("(min-width: 1201px)");
  wideOutline.addEventListener("change", () => {
    if (wideOutline.matches) closeOutline(root, positions);
  });
  root.addEventListener(
    "cancel",
    (event) => {
      if (event.target instanceof HTMLDialogElement && event.target.id === "outline-panel") {
        event.preventDefault();
        closeOutline(root, positions);
      }
    },
    true,
  );
  // Record the writing location before moving to utility controls can scroll it away.
  for (const event of ["focusin", "input", "keyup", "pointerup"]) root.addEventListener(event, (event) => positions.track(event.target));
  for (const event of ["wheel", "touchmove"])
    root.addEventListener(
      event,
      () => {
        const active = document.activeElement;
        requestAnimationFrame(() => {
          if (active === document.activeElement) positions.track(active);
        });
      },
      { passive: true },
    );
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  const render = () => positions.rerender(() => controls.render(root, session));
  const cancelRender = () => {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = undefined;
  };
  window.addEventListener("beforeunload", (event) => {
    draft.flush();
    if (draft.snapshot().hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.addEventListener("pagehide", () => draft.flush());
  window.addEventListener("storage", (event) => draft.storageChanged(event.key));
  root.addEventListener(
    "toggle",
    (event) => {
      if (event.target instanceof HTMLDetailsElement && event.target.matches(".attachment-picker") && event.target.open) {
        cancelRender();
        event.target.querySelector<HTMLInputElement>("input")?.focus();
      }
      if (event.target instanceof HTMLDetailsElement && event.target.dataset.disclosure)
        view.disclosures.set(event.target.dataset.disclosure, event.target.open);
    },
    true,
  );
  root.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    if (facts.filter(target)) return;
    if (target.type === "checkbox" || target.type === "radio" || target.type === "file") return;
    if (!facts.edit(target)) controls.change(root, session, target, false);
    draft.scheduleSave();
    const snapshot = session.snapshot();
    for (const action of ["undo", "redo"] as const) {
      const button = root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
      if (button) button.disabled = action === "undo" ? !snapshot.canUndo : !snapshot.canRedo;
    }
    controls.refresh(root, session);
    updateDraftControls(root);
  });
  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "file") {
      const menu = root.querySelector<HTMLDetailsElement>(".board-menu");
      if (menu) menu.open = false;
      view.disclosures.set("board-menu", false);
      const file = target.files?.[0];
      target.value = "";
      cancelRender();
      if (file) void controls.upload(root, session, file);
      return;
    }
    if (target instanceof HTMLInputElement && target.dataset.action === "autosave") {
      cancelRender();
      draft.setEnabled(target.checked);
      render();
      return;
    }
    if (target instanceof HTMLSelectElement && facts.filter(target)) return;
    if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type === "radio")) {
      cancelRender();
      session.finishEdit();
      if (facts.edit(target)) render();
      else controls.change(root, session, target);
    }
  });
  root.addEventListener("focusout", (event) => {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) ||
      !target.dataset.action ||
      ["attachment-search", "fact-search", "autosave", "upload", "mode-change"].includes(target.dataset.action)
    )
      return;
    facts.finishInteraction(target);
    session.finishEdit();
    cancelRender();
    // Let the browser finish Tab or the pointer click before replacing the DOM.
    renderTimer = setTimeout(() => {
      if (
        target.dataset.factId ||
        document.activeElement?.matches("input, textarea, select, #view-outline") ||
        root.querySelector("#outline-panel[open]") ||
        document.activeElement?.closest(".construction-disclosure > summary")
      ) {
        facts.reconcile();
        controls.refresh(root, session);
        draft.flush();
      } else render();
    }, 0);
  });
  root.addEventListener("click", (event) => {
    for (const menu of root.querySelectorAll<HTMLDetailsElement>(".board-menu, .writing-menu")) {
      if (menu.open && !menu.contains(event.target as Node)) {
        menu.open = false;
        view.disclosures.set(menu.dataset.disclosure!, false);
      }
    }
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (target?.dataset.action === "open-outline" || target?.dataset.action === "close-outline") {
      cancelRender();
      session.finishEdit();
      if (target.dataset.action === "open-outline") openOutline(root, positions);
      else closeOutline(root, positions);
      return;
    }
    if (target?.matches("button")) {
      if (["close-fact-picker", "clear-attachment-search", "show-attached-fact"].includes(target.dataset.action ?? "")) {
        cancelRender();
        const picker = target.closest<HTMLDetailsElement>(".attachment-picker")!;
        if (target.dataset.action === "clear-attachment-search") {
          const search = picker.querySelector<HTMLInputElement>("input")!;
          search.value = "";
          facts.filter(search);
          search.focus();
        } else {
          picker.open = false;
          if (target.dataset.action === "show-attached-fact") {
            const attachment = picker
              .closest(".destination-facts")!
              .querySelector<HTMLElement>(`.attached-fact[data-fact-id="${CSS.escape(target.dataset.factId!)}"]`)!;
            attachment.querySelector<HTMLElement>("summary")?.focus();
          } else picker.querySelector<HTMLElement>("summary")?.focus();
        }
        return;
      }
      const menu = target.closest<HTMLDetailsElement>(".board-menu, .writing-menu");
      if (menu) {
        menu.open = false;
        view.disclosures.set(menu.dataset.disclosure!, false);
        menu.querySelector<HTMLElement>("summary")?.focus();
      }
      cancelRender();
      session.finishEdit();
      controls.action(root, session, target.dataset.action ?? "", { ...target.dataset });
    }
  });
  root.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    if (event.key === "Tab" && target.closest("#outline-panel[open]")) {
      event.preventDefault();
      root.querySelector<HTMLButtonElement>('#outline-panel [data-action="close-outline"]')?.focus();
      return;
    }
    const picker = target.closest<HTMLDetailsElement>(".attachment-picker");
    if (event.key === "Escape" && picker?.open) {
      event.preventDefault();
      picker.open = false;
      picker.querySelector<HTMLElement>("summary")?.focus();
      return;
    }
    const menu = root.querySelector<HTMLDetailsElement>(".board-menu[open], .writing-menu[open]");
    if (event.key === "Escape" && menu?.open) {
      event.preventDefault();
      menu.open = false;
      view.disclosures.set(menu.dataset.disclosure!, false);
      menu.querySelector<HTMLElement>("summary")?.focus();
    } else if (target.matches('[role="tab"]') && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      cancelRender();
      const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
      const index = tabs.indexOf(target as HTMLButtonElement);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      session.setStage(tabs[next]!.dataset.stage as WorkflowStage);
      view.writing.send({ type: "leave" });
      controls.render(root, session);
      root.querySelector<HTMLButtonElement>(`[data-stage="${session.snapshot().stage}"]`)?.focus();
    } else if (target.matches(".file-button") && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      target.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      ["z", "y"].includes(event.key.toLowerCase()) &&
      !target.matches('input, textarea, [contenteditable="true"]')
    ) {
      event.preventDefault();
      cancelRender();
      if (event.shiftKey || event.key.toLowerCase() === "y") session.redo();
      else session.undo();
      render();
    }
  });
  // Dropping a board file anywhere on the page opens it, like Upload Board.
  let dragDepth = 0;
  const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;
  const endDrag = () => {
    dragDepth = 0;
    root.classList.remove("file-drop-active");
  };
  window.addEventListener("dragenter", (event) => {
    if (!carriesFiles(event)) return;
    dragDepth += 1;
    root.classList.add("file-drop-active");
  });
  window.addEventListener("dragleave", (event) => {
    if (!carriesFiles(event)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) endDrag();
  });
  window.addEventListener("dragover", (event) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = isModalOpen() ? "none" : "copy";
  });
  window.addEventListener("drop", (event) => {
    if (!carriesFiles(event)) return;
    event.preventDefault();
    endDrag();
    const file = event.dataTransfer?.files[0];
    if (!file || isModalOpen()) return;
    cancelRender();
    session.finishEdit();
    void controls.upload(root, session, file);
  });
  // Page-wide shortcuts work wherever focus is, including text fields.
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || isModalOpen()) return;
    const target = event.target instanceof HTMLElement ? event.target : document.body;
    const modifier = event.ctrlKey || event.metaKey;
    const typing = target.matches('input, textarea, select, [contenteditable="true"]');
    let command: [string, ActionData?] | undefined;
    if (modifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s") command = ["download"];
    else if (event.altKey && !modifier && !event.shiftKey && /^Digit[1-9]$/.test(event.code)) {
      const stage = stageForShortcut(Number(event.code.slice(5)));
      if (stage) command = ["stage", { stage }];
    } else if (event.key === "?" && !modifier && !event.altKey && !typing) command = ["show-shortcuts"];
    if (!command) return;
    event.preventDefault();
    cancelRender();
    session.finishEdit();
    for (const menu of root.querySelectorAll<HTMLDetailsElement>(".board-menu[open], .writing-menu[open]")) {
      menu.open = false;
      view.disclosures.set(menu.dataset.disclosure!, false);
    }
    controls.action(root, session, ...command);
  });
  return session;
}

const suggestionDismissedKey = "argument-maker.draft-suggestion-dismissed";

function readSuggestionDismissed(): boolean {
  try {
    return window.localStorage.getItem(suggestionDismissedKey) === "true";
  } catch {
    return false;
  }
}

export function dismissDraftSuggestion(view: ViewState) {
  view.draftSuggestionDismissed = true;
  try {
    window.localStorage.setItem(suggestionDismissedKey, "true");
  } catch {
    // The suggestion stays dismissed for this tab.
  }
}

const draftSuggestion = `<div class="draft-suggestion" role="group" aria-labelledby="draft-suggestion-text">
  <p id="draft-suggestion-text">Keep a draft in this browser so refreshing or closing the tab doesn't lose your work.</p>
  <div class="draft-suggestion-actions"><button type="button" data-action="accept-draft-suggestion">Turn on draft saving</button><button type="button" data-action="dismiss-draft-suggestion">Not now</button></div>
</div>`;

function shouldSuggestSaving(view: ViewState): boolean {
  return !view.draftSuggestionDismissed && view.draft.snapshot().suggestSaving;
}

const conflictActions =
  '<div class="conflict-actions"><button type="button" data-action="load-other-draft">Load other draft</button><button type="button" data-action="keep-this-draft">Keep saving this board</button></div>';

function updateDraftControls(root: HTMLDivElement) {
  const region = root.querySelector(".draft-controls");
  if (!region) return;
  const draft = views.get(root)!.draft.snapshot();
  const checkbox = region.querySelector<HTMLInputElement>('[data-action="autosave"]');
  if (checkbox) checkbox.checked = draft.enabled;
  const status = region.querySelector(".save-status");
  if (status) status.textContent = draft.status;
  const suggestion = region.querySelector(".draft-suggestion");
  const view = views.get(root)!;
  if (shouldSuggestSaving(view) && !suggestion) region.insertAdjacentHTML("beforeend", draftSuggestion);
  else if (!shouldSuggestSaving(view) && suggestion) {
    const restoreFocus = suggestion.contains(document.activeElement);
    suggestion.remove();
    if (restoreFocus) checkbox?.focus({ preventScroll: true });
  }
  const actions = region.querySelector(".conflict-actions");
  if (draft.conflict && !actions) region.insertAdjacentHTML("beforeend", conflictActions);
  else if (!draft.conflict && actions) {
    const restoreFocus = actions.contains(document.activeElement);
    actions.remove();
    if (restoreFocus) checkbox?.focus({ preventScroll: true });
  }
}

// Keep the editor mounted while inspecting structure, including its native undo stack.
function openOutline(root: HTMLDivElement, positions: EditingPositionTracker) {
  const panel = root.querySelector<HTMLDialogElement>("#outline-panel");
  if (!panel || panel.open) return;
  positions.hold("outline");
  panel.showModal();
  panel.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
}

function closeOutline(root: HTMLDivElement, positions: EditingPositionTracker) {
  const panel = root.querySelector<HTMLDialogElement>("#outline-panel");
  if (!panel?.open) return;
  panel.close();
  const fallback = root.querySelector<HTMLElement>(
    window.matchMedia("(min-width: 1201px)").matches ? "#stage-heading-construct" : "#view-outline",
  );
  positions.restore(positions.release("outline"), fallback);
}

export function renderDraftControls(view: ViewState): string {
  const draft = view.draft.snapshot();
  return `<label class="autosave-label"><input id="autosave" type="checkbox" data-action="autosave" ${draft.enabled ? "checked" : ""}> Save draft in this browser</label>
    <span class="save-status" role="status">${escapeHtml(draft.status)}</span>
    ${draft.conflict ? conflictActions : ""}
    ${shouldSuggestSaving(view) ? draftSuggestion : ""}`;
}
