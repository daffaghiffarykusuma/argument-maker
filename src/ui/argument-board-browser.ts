import { destinationLabel, type ArgumentBoard, type SupportMode } from "../board/argument-board";
import { parseExportFile } from "../board/export-file-contract";
import { confirmAction, showShortcuts, type ConfirmOptions } from "./app-dialog";
import type { ArgumentBoardSession, WorkflowStage } from "../board/argument-board-session";

type IconName = "copy" | "download" | "upload" | "undo" | "redo" | "trash" | "up" | "down" | "eye" | "eyeOff";

interface IconButtonOptions {
  action: string;
  label: string;
  icon: IconName;
  attrs?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

interface CommandDeskActionControl {
  action: string;
  label: string;
  icon: IconName;
  danger?: boolean;
  disabled?: boolean;
}

const commandDeskActions = {
  copyOutline: { action: "copy-outline", label: "Copy Outline", icon: "copy" },
  download: { action: "download", label: "Download editable board", icon: "download" },
  upload: { action: "upload", label: "Upload Board", icon: "upload" },
  undo: { action: "undo", label: "Undo", icon: "undo" },
  redo: { action: "redo", label: "Redo", icon: "redo" },
  clear: { action: "clear", label: "Clear Board", icon: "trash", danger: true },
  moveArgumentUp: { action: "move-argument", label: "Move Supporting Argument Up", icon: "up" },
  moveArgumentDown: { action: "move-argument", label: "Move Supporting Argument Down", icon: "down" },
  duplicateArgument: { action: "duplicate-argument", label: "Duplicate Supporting Argument", icon: "copy" },
  deleteArgument: { action: "delete-argument", label: "Delete Supporting Argument", icon: "trash", danger: true },
  copyMermaid: { action: "copy-mermaid", label: "Copy Mermaid", icon: "copy" },
} as const satisfies Record<string, CommandDeskActionControl>;

import { hasOutlineContent, narrativeGuidance, suggestStartingStep } from "../board/construction-guidance";
import { createExampleBoard } from "../board/example-board";
import { factDeletionImpact, usedFactCount } from "../board/fact-library";
import { views, type Notice, type ViewState } from "./board-view-state";
import { dismissDraftSuggestion, mountBoardControls, renderDraftControls } from "./board-controls";
import { renderReasoningPrompts, renderCompactOutline, renderPrintDocument } from "./enhancement-view";
import { escapeHtml, escapeAttr, safeDomId } from "./html";
import type { GatheredFactEditing } from "./gathered-fact-editing";
import { renderReasoningReview, renderWritingInvitation } from "./reasoning-review";
import { replaceRegion } from "./region";
import type { WritingAction, WritingGateEvent } from "./writing-review-gate";

export function mountArgumentBoardApp(appRoot: HTMLDivElement, initialSession?: ArgumentBoardSession) {
  const session = mountBoardControls(appRoot, initialSession, {
    render,
    change: handleChange,
    action: handleAction,
    upload: openBoardFile,
    refresh: refreshEditingState,
  });
  render(appRoot, session);
}

function render(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  const view = views.get(appRoot)!;
  for (const details of appRoot.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]"))
    view.disclosures.set(details.dataset.disclosure!, details.open);
  view.draft.flush();
  const snapshot = session.snapshot();
  const writing = view.writing.view();
  syncDocumentTitle(snapshot.board);

  appRoot.innerHTML = `
    <div class="app-shell">
      ${renderWorkspaceHeader(snapshot.canUndo, snapshot.canRedo)}
      <main class="desk-main">
        ${renderTopbar(snapshot.board)}
        <div class="draft-controls">${renderDraftControls(view)}</div>
        <div class="stage-bar">
        ${renderStageNavigation(snapshot.stage)}
        <div class="review-entry"><button id="open-reasoning-review" type="button" data-action="open-review" aria-expanded="${writing.panel === "review"}">Reasoning review</button>${writing.label ? `<button type="button" data-action="toggle-draft-label" aria-pressed="${writing.label === "draft"}">Label writing exports as Draft</button>` : ""}</div>
        </div>
        ${writing.panel === "invitation" ? renderWritingInvitation() : writing.panel === "review" ? renderReasoningReview(snapshot.board, snapshot.issues, writing.offerContinue) : renderStage(snapshot.board, snapshot.stage, snapshot.issues, view)}
        ${renderPrintDocument(snapshot.board, writing.draft)}
      </main>
      <div class="${noticeClass(view, snapshot.board)}" role="status" aria-label="Notifications" aria-live="polite" aria-atomic="true">${renderNotice(view, snapshot.board)}</div>
    </div>
  `;

  for (const details of appRoot.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")) {
    if (view.disclosures.has(details.dataset.disclosure!)) details.open = view.disclosures.get(details.dataset.disclosure!)!;
  }
  void view.preview.sync();
}

function renderWorkspaceHeader(canUndo: boolean, canRedo: boolean): string {
  return `
    <header class="workspace-header" aria-label="Workspace commands">
      <div class="workspace-brand"><svg class="brand-mark" aria-hidden="true" viewBox="0 0 24 24"><path d="M7 7v11.5M7 12.5h11M7 18.5h11" fill="none" stroke="#3c4f46" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="5.5" r="3" fill="#d8b15e"/><circle cx="7" cy="12.5" r="2.1" fill="#0e1613" stroke="#d8b15e" stroke-width="1.3"/><circle cx="7" cy="18.5" r="2.1" fill="#0e1613" stroke="#d8b15e" stroke-width="1.3"/></svg><span>Argument Maker</span></div>
      <div class="workspace-actions">
        <details class="writing-menu" data-disclosure="writing-menu">
          <summary id="writing-menu-toggle">Export writing</summary>
          <div class="writing-menu-actions" aria-label="Writing formats">
            <button type="button" data-action="copy-outline">Copy</button>
            <button type="button" data-action="download-writing" data-format="markdown">Markdown</button>
            <button type="button" data-action="download-writing" data-format="text">Text</button>
            <button type="button" data-action="print">Print/PDF</button>
          </div>
        </details>
        ${renderCommandButton({ ...commandDeskActions.undo, disabled: !canUndo })}
        ${renderCommandButton({ ...commandDeskActions.redo, disabled: !canRedo })}
        <details class="board-menu" data-disclosure="board-menu">
          <summary id="board-menu-toggle"><span class="desktop-label">Board</span><span class="mobile-label">More</span></summary>
          <div class="board-menu-actions" aria-label="Board file actions">
        ${renderCommandButton(commandDeskActions.download, 'aria-keyshortcuts="Control+S Meta+S"')}
        <label class="icon-button file-button" aria-label="${commandDeskActions.upload.label}" title="${commandDeskActions.upload.label}" data-tooltip="${commandDeskActions.upload.label}" tabindex="0">
          ${renderIcon(commandDeskActions.upload.icon)}<span class="tool-label">Upload Board</span>
          <input type="file" tabindex="-1" accept=".json,.argument.json,application/json" data-action="upload" />
        </label>
        <p>Portable editable file for reopening your board. You can also drop a board file onto the page. Local drafts are optional.</p>
        <button type="button" data-action="show-shortcuts" aria-keyshortcuts="Shift+?">Keyboard shortcuts</button>
        <hr>
        ${renderCommandButton(commandDeskActions.clear)}
          </div>
        </details>
      </div>
    </header>
  `;
}

function renderTopbar(board: ArgumentBoard): string {
  const usedCount = usedFactCount(board);

  return `
    <header class="topbar" aria-label="Argument board status">
      <div class="title-group">
        <input id="board-title" class="title-input" aria-label="Board title" value="${escapeAttr(board.title)}" placeholder="A good argument starts here." data-action="title" />
      </div>
      <div class="desk-status">
        <div><strong>${board.gatheredFacts.length}</strong><span>${board.gatheredFacts.length === 1 ? "fact" : "facts"} gathered</span></div><div><strong>${usedCount}</strong><span>in your argument</span></div>
      </div>
    </header>
  `;
}

function renderStageNavigation(stage: WorkflowStage): string {
  return `
    <nav class="stage-tabs" role="tablist" aria-label="Argument workflow stages">
      ${workflowStages
        .map(
          ({ id, label }, index) => `
            <button
              type="button"
              role="tab"
              aria-selected="${stage === id}"
              id="stage-tab-${id}"
              tabindex="${stage === id ? 0 : -1}"
              aria-controls="stage-panel-${id}"
              aria-keyshortcuts="Alt+${index + 1}"
              data-action="stage"
              data-stage="${id}"
              class="${stage === id ? "active" : ""}"
            ><span>${label}</span></button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderStage(
  board: ArgumentBoard,
  stage: WorkflowStage,
  issues: ReturnType<ArgumentBoardSession["snapshot"]>["issues"],
  view: ViewState,
): string {
  if (stage === "gather") {
    return view.facts.renderLibrary(board);
  }

  if (stage === "construct") {
    return renderConstructStage(board, issues, view.facts);
  }

  return view.preview.render(board, renderCommandButton(commandDeskActions.copyMermaid));
}

function renderConstructStage(
  board: ArgumentBoard,
  issues: ReturnType<ArgumentBoardSession["snapshot"]>["issues"],
  facts: GatheredFactEditing,
): string {
  return `
    <section id="stage-panel-construct" class="workflow-stage" role="tabpanel" aria-labelledby="stage-tab-construct">
      <div class="section-heading">
        <div>
          <h2 id="stage-heading-construct" tabindex="-1">Construct Argument</h2>
        </div>
        <button type="button" id="view-outline" class="view-outline" data-action="open-outline" aria-haspopup="dialog" aria-controls="outline-panel">View outline</button>
      </div>
      <div class="starting-guidance">${renderStartingGuidance(board)}</div>
      <div class="construction-layout"><div class="construction-editor">
      ${renderChecklist(issues)}
      <section class="scqa-grid" aria-label="Argument frame">
        ${renderTextPanel(board, "question", "What question must this answer?", "Question", facts)}
        ${renderTextPanel(board, "answer", "What is your tentative claim or main answer?", "Answer", facts)}
      </section>
      <details class="construction-disclosure" data-disclosure="context">
        <summary>Context <span data-framing-summary="context">${renderFramingSummary(board, "context")}</span></summary>
      <section class="scqa-grid" aria-label="Context fields">
        ${renderTextPanel(board, "situation", "What is happening?", "Situation", facts)}
        ${renderTextPanel(board, "complication", "What changed or makes this matter?", "Complication", facts)}
      </section>
      </details>
      <details class="construction-disclosure" data-disclosure="planning">
        <summary>Planning <span data-framing-summary="planning">${renderFramingSummary(board, "planning")}</span></summary>
      <section class="scqa-grid" aria-label="Planning context">
        <article class="panel">
          <label for="planning-audience"><span class="panel-label">Audience (optional)</span></label>
          <textarea id="planning-audience" data-action="planning-context" data-field="audience" rows="2" placeholder="Who is this for?" aria-describedby="planning-privacy">${escapeHtml(board.audience ?? "")}</textarea>
        </article>
        <article class="panel">
          <label for="planning-outcome"><span class="panel-label">Intended outcome (optional)</span></label>
          <textarea id="planning-outcome" data-action="planning-context" data-field="intendedOutcome" rows="2" placeholder="What should they understand or do afterward?" aria-describedby="planning-privacy">${escapeHtml(board.intendedOutcome ?? "")}</textarea>
        </article>
      </section>
      <p id="planning-privacy" class="verification-note">Planning context stays in your editable board and is left out of writing exports.</p>
      </details>
      <section class="support-section" aria-label="Supporting argument structure">
        <div class="section-heading">
          <div>
            <h2 id="supporting-arguments" tabindex="-1">Supporting Arguments</h2>
          </div>
          <button type="button" data-action="add-argument">+ Argument</button>
        </div>
        <div class="argument-list">
          ${board.supportingArguments.map((argument, index) => renderArgument(board, argument, index, facts)).join("")}
        </div>
      </section>
      </div><aside class="construction-outline" aria-label="Live argument outline"><h3>Argument outline</h3><div class="construction-outline-content">${renderStartingOutline(board)}</div></aside></div>
      <dialog id="outline-panel" class="outline-panel" aria-labelledby="outline-panel-heading">
        <div class="section-heading"><h2 id="outline-panel-heading">Argument outline</h2><button type="button" data-action="close-outline">Close outline</button></div>
        <p class="verification-note">Read-only. Return to writing to make changes.</p>
        <div class="construction-outline-content">${renderStartingOutline(board)}</div>
      </dialog>
    </section>
  `;
}

function renderFramingSummary(board: ArgumentBoard, section: "context" | "planning"): string {
  const fields =
    section === "context"
      ? [
          ["Situation", board.scqa.situation.text],
          ["Complication", board.scqa.complication.text],
        ]
      : [
          ["Audience", board.audience],
          ["Intended outcome", board.intendedOutcome],
        ];
  const populated = fields.filter(([, text]) => text?.trim());
  return populated.length
    ? populated.map(([label, text]) => `<span>${label}: ${escapeHtml(text!.trim().replace(/\s+/g, " "))}</span>`).join("")
    : section === "context"
      ? "Add Situation and Complication when needed"
      : "Optional Audience and Intended outcome";
}

function renderStartingGuidance(board: ArgumentBoard): string {
  return {
    frame: `<p>Start with a question or a tentative claim. You can revise either as you learn and use any workspace tab at any time.</p><button type="button" data-action="focus-framing" data-target-id="scqa-question">Start with a question</button> <button type="button" data-action="focus-framing" data-target-id="scqa-answer">Start with a tentative claim</button>`,
    gather: `<p>Find material that supports or challenges your idea. You can also keep developing your reasoning here.</p><button type="button" data-action="stage" data-stage="gather">Gather supporting material</button>`,
    reason: `<p>Explain how your supporting material leads to your Answer.</p><button type="button" data-action="focus-framing" data-target-id="supporting-arguments">Develop a supporting reason</button>`,
    preview: `<p>Read your argument as a whole and look for gaps in its reasoning.</p><button type="button" data-action="stage" data-stage="preview">Preview your argument</button>`,
  }[suggestStartingStep(board)];
}

function renderStartingOutline(board: ArgumentBoard): string {
  return hasOutlineContent(board) ? renderCompactOutline(board) : "<p>Your outline will take shape as you write.</p>";
}

function renderTextPanel(
  board: ArgumentBoard,
  field: keyof ArgumentBoard["scqa"],
  label: string,
  term: string,
  facts: GatheredFactEditing,
): string {
  const slot = board.scqa[field];
  const destinationId = field === "situation" || field === "complication" ? field : undefined;
  const classes = ["panel", field === "answer" ? "answer-panel" : "", destinationId ? "evidence-panel" : ""].filter(Boolean).join(" ");

  return `
    <article class="${classes}">
      <label for="scqa-${field}">
        <span class="panel-label">${label}</span>
        <span class="term">${term}</span>
      </label>
      <textarea id="scqa-${field}" data-action="scqa" data-field="${field}" rows="4" aria-describedby="scqa-${field}-guidance" placeholder="${escapeAttr({ question: "What do you need to find out?", answer: "What do you think the answer might be?", situation: "Describe the context...", complication: "Explain what changed..." }[field])}">${escapeHtml(slot.text)}</textarea>
      <p id="scqa-${field}-guidance" class="narrative-guidance" ${narrativeGuidance(board, field) ? "" : "hidden"}>${narrativeGuidance(board, field)}</p>
      ${destinationId ? facts.renderAttachments(board, destinationId) : ""}
    </article>
  `;
}

function renderArgument(
  board: ArgumentBoard,
  argument: ArgumentBoard["supportingArguments"][number],
  index: number,
  facts: GatheredFactEditing,
): string {
  return `
    <article class="argument-card">
      <div class="argument-header">
        <label for="argument-text-${safeDomId(argument.id)}">
          <span class="panel-label">Why should someone believe this?</span>
          <span class="term">Supporting Argument ${index + 1}</span>
          <textarea id="argument-text-${safeDomId(argument.id)}" data-action="argument-text" data-argument-id="${escapeAttr(argument.id)}" rows="2" placeholder="Write a reason...">${escapeHtml(argument.text)}</textarea>
        </label>
        <div class="card-controls" aria-label="Supporting Argument ${index + 1} controls">
          ${renderModeControl(argument.id, argument.mode)}
          ${renderCommandButton(commandDeskActions.moveArgumentUp, `data-direction="up" data-argument-id="${escapeAttr(argument.id)}"`)}
          ${renderCommandButton(commandDeskActions.moveArgumentDown, `data-direction="down" data-argument-id="${escapeAttr(argument.id)}"`)}
          ${renderCommandButton(commandDeskActions.duplicateArgument, `data-argument-id="${escapeAttr(argument.id)}"`)}
          ${renderCommandButton(commandDeskActions.deleteArgument, `data-argument-id="${escapeAttr(argument.id)}"`)}
        </div>
      </div>
      ${facts.renderAttachments(board, argument.id)}
      ${renderReasoningPrompts(argument)}
    </article>
  `;
}

function renderModeControl(argumentId: string, mode: SupportMode): string {
  const safeId = safeDomId(argumentId);
  return `
    <fieldset class="segmented">
      <legend>Support Mode</legend>
      <span class="segmented-options"><label><input id="mode-${safeId}-reasoning" type="radio" name="mode-${safeId}" data-action="mode-change" data-argument-id="${escapeAttr(argumentId)}" value="reasoning" ${mode === "reasoning" ? "checked" : ""} /> Reasoning</label>
      <label><input id="mode-${safeId}-evidence" type="radio" name="mode-${safeId}" data-action="mode-change" data-argument-id="${escapeAttr(argumentId)}" value="evidence-backed" ${mode === "evidence-backed" ? "checked" : ""} /> Evidence-backed</label></span>
    </fieldset>
  `;
}

function renderChecklist(issues: ReturnType<ArgumentBoardSession["snapshot"]>["issues"]): string {
  return `<aside class="checklist" aria-label="Review checklist">${renderChecklistContent(issues)}</aside>`;
}

function renderChecklistContent(issues: ReturnType<ArgumentBoardSession["snapshot"]>["issues"]): string {
  return `
      <h2>Structural checks</h2>
      <p>Check for missing parts whenever you are ready. These checks do not assess your reasoning.</p>
      <details data-disclosure="readiness"><summary>Review ${issues.length} structural issue${issues.length === 1 ? "" : "s"}</summary><ul>
        ${
          issues.length === 0
            ? "<li>No structural issues found.</li>"
            : issues
                .map(
                  (issue) => `
                    <li>
                      <button type="button" class="issue-link" data-action="open-issue" data-target-id="${escapeAttr(issue.targetId)}">${escapeHtml(issue.message)}</button>
                      ${issue.fieldMessages?.map((message) => `<span>${escapeHtml(message)}</span>`).join("") ?? ""}
                    </li>
                  `,
                )
                .join("")
        }
      </ul></details>
  `;
}

function handleChange(
  appRoot: HTMLDivElement,
  session: ArgumentBoardSession,
  target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  refresh = true,
) {
  const action = target.dataset.action;
  const dispatch = (command: Parameters<ArgumentBoardSession["dispatch"]>[0]) => session.dispatch(command, refresh ? undefined : target.id);
  const argumentId = target.dataset.argumentId;

  if (action === "title") {
    dispatch({ type: "update-title", title: target.value });
  } else if (action === "planning-context" && (target.dataset.field === "audience" || target.dataset.field === "intendedOutcome")) {
    dispatch({ type: "update-planning-context", field: target.dataset.field, text: target.value });
  } else if (action === "scqa" && target instanceof HTMLTextAreaElement) {
    dispatch({
      type: "update-scqa",
      field: target.dataset.field as keyof ArgumentBoard["scqa"],
      text: target.value,
    });
  } else if (action === "argument-text" && argumentId && target instanceof HTMLTextAreaElement) {
    dispatch({ type: "update-supporting-argument", argumentId, changes: { text: target.value } });
  } else if (action === "mode-change" && argumentId && target instanceof HTMLInputElement) {
    dispatch({
      type: "update-supporting-argument",
      argumentId,
      changes: { mode: target.value as SupportMode },
    });
  } else if (action === "reasoning-note" && argumentId) {
    const field = target.dataset.field as "connection" | "assumptions" | "objection" | "weakensClaim";
    dispatch({ type: "update-supporting-argument", argumentId, changes: { [field]: target.value } });
  } else {
    return;
  }

  if (refresh) rerender(appRoot, session);
}

export type ActionData = Readonly<Record<string, string | undefined>>;

interface ActionContext {
  appRoot: HTMLDivElement;
  session: ArgumentBoardSession;
  view: ViewState;
  data: ActionData;
}

const direction = (data: ActionData) => (data.direction === "up" ? "up" : "down");

/** UI commands by `data-action` name. Buttons and keyboard shortcuts both dispatch through here. */
const actions: Record<string, (context: ActionContext) => void | Promise<void>> = {
  "open-review": ({ appRoot, session }) => {
    sendWriting(appRoot, { type: "open-review" });
    renderAndFocus(appRoot, session, "reasoning-review-heading");
  },
  "close-review": ({ appRoot, session }) => {
    sendWriting(appRoot, { type: "close-review" });
    returnFromReview(appRoot, session);
  },
  "review-writing": ({ appRoot, session }) => {
    sendWriting(appRoot, { type: "review-now" });
    renderAndFocus(appRoot, session, "reasoning-review-heading");
  },
  "export-draft": (context) => chooseWritingLabel(context, "draft"),
  "continue-writing": (context) => chooseWritingLabel(context, "reviewed"),
  "cancel-writing": ({ appRoot, session }) => {
    const { settled } = sendWriting(appRoot, { type: "cancel-export" });
    render(appRoot, session);
    if (settled) focusWritingMenu(appRoot);
  },
  "toggle-draft-label": ({ appRoot, session }) => {
    sendWriting(appRoot, { type: "toggle-draft-label" });
    rerender(appRoot, session);
  },
  "load-example": async ({ appRoot, session, view }) => {
    const result = await replaceBoard(session, JSON.stringify(createExampleBoard()), {
      title: "Replace this board with the worked example?",
      message: "Your current board will be replaced. You can undo this.",
      confirmLabel: "Use worked example",
    });
    if (!result?.ok) return;
    resetWritingReview(view);
    view.facts.resetSearch();
    session.setStage("construct");
    renderAndFocus(appRoot, session, "stage-heading-construct");
  },
  "preview-mode": ({ appRoot, session, view, data }) => {
    view.preview.setMode(data.mode === "outline" ? "outline" : "diagram");
    rerender(appRoot, session);
  },
  zoom: ({ view, data }) => view.preview.zoom(data.zoom === "fit" ? "fit" : data.zoom === "in" ? "in" : "out"),
  "download-writing": ({ appRoot, session, data }) =>
    requestWritingAction(appRoot, session, data.format === "markdown" ? "markdown" : "text"),
  print: ({ appRoot, session }) => requestWritingAction(appRoot, session, "print"),
  "copy-outline": ({ appRoot, session }) => requestWritingAction(appRoot, session, "copy-outline"),
  "copy-mermaid": ({ appRoot, session }) => void copyOutput(appRoot, session.copyMermaid(), "Mermaid"),
  "keep-this-draft": ({ appRoot, session, view }) => {
    view.draft.setEnabled(true);
    rerender(appRoot, session);
  },
  "load-other-draft": async ({ appRoot, session, view }) => {
    const question = {
      title: "Load the other tab's draft?",
      message: "The board in this tab will be replaced. You can undo this replacement.",
      confirmLabel: "Load other draft",
    };
    if (session.hasTouchedContent() && !(await confirmAction(question))) return;
    if (view.draft.loadOther(() => true)) {
      resetWritingReview(view);
      rerender(appRoot, session);
    }
  },
  "focus-framing": ({ appRoot, data }) => appRoot.querySelector<HTMLElement>(`#${data.targetId}`)?.focus(),
  stage: ({ appRoot, session, data }) => {
    sendWriting(appRoot, { type: "leave" });
    const stage = data.stage as WorkflowStage;
    session.setStage(stage);
    renderAndFocus(appRoot, session, `stage-heading-${stage}`);
  },
  "add-fact": ({ appRoot, session, view }) => {
    const board = session.dispatch({ type: "create-gathered-fact" });
    view.facts.beginFact(board.gatheredFacts.at(-1)!.id);
    focusCanonicalFact(appRoot, session, board.gatheredFacts.at(-1)!.id);
  },
  "move-library-fact": ({ appRoot, session, data }) => {
    if (!data.factId) return;
    session.dispatch({ type: "move-gathered-fact", factId: data.factId, direction: direction(data) });
    focusCanonicalFact(appRoot, session, data.factId);
  },
  "another-fact-source": ({ appRoot, session, view, data: { factId } }) => {
    if (!factId || !session.snapshot().board.gatheredFacts.some((fact) => fact.id === factId)) return;
    const board = session.dispatch({ type: "reuse-fact-source", factId });
    view.facts.beginFact(board.gatheredFacts.at(-1)!.id);
    focusCanonicalFact(appRoot, session, board.gatheredFacts.at(-1)!.id);
  },
  "delete-fact": async ({ appRoot, session, data: { factId } }) => {
    if (factId) await deleteFact(appRoot, session, factId);
  },
  "add-argument": ({ appRoot, session }) => {
    const board = session.dispatch({ type: "add-supporting-argument" });
    renderAndFocus(appRoot, session, `argument-text-${safeDomId(board.supportingArguments.at(-1)!.id)}`);
  },
  "move-argument": ({ appRoot, session, data }) => {
    if (!data.argumentId) return;
    session.dispatch({ type: "move-supporting-argument", argumentId: data.argumentId, direction: direction(data) });
    renderAndFocus(appRoot, session, `argument-text-${safeDomId(data.argumentId)}`);
  },
  "duplicate-argument": ({ appRoot, session, data: { argumentId } }) => {
    if (!argumentId) return;
    const beforeIds = new Set(session.snapshot().board.supportingArguments.map(({ id }) => id));
    const board = session.dispatch({ type: "duplicate-supporting-argument", argumentId });
    const copy = board.supportingArguments.find(({ id }) => !beforeIds.has(id));
    renderAndFocus(appRoot, session, copy ? `argument-text-${safeDomId(copy.id)}` : undefined);
  },
  "delete-argument": ({ appRoot, session, data: { argumentId } }) => {
    if (!argumentId) return;
    const index = session.snapshot().board.supportingArguments.findIndex(({ id }) => id === argumentId);
    session.dispatch({ type: "delete-supporting-argument", argumentId });
    offerUndo(appRoot, session, `Supporting Argument ${index + 1} deleted.`, "deletion", `argument-text-${safeDomId(argumentId)}`);
    renderAndFocus(appRoot, session, "supporting-arguments");
  },
  "attach-fact": ({ appRoot, session, data: { factId, destinationId } }) => {
    if (!factId || !destinationId) return;
    session.dispatch({ type: "attach-fact", destinationId, factId });
    render(appRoot, session);
    document.getElementById(`attachment-picker-${safeDomId(destinationId)}`)?.focus();
  },
  "create-fact-here": ({ appRoot, session, view, data: { destinationId } }) => {
    if (!destinationId) return;
    const board = session.dispatch({ type: "create-gathered-fact", destinationId });
    const newFact = board.gatheredFacts.at(-1)!;
    view.facts.beginFact(newFact.id);
    view.disclosures.set(`destination-${destinationId}`, true);
    renderAndFocus(appRoot, session, `attached-${safeDomId(destinationId)}-${safeDomId(newFact.id)}-text`);
  },
  "focus-attached-fact": ({ data }) => document.getElementById(data.focusId ?? "")?.focus(),
  "open-fact": ({ appRoot, session, data: { factId } }) => {
    if (factId) focusCanonicalFact(appRoot, session, factId);
  },
  "move-attached-fact": ({ appRoot, session, data }) => {
    const { factId, destinationId } = data;
    if (!factId || !destinationId) return;
    session.dispatch({ type: "move-attached-fact", destinationId, factId, direction: direction(data) });
    renderAndFocus(appRoot, session, `attached-${safeDomId(destinationId)}-${safeDomId(factId)}-text`);
  },
  "detach-fact": ({ appRoot, session, data: { factId, destinationId } }) => {
    if (!factId || !destinationId) return;
    const label = destinationLabel(session.snapshot().board, destinationId);
    session.dispatch({ type: "detach-fact", destinationId, factId });
    offerUndo(appRoot, session, `Fact removed from ${label}.`, "removal", `attached-${safeDomId(destinationId)}-${safeDomId(factId)}-text`);
    renderAndFocus(appRoot, session, "stage-heading-construct");
  },
  "open-issue": ({ appRoot, session, data }) => openIssue(appRoot, session, data.targetId ?? ""),
  download: ({ session }) => downloadFile(session.exportFile()),
  clear: ({ appRoot, session }) => clearBoard(appRoot, session),
  undo: ({ appRoot, session }) => {
    session.undo();
    render(appRoot, session);
  },
  redo: ({ appRoot, session }) => {
    session.redo();
    render(appRoot, session);
  },
  "undo-notice": ({ appRoot, session, view }) => {
    const undo = view.notice?.undo;
    if (!undo || undo.board !== session.snapshot().board) return;
    session.undo();
    view.notice = { message: "Restored.", request: Symbol() };
    renderAndFocus(appRoot, session, undo.focusId);
  },
  "show-shortcuts": () => showShortcuts(keyboardShortcuts()),
  "accept-draft-suggestion": ({ appRoot, session, view }) => {
    view.draft.setEnabled(true);
    renderAndFocus(appRoot, session, "autosave");
  },
  "dismiss-draft-suggestion": ({ appRoot, session, view }) => {
    dismissDraftSuggestion(view);
    renderAndFocus(appRoot, session, "autosave");
  },
};

function handleAction(appRoot: HTMLDivElement, session: ArgumentBoardSession, action: string, data: ActionData = {}) {
  void actions[action]?.({ appRoot, session, view: views.get(appRoot)!, data });
}

function chooseWritingLabel({ appRoot, session }: ActionContext, label: "draft" | "reviewed") {
  const { perform } = sendWriting(appRoot, { type: "choose-label", label });
  if (!perform) return;
  render(appRoot, session);
  focusWritingMenu(appRoot);
  performWritingAction(appRoot, session, perform);
}

function resetWritingReview(view: ViewState) {
  view.writing.send({ type: "reset" });
  view.positions.reset();
}

/** Every Writing review transition goes through here, so leaving a stage always holds the author's place. */
function sendWriting(appRoot: HTMLDivElement, event: WritingGateEvent) {
  const view = views.get(appRoot)!;
  const outcome = view.writing.send(event);
  if (outcome.leftStage) view.positions.hold("review", "open-reasoning-review");
  return outcome;
}

function requestWritingAction(appRoot: HTMLDivElement, session: ArgumentBoardSession, action: WritingAction) {
  const { perform } = sendWriting(appRoot, { type: "request-export", action });
  if (perform) performWritingAction(appRoot, session, perform);
  else renderAndFocus(appRoot, session, "writing-invitation-heading");
}

function returnFromReview(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  const { positions } = views.get(appRoot)!;
  const position = positions.release("review");
  if (!position) {
    renderAndFocus(appRoot, session, "open-reasoning-review");
    return;
  }
  session.setStage(position.stage);
  render(appRoot, session);
  positions.restore(position, appRoot.querySelector<HTMLElement>("#open-reasoning-review"));
}

function performWritingAction(
  appRoot: HTMLDivElement,
  session: ArgumentBoardSession,
  { action, draft }: { action: WritingAction; draft: boolean },
) {
  if (action === "copy-outline") void copyOutput(appRoot, session.copyOutline({ draft }), "Outline");
  else if (action === "print") {
    appRoot.querySelector(".print-document")!.outerHTML = renderPrintDocument(session.snapshot().board, draft);
    window.print();
  } else downloadFile(session.exportWriting(action, { draft }));
}

function focusWritingMenu(appRoot: HTMLDivElement) {
  appRoot.querySelector<HTMLElement>("#writing-menu-toggle")?.focus();
}

async function copyOutput(appRoot: HTMLDivElement, contents: string, label: "Outline" | "Mermaid") {
  const view = views.get(appRoot)!;
  const request = Symbol();
  const update = (message: string) => setNotice(appRoot, { message, request });
  update(`Copying ${label.toLowerCase()}…`);
  try {
    await navigator.clipboard.writeText(contents);
    if (view.notice?.request === request) update(`${label} copied.`);
  } catch {
    if (view.notice?.request === request) update(`Could not copy ${label.toLowerCase()}. Try Copy ${label} again.`);
  }
}

async function deleteFact(appRoot: HTMLDivElement, session: ArgumentBoardSession, factId: string) {
  const impact = factDeletionImpact(session.snapshot().board, factId);
  if (!impact) return;
  const usage = new Intl.ListFormat("en").format(impact.usage);
  if (
    usage &&
    !(await confirmAction({
      title: "Delete this fact?",
      message: `It will be removed from ${usage}. You can undo this.`,
      confirmLabel: "Delete fact",
      danger: true,
    }))
  )
    return;

  const nextFocus = impact.nextFocusFactId;
  session.dispatch({ type: "delete-gathered-fact", factId });
  offerUndo(
    appRoot,
    session,
    usage ? `Fact deleted and removed from ${usage}.` : "Fact deleted.",
    "deletion",
    `fact-${safeDomId(factId)}-text`,
  );
  renderAndFocus(appRoot, session, nextFocus ? `fact-${safeDomId(nextFocus)}-text` : "add-fact");
}

function openIssue(appRoot: HTMLDivElement, session: ArgumentBoardSession, targetId: string) {
  sendWriting(appRoot, { type: "leave" });
  const board = session.snapshot().board;
  if (board.gatheredFacts.some((fact) => fact.id === targetId)) {
    focusCanonicalFact(appRoot, session, targetId);
    return;
  }

  session.setStage("construct");
  const focusId =
    targetId === "supporting-arguments"
      ? "supporting-arguments"
      : board.supportingArguments.some((argument) => argument.id === targetId)
        ? `argument-text-${safeDomId(targetId)}`
        : `scqa-${targetId}`;
  renderAndFocus(appRoot, session, focusId);
}

function focusCanonicalFact(appRoot: HTMLDivElement, session: ArgumentBoardSession, factId: string) {
  const view = views.get(appRoot)!;
  view.facts.resetSearch();
  session.setStage("gather");
  renderAndFocus(appRoot, session, `fact-${safeDomId(factId)}-text`);
}

function renderAndFocus(appRoot: HTMLDivElement, session: ArgumentBoardSession, focusId?: string) {
  render(appRoot, session);
  views.get(appRoot)!.positions.focus(focusId);
}

function rerender(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  views.get(appRoot)!.positions.rerender(() => render(appRoot, session));
}

function downloadFile(file: { contents: string; mimeType: string; name: string }) {
  const blob = new Blob([file.contents], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function openBoardFile(appRoot: HTMLDivElement, session: ArgumentBoardSession, file: File) {
  const result = await replaceBoard(session, await file.text(), {
    title: "Replace this board?",
    message: "Download it first if you want to keep it. You can undo this replacement.",
    confirmLabel: "Open board",
  });
  if (!result) {
    return;
  }

  if (!result.ok) {
    setNotice(appRoot, { message: `Could not open ${file.name}. ${result.message}`, request: Symbol(), tone: "error" });
    return;
  }

  resetWritingReview(views.get(appRoot)!);
  session.setStage("gather");
  renderAndFocus(appRoot, session, "stage-heading-gather");
}

async function clearBoard(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  if (
    session.hasTouchedContent() &&
    !(await confirmAction({
      title: "Clear this board?",
      message: "Download it first if you want to keep it. You can undo clearing.",
      confirmLabel: "Clear board",
      danger: true,
    }))
  ) {
    return;
  }

  session.clear();
  resetWritingReview(views.get(appRoot)!);
  offerUndo(appRoot, session, "Board cleared.", "clearing", "board-title");
  views.get(appRoot)!.disclosures.set("readiness", false);
  const checklist = appRoot.querySelector<HTMLDetailsElement>('details[data-disclosure="readiness"]');
  if (checklist) checklist.open = false;
  session.setStage("construct");
  renderAndFocus(appRoot, session, "stage-heading-construct");
}

const workflowStages: Array<{ id: WorkflowStage; label: string }> = [
  { id: "construct", label: "Construct Argument" },
  { id: "gather", label: "Gather Facts" },
  { id: "preview", label: "Preview" },
];

export function stageForShortcut(digit: number): WorkflowStage | undefined {
  return workflowStages[digit - 1]?.id;
}

function keyboardShortcuts(): Array<[keys: string, description: string]> {
  const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
  return [
    [`${mod}+S`, "Download editable board"],
    [`${mod}+Z`, "Undo board change (outside text fields)"],
    [`${mod}+Shift+Z|Ctrl+Y`, "Redo board change (outside text fields)"],
    ...workflowStages.map(({ label }, index): [string, string] => [`Alt+${index + 1}`, `Go to ${label}`]),
    ["←|→|Home|End", "Move between workflow tabs"],
    ["Esc", "Close a menu, fact picker, or dialog"],
    ["?", "Show keyboard shortcuts"],
  ];
}

function syncDocumentTitle(board: ArgumentBoard) {
  const title = board.title.trim();
  document.title = title ? `${title} · Argument Maker` : "Argument Maker";
}

async function replaceBoard(session: ArgumentBoardSession, contents: string, question: ConfirmOptions) {
  const parsed = parseExportFile(contents);
  if (!parsed.ok) return parsed;
  if (session.hasTouchedContent() && !(await confirmAction(question))) return undefined;
  return session.importFile(contents, () => true);
}

/** An undo offer is only valid while the board is exactly as the deletion left it. */
function currentNotice(view: ViewState, board: ArgumentBoard): Notice | undefined {
  if (view.notice?.undo && view.notice.undo.board !== board) view.notice = undefined;
  return view.notice;
}

function renderNotice(view: ViewState, board: ArgumentBoard): string {
  const notice = currentNotice(view, board);
  const undo = notice?.undo
    ? `<button type="button" id="notice-undo" data-action="undo-notice">Undo<span class="sr-only"> ${escapeHtml(notice.undo.label)}</span></button>`
    : "";
  return `<span>${escapeHtml(notice?.message ?? "")}</span>${undo}`;
}

function noticeClass(view: ViewState, board: ArgumentBoard): string {
  return currentNotice(view, board)?.tone === "error" ? "notice notice-error" : "notice";
}

function syncNotice(appRoot: HTMLDivElement, board: ArgumentBoard) {
  const region = appRoot.querySelector<HTMLElement>(".notice");
  if (!region) return;
  const view = views.get(appRoot)!;
  const markup = renderNotice(view, board);
  region.className = noticeClass(view, board);
  // Leave unchanged content alone so a focused Undo button keeps focus.
  if (region.innerHTML !== markup) region.innerHTML = markup;
}

function setNotice(appRoot: HTMLDivElement, notice: Notice) {
  const view = views.get(appRoot)!;
  view.notice = notice;
  syncNotice(appRoot, view.draft.session.snapshot().board);
}

function offerUndo(appRoot: HTMLDivElement, session: ArgumentBoardSession, message: string, label: string, focusId: string) {
  views.get(appRoot)!.notice = { message, request: Symbol(), undo: { board: session.snapshot().board, focusId, label } };
}

function renderIconButton(options: IconButtonOptions): string {
  const classes = ["icon-button", options.active ? "active" : "", options.danger ? "danger" : ""].filter(Boolean).join(" ");
  return `
    <button
      type="button"
      class="${classes}"
      data-action="${options.action}"
      aria-label="${escapeAttr(options.label)}"
      title="${escapeAttr(options.label)}"
      data-tooltip="${escapeAttr(options.label)}"
      ${options.attrs ?? ""}
      ${options.disabled ? "disabled" : ""}
    >
      ${renderIcon(options.icon)}<span class="tool-label">${escapeHtml(options.label)}</span>
    </button>
  `;
}

function renderIcon(icon: IconName): string {
  const paths: Record<IconName, string> = {
    copy: '<rect x="8" y="8" width="10" height="10" rx="1.5"></rect><path d="M6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>',
    download: '<path d="M12 3v10"></path><path d="m8 9 4 4 4-4"></path><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path>',
    upload: '<path d="M12 21V11"></path><path d="m8 15 4-4 4 4"></path><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"></path>',
    undo: '<path d="M9 14 4 9l5-5"></path><path d="M4 9h10a6 6 0 0 1 0 12h-2"></path>',
    redo: '<path d="m15 14 5-5-5-5"></path><path d="M20 9H10a6 6 0 0 0 0 12h2"></path>',
    trash:
      '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>',
    up: '<path d="m6 15 6-6 6 6"></path>',
    down: '<path d="m6 9 6 6 6-6"></path>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>',
    eyeOff:
      '<path d="m3 3 18 18"></path><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"></path><path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.9 17.9 0 0 1-3.1 4.1"></path><path d="M6.6 6.6C3.7 8.3 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.1-.8"></path>',
  };

  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[icon]}</svg>`;
}

function renderCommandButton(control: CommandDeskActionControl, attrs?: string): string {
  return renderIconButton({ ...control, attrs });
}

/** Update the regions that summarize the board while an editor inside them keeps focus. */
function refreshEditingState(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  const { board, issues } = session.snapshot();
  syncDocumentTitle(board);
  syncNotice(appRoot, board);
  for (const section of ["context", "planning"] as const) {
    replaceRegion(appRoot.querySelector(`[data-framing-summary="${section}"]`), renderFramingSummary(board, section));
  }
  for (const outline of appRoot.querySelectorAll(".construction-outline-content")) replaceRegion(outline, renderStartingOutline(board));
  replaceRegion(appRoot.querySelector(".starting-guidance"), renderStartingGuidance(board));
  replaceRegion(appRoot.querySelector(".checklist"), renderChecklistContent(issues));
  for (const field of ["question", "answer", "situation", "complication"] as const) {
    const message = appRoot.querySelector<HTMLElement>(`#scqa-${field}-guidance`);
    if (message) {
      message.textContent = narrativeGuidance(board, field);
      message.hidden = !message.textContent;
    }
  }
}
