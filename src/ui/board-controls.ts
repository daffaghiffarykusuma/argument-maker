import { createArgumentPreview } from "./argument-preview";
import { createLocalDraft } from "../board/local-draft";
import { type ArgumentBoardSession, type WorkflowStage } from "../board/argument-board-session";
import { views, type ViewState } from "./board-view-state";
import { escapeHtml } from "./html";
import { createGatheredFactEditing } from "./gathered-fact-editing";

type Editor = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
interface Controls {
  render(root: HTMLDivElement, session: ArgumentBoardSession): void;
  change(root: HTMLDivElement, session: ArgumentBoardSession, target: Editor, refresh?: boolean): void;
  action(root: HTMLDivElement, session: ArgumentBoardSession, target: HTMLElement): void;
  upload(root: HTMLDivElement, session: ArgumentBoardSession, input: HTMLInputElement): Promise<void>;
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
  const view: ViewState = { draft, facts, preview, disclosures };
  views.set(root, view);
  // Record the writing location before moving to utility controls can scroll it away.
  const rememberEditingPosition = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return;
    const panel = target.closest('[role="tabpanel"]');
    if (!panel || !target.matches('button, input, textarea, select, summary, [tabindex]')) return;
    view.editingPosition = {
      stage: session.snapshot().stage, id: target.id,
      index: [...panel.querySelectorAll('button, input, textarea, select, summary, [tabindex]')].indexOf(target),
      x: window.scrollX, y: window.scrollY, scrollTop: target.scrollTop, scrollLeft: target.scrollLeft,
      selection: target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && ["text", "search", "url"].includes(target.type))
        ? [target.selectionStart, target.selectionEnd, target.selectionDirection ?? "none"] : undefined,
    };
  };
  for (const event of ["focusin", "input", "keyup", "pointerup"]) root.addEventListener(event, event => rememberEditingPosition(event.target));
  for (const event of ["wheel", "touchmove"]) root.addEventListener(event, () => {
    const active = document.activeElement;
    requestAnimationFrame(() => {
      if (active === document.activeElement) rememberEditingPosition(active);
    });
  }, { passive: true });
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  const render = () => renderPreservingFocus(root, session, controls.render);
  const cancelRender = () => { if (renderTimer) clearTimeout(renderTimer); renderTimer = undefined; };
  window.addEventListener("beforeunload", (event) => {
    draft.flush();
    if (draft.snapshot().hasUnsavedChanges) {
      event.preventDefault(); event.returnValue = "";
    }
  });
  window.addEventListener("pagehide", () => draft.flush());
  window.addEventListener("storage", (event) => draft.storageChanged(event.key));
  root.addEventListener("toggle", (event) => {
    if (event.target instanceof HTMLDetailsElement && event.target.matches('.attachment-picker') && event.target.open) {
      cancelRender();
      event.target.querySelector<HTMLInputElement>('input')?.focus();
    }
    if (event.target instanceof HTMLDetailsElement && event.target.dataset.disclosure) view.disclosures.set(event.target.dataset.disclosure, event.target.open);
  }, true);
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
  });
  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "file") {
      const menu = root.querySelector<HTMLDetailsElement>(".board-menu");
      if (menu) menu.open = false;
      view.disclosures.set("board-menu", false);
      cancelRender(); void controls.upload(root, session, target); return;
    }
    if (target instanceof HTMLInputElement && target.dataset.action === "autosave") {
      cancelRender();
      draft.setEnabled(target.checked);
      render(); return;
    }
    if (target instanceof HTMLSelectElement && facts.filter(target)) return;
    if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type === "radio")) {
      cancelRender(); session.finishEdit();
      if (facts.edit(target)) render();
      else controls.change(root, session, target);
    }
  });
  root.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) || !target.dataset.action || ["attachment-search", "fact-search", "autosave", "upload", "mode-change"].includes(target.dataset.action)) return;
    facts.finishInteraction(target);
    session.finishEdit(); cancelRender();
    // Let the browser finish Tab or the pointer click before replacing the DOM.
    renderTimer = setTimeout(() => {
      if (target.dataset.factId || document.activeElement?.matches("input, textarea, select")) {
        facts.reconcile();
        controls.refresh(root, session);
        draft.flush();
      } else render();
    }, 0);
  });
  root.addEventListener("click", (event) => {
    const menu = root.querySelector<HTMLDetailsElement>(".board-menu");
    if (menu?.open && !menu.contains(event.target as Node)) {
      menu.open = false;
      view.disclosures.set("board-menu", false);
    }
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (target?.matches("button")) {
      if (['close-fact-picker', 'clear-attachment-search', 'show-attached-fact'].includes(target.dataset.action ?? '')) {
        cancelRender();
        const picker = target.closest<HTMLDetailsElement>('.attachment-picker')!;
        if (target.dataset.action === 'clear-attachment-search') {
          const search = picker.querySelector<HTMLInputElement>('input')!;
          search.value = ''; facts.filter(search); search.focus();
        } else {
          picker.open = false;
          if (target.dataset.action === 'show-attached-fact') {
            const attachment = picker.closest('.destination-facts')!.querySelector<HTMLElement>(`.attached-fact[data-fact-id="${CSS.escape(target.dataset.factId!)}"]`)!;
            attachment.querySelector<HTMLElement>('summary')?.focus();
          } else picker.querySelector<HTMLElement>('summary')?.focus();
        }
        return;
      }
      if (menu?.contains(target)) {
        menu.open = false;
        view.disclosures.set("board-menu", false);
        menu.querySelector<HTMLElement>("summary")?.focus();
      }
      cancelRender(); session.finishEdit(); controls.action(root, session, target);
    }
  });
  root.addEventListener("keydown", (event) => {
    const target = event.target as HTMLElement;
    const picker = target.closest<HTMLDetailsElement>('.attachment-picker');
    if (event.key === 'Escape' && picker?.open) {
      event.preventDefault(); picker.open = false; picker.querySelector<HTMLElement>('summary')?.focus(); return;
    }
    const menu = root.querySelector<HTMLDetailsElement>(".board-menu");
    if (event.key === "Escape" && menu?.open) {
      event.preventDefault();
      menu.open = false;
      view.disclosures.set("board-menu", false);
      menu.querySelector<HTMLElement>("summary")?.focus();
    } else if (target.matches('[role="tab"]') && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault(); cancelRender();
      const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
      const index = tabs.indexOf(target as HTMLButtonElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      session.setStage(tabs[next]!.dataset.stage as WorkflowStage);
      view.reviewOpen = false;
      view.writingInvitationOpen = false;
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

const conflictActions = '<div class="conflict-actions"><button type="button" data-action="load-other-draft">Load other draft</button><button type="button" data-action="keep-this-draft">Keep saving this board</button></div>';

function updateDraftControls(root: HTMLDivElement) {
  const region = root.querySelector(".draft-controls");
  if (!region) return;
  const draft = views.get(root)!.draft.snapshot();
  const checkbox = region.querySelector<HTMLInputElement>('[data-action="autosave"]');
  if (checkbox) checkbox.checked = draft.enabled;
  const status = region.querySelector(".save-status");
  if (status) status.textContent = draft.status;
  const actions = region.querySelector(".conflict-actions");
  if (draft.conflict && !actions) region.insertAdjacentHTML("beforeend", conflictActions);
  else if (!draft.conflict && actions) {
    const restoreFocus = actions.contains(document.activeElement);
    actions.remove();
    if (restoreFocus) checkbox?.focus({ preventScroll: true });
  }
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
  const draft = view.draft.snapshot();
  return `<label class="autosave-label"><input id="autosave" type="checkbox" data-action="autosave" ${draft.enabled ? "checked" : ""}> Save draft in this browser</label>
    <span class="save-status" role="status">${escapeHtml(draft.status)}</span>
    ${draft.conflict ? conflictActions : ""}`;
}
