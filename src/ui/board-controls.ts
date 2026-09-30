import { createLocalDraft, localDraftKey } from "../board/local-draft";
import { createArgumentBoardSession, type ArgumentBoardSession, type WorkflowStage } from "../board/argument-board-session";
import { views, type ViewState } from "./board-view-state";
import { escapeHtml } from "./html";

type Editor = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
interface Controls {
  render(root: HTMLDivElement, session: ArgumentBoardSession): void;
  change(root: HTMLDivElement, session: ArgumentBoardSession, target: Editor, refresh?: boolean): void;
  action(root: HTMLDivElement, session: ArgumentBoardSession, target: HTMLElement): void;
  upload(root: HTMLDivElement, session: ArgumentBoardSession, input: HTMLInputElement): Promise<void>;
  filter(root: HTMLDivElement, session: ArgumentBoardSession): void;
  refresh(root: HTMLDivElement, session: ArgumentBoardSession): void;
}

export function mountBoardControls(root: HTMLDivElement, initial: ArgumentBoardSession | undefined, controls: Controls) {
  const draft = createLocalDraft({
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  });
  const restored = initial ? undefined : draft.load();
  const session = initial ?? createArgumentBoardSession(restored);
  const view: ViewState = { draft, lastSavedBoard: restored, query: "", filter: "all", previewMode: "diagram", zoom: 1, conflict: false, disclosures: new Map() };
  views.set(root, view);
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  const render = () => renderPreservingFocus(root, session, controls.render);
  const cancelRender = () => { if (renderTimer) clearTimeout(renderTimer); renderTimer = undefined; };
  window.addEventListener("beforeunload", (event) => {
    saveDraft(root, session);
    if (session.hasTouchedContent() && (!draft.enabled || view.lastSavedBoard !== session.snapshot().board)) {
      event.preventDefault(); event.returnValue = "";
    }
  });
  window.addEventListener("pagehide", () => saveDraft(root, session));
  window.addEventListener("storage", (event) => {
    if ((event.key === localDraftKey || event.key === null) && draft.enabled) {
      draft.pause(); view.conflict = true;
      view.lastSavedBoard = undefined;
      const region = root.querySelector(".draft-controls");
      if (region) region.innerHTML = renderDraftControls(view);
    }
  });
  root.addEventListener("toggle", (event) => {
    if (event.target instanceof HTMLDetailsElement && event.target.dataset.disclosure) view.disclosures.set(event.target.dataset.disclosure, event.target.open);
  }, true);
  root.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    if (target.dataset.action === "fact-search") { view.query = target.value; controls.filter(root, session); return; }
    if (target.type === "checkbox" || target.type === "radio" || target.type === "file") return;
    controls.change(root, session, target, false);
    if (view.saveTimer) clearTimeout(view.saveTimer);
    if (draft.enabled) { updateSaveStatus(root, "Saving locally..."); view.saveTimer = setTimeout(() => saveDraft(root, session), 250); }
    const snapshot = session.snapshot();
    for (const action of ["undo", "redo"] as const) {
      const button = root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`);
      if (button) button.disabled = action === "undo" ? !snapshot.canUndo : !snapshot.canRedo;
    }
    controls.refresh(root, session);
  });
  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "file") { cancelRender(); void controls.upload(root, session, target); return; }
    if (target instanceof HTMLInputElement && target.dataset.action === "autosave") {
      cancelRender();
      const ok = draft.setEnabled(target.checked, session.snapshot().board);
      if (ok) { view.lastSavedBoard = draft.enabled ? session.snapshot().board : undefined; view.conflict = false; }
      render(); return;
    }
    if (target instanceof HTMLSelectElement && target.dataset.action === "fact-filter") { view.filter = target.value as ViewState["filter"]; controls.filter(root, session); return; }
    if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type === "radio")) {
      cancelRender(); session.finishEdit(); controls.change(root, session, target);
    }
  });
  root.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) || !target.dataset.action || ["fact-search", "autosave", "upload", "mode-change"].includes(target.dataset.action)) return;
    session.finishEdit(); cancelRender();
    // Let the browser finish Tab or the pointer click before replacing the DOM.
    renderTimer = setTimeout(() => {
      if (document.activeElement?.matches("input, textarea, select")) {
        controls.refresh(root, session);
        saveDraft(root, session);
      } else render();
    }, 0);
  });
  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (target?.matches("button")) {
      cancelRender(); session.finishEdit(); controls.action(root, session, target);
    }
  });
  root.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    if (target.matches('[role="tab"]') && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault(); cancelRender();
      const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
      const index = tabs.indexOf(target as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      session.setStage(tabs[next]!.dataset.stage as WorkflowStage);
      controls.render(root, session);
      root.querySelector<HTMLButtonElement>(`[data-stage="${session.snapshot().stage}"]`)?.focus();
    } else if (target.matches('.file-button') && ["Enter", " "].includes(event.key)) {
      event.preventDefault(); target.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    } else if ((event.ctrlKey || event.metaKey) && !event.altKey && ["z", "y"].includes(event.key.toLowerCase()) && !target.matches('input, textarea, [contenteditable="true"]')) {
      event.preventDefault(); cancelRender();
      if (event.shiftKey || event.key.toLowerCase() === "y") session.redo(); else session.undo();
      render();
    }
  });
  return session;
}

export function saveDraft(root: HTMLDivElement, session: ArgumentBoardSession) {
  const view = views.get(root)!;
  if (view.saveTimer) clearTimeout(view.saveTimer);
  view.saveTimer = undefined;
  const board = session.snapshot().board;
  if (view.lastSavedBoard !== board && view.draft.save(board)) view.lastSavedBoard = board;
  updateSaveStatus(root, view.draft.status);
}

export function updateSaveStatus(root: HTMLDivElement, text: string) {
  const status = root.querySelector(".save-status");
  if (status) status.textContent = text;
}

export function renderPreservingFocus(root: HTMLDivElement, session: ArgumentBoardSession, render: Controls["render"]) {
  const active = document.activeElement as HTMLElement | null;
  const selector = 'button, input, textarea, select, summary, [tabindex]';
  const index = active ? [...root.querySelectorAll(selector)].indexOf(active) : -1;
  const id = active?.id;
  const selection = active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && ["text", "search", "url"].includes(active.type)) ? [active.selectionStart, active.selectionEnd] : undefined;
  const x = window.scrollX, y = window.scrollY;
  render(root, session);
  const replacement = id ? document.getElementById(id) : [...root.querySelectorAll<HTMLElement>(selector)][index];
  replacement?.focus({ preventScroll: true });
  if (selection && (replacement instanceof HTMLInputElement || replacement instanceof HTMLTextAreaElement)) replacement.setSelectionRange(selection[0] ?? null, selection[1] ?? null);
  window.scrollTo(x, y);
}

export function renderDraftControls(view: ViewState): string {
  return `<label class="autosave-label"><input id="autosave" type="checkbox" data-action="autosave" ${view.draft.enabled ? "checked" : ""}> Save draft in this browser</label>
    <span class="save-status" role="status">${escapeHtml(view.draft.status)}</span>
    ${view.conflict ? '<div class="conflict-actions"><button type="button" data-action="load-other-draft">Load other draft</button><button type="button" data-action="keep-this-draft">Keep saving this board</button></div>' : ""}`;
}
