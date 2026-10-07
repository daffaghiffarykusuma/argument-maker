import {
  factUsageLabels,
  type ArgumentBoard,
  type SupportMode,
} from "../board/argument-board";
import { type ArgumentBoardSession, type WorkflowStage } from "../board/argument-board-session";

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
  download: { action: "download", label: "Download Board", icon: "download" },
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

import { createExampleBoard } from "../board/example-board";
import { createWritingExport } from "../board/writing-export";
import { views, type ViewState, type WritingAction } from "./board-view-state";
import { mountBoardControls, renderDraftControls, renderPreservingFocus } from "./board-controls";
import { renderReasoningPrompts, renderCompactOutline, renderPrintDocument } from "./enhancement-view";
import { escapeHtml, escapeAttr, safeDomId } from "./html";
import type { GatheredFactEditing } from "./gathered-fact-editing";
import { renderReasoningReview, renderWritingInvitation } from "./reasoning-review";

export function mountArgumentBoardApp(appRoot: HTMLDivElement, initialSession?: ArgumentBoardSession) {
  const session = mountBoardControls(appRoot, initialSession, { render, change: handleChange, action: handleAction, upload: handleUpload, refresh: refreshEditingState });
  render(appRoot, session);
}

function render(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  const view = views.get(appRoot)!;
  for (const details of appRoot.querySelectorAll<HTMLDetailsElement>('details[data-disclosure]')) view.disclosures.set(details.dataset.disclosure!, details.open);
  view.draft.flush();
  const snapshot = session.snapshot();

  appRoot.innerHTML = `
    <main class="app-shell">
      ${renderCommandRail(snapshot.canUndo, snapshot.canRedo)}
      <div class="desk-main">
        ${renderTopbar(snapshot.board)}
        <div class="draft-controls">${renderDraftControls(view)}</div>
        ${renderStageNavigation(snapshot.stage)}
        <div class="review-entry"><button id="open-reasoning-review" type="button" data-action="open-review" aria-expanded="${!!view.reviewOpen}">Reasoning review</button>${view.writingMode ? `<button type="button" data-action="toggle-draft-label" aria-pressed="${view.writingMode === "draft"}">Label writing exports as Draft</button>` : ""}</div>
        ${view.writingInvitationOpen ? renderWritingInvitation() : view.reviewOpen ? renderReasoningReview(snapshot.board, snapshot.issues, !!view.pendingWriting) : renderStage(snapshot.board, snapshot.stage, snapshot.issues, view)}
        ${renderPrintDocument(snapshot.board, view.writingMode !== "reviewed")}
      </div>
      <div class="copy-feedback" role="status" aria-label="Copy feedback" aria-live="polite" aria-atomic="true"><span>${escapeHtml(view.copyFeedback?.message ?? "")}</span></div>
    </main>
  `;

  for (const details of appRoot.querySelectorAll<HTMLDetailsElement>('details[data-disclosure]')) {
    if (view.disclosures.has(details.dataset.disclosure!)) details.open = view.disclosures.get(details.dataset.disclosure!)!;
  }
  void view.preview.sync();
}

function renderCommandRail(canUndo: boolean, canRedo: boolean): string {
  return `
    <aside class="command-rail" aria-label="Board tools">
      <div class="brand"><div class="mark" aria-hidden="true">a.</div><span>Argument<br>Maker</span></div>
      <div class="rail-actions">
        ${renderCommandButton(commandDeskActions.copyOutline)}
        ${renderCommandButton(commandDeskActions.download)}
        <label class="icon-button file-button" aria-label="${commandDeskActions.upload.label}" title="${commandDeskActions.upload.label}" data-tooltip="${commandDeskActions.upload.label}" tabindex="0">
          ${renderIcon(commandDeskActions.upload.icon)}<span class="tool-label">Upload Board</span>
          <input type="file" tabindex="-1" accept=".json,.argument.json,application/json" data-action="upload" />
        </label>
        ${renderCommandButton({ ...commandDeskActions.undo, disabled: !canUndo })}
        ${renderCommandButton({ ...commandDeskActions.redo, disabled: !canRedo })}
        ${renderCommandButton(commandDeskActions.clear)}
      </div>
      <div class="rail-note"><span class="local-dot"></span> Private by design<p>Local drafts are optional.<br>Download a board for a backup.</p></div>
    </aside>
  `;
}

function renderTopbar(board: ArgumentBoard): string {
  const usedCount = board.gatheredFacts.filter((fact) => factUsageLabels(board, fact.id).length > 0).length;

  return `
    <header class="topbar" aria-label="Argument board status">
      <div class="title-group">
        <input id="board-title" class="title-input" aria-label="Board title" value="${escapeAttr(board.title)}" placeholder="A good argument starts here." data-action="title" />
      </div>
      <div class="desk-status">
        <div><strong>${String(board.gatheredFacts.length).padStart(2, "0")}</strong><span>facts gathered</span></div><div><strong>${String(usedCount).padStart(2, "0")}</strong><span>in your argument</span></div>
      </div>
    </header>
  `;
}

function renderStageNavigation(stage: WorkflowStage): string {
  const stages: Array<{ id: WorkflowStage; label: string }> = [
    { id: "construct", label: "Construct Argument" },
    { id: "gather", label: "Gather Facts" },
    { id: "preview", label: "Preview" },
  ];

  return `
    <nav class="stage-tabs" role="tablist" aria-label="Argument workflow stages">
      ${stages
        .map(
          ({ id, label }, index) => `
            <button
              type="button"
              role="tab"
              aria-selected="${stage === id}"
              id="stage-tab-${id}"
              tabindex="${stage === id ? 0 : -1}"
              aria-controls="stage-panel-${id}"
              data-action="stage"
              data-stage="${id}"
              class="${stage === id ? "active" : ""}"
            ><span class="step-number">0${index + 1}</span><span>${label}</span><b aria-hidden="true">${stage === id ? "&#8599;" : "&#8594;"}</b></button>
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
      </div>
      <div class="starting-guidance">${renderStartingGuidance(board)}</div>
      ${renderChecklist(issues)}
      <div class="construction-layout"><div class="construction-editor">
      <section class="scqa-grid" aria-label="Argument frame">
        ${renderTextPanel(board, "question", "What question must this answer?", "Question", facts)}
        ${renderTextPanel(board, "answer", "What is your tentative claim or main answer?", "Answer", facts)}
        ${renderTextPanel(board, "situation", "What is happening?", "Situation", facts)}
        ${renderTextPanel(board, "complication", "What changed or makes this matter?", "Complication", facts)}
      </section>
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
    </section>
  `;
}

function renderStartingGuidance(board: ArgumentBoard): string {
  if (!board.scqa.question.text.trim() && !board.scqa.answer.text.trim()) {
    return `<p>Start with a question or a tentative claim. You can revise either as you learn and use any workspace tab at any time.</p><button type="button" data-action="focus-framing" data-target-id="scqa-question">Start with a question</button> <button type="button" data-action="focus-framing" data-target-id="scqa-answer">Start with a tentative claim</button>`;
  }
  if (board.gatheredFacts.length === 0) {
    return `<p>Find material that supports or challenges your idea. You can also keep developing your reasoning here.</p><button type="button" data-action="stage" data-stage="gather">Gather supporting material</button>`;
  }
  if (!board.supportingArguments.some(argument => argument.text.trim())) {
    return `<p>Explain how your supporting material leads to your Answer.</p><button type="button" data-action="focus-framing" data-target-id="supporting-arguments">Develop a supporting reason</button>`;
  }
  return `<p>Read your argument as a whole and look for gaps in its reasoning.</p><button type="button" data-action="stage" data-stage="preview">Preview your argument</button>`;
}

function renderStartingOutline(board: ArgumentBoard): string {
  return Object.values(board.scqa).some(slot => slot.text.trim()) || board.supportingArguments.some(argument => argument.text.trim())
    ? renderCompactOutline(board)
    : "<p>Your outline will take shape as you write.</p>";
}

function narrativeGuidance(board: ArgumentBoard, field: keyof ArgumentBoard["scqa"]): string {
  if (!board.scqa[field].touched || board.scqa[field].text.trim()) return "";
  return {
    question: "Add the question you want your argument to answer.",
    answer: "Add a tentative claim or main answer when you are ready.",
    situation: "Describe the context your reader needs.",
    complication: "Explain what changed or makes this matter.",
  }[field];
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
  const classes = ["panel", field === "answer" ? "answer-panel" : "", destinationId ? "evidence-panel" : ""]
    .filter(Boolean)
    .join(" ");

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

function renderArgument(board: ArgumentBoard, argument: ArgumentBoard["supportingArguments"][number], index: number, facts: GatheredFactEditing): string {
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
      <label><input id="mode-${safeId}-reasoning" type="radio" name="mode-${safeId}" data-action="mode-change" data-argument-id="${escapeAttr(argumentId)}" value="reasoning" ${mode === "reasoning" ? "checked" : ""} /> Reasoning</label>
      <label><input id="mode-${safeId}-evidence" type="radio" name="mode-${safeId}" data-action="mode-change" data-argument-id="${escapeAttr(argumentId)}" value="evidence-backed" ${mode === "evidence-backed" ? "checked" : ""} /> Evidence-backed</label>
    </fieldset>
  `;
}

function renderChecklist(issues: ReturnType<ArgumentBoardSession["snapshot"]>["issues"]): string {
  return `
    <aside class="checklist" aria-label="Review checklist">
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
    </aside>
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
  } else if (action === "attach-fact" && target instanceof HTMLSelectElement && target.value) {
    dispatch({
      type: "attach-fact",
      destinationId: target.dataset.destinationId ?? "",
      factId: target.value,
    });
  } else if (action === "reasoning-note" && argumentId) {
    const field = target.dataset.field as "connection" | "assumptions" | "objection" | "weakensClaim";
    dispatch({ type: "update-supporting-argument", argumentId, changes: { [field]: target.value } });
  } else {
    return;
  }

  if (refresh) renderPreservingFocus(appRoot, session, render);
}

function handleAction(appRoot: HTMLDivElement, session: ArgumentBoardSession, target: HTMLElement) {
  const action = target.dataset.action;
  const factId = target.dataset.factId;
  const argumentId = target.dataset.argumentId;
  const destinationId = target.dataset.destinationId;
  const direction = target.dataset.direction === "up" ? "up" : "down";

  const view = views.get(appRoot)!;
  if (action === "open-review") {
    view.writingInvitationOpen = false;
    view.reviewOpen = true;
    renderAndFocus(appRoot, session, "reasoning-review-heading");
  } else if (action === "close-review") {
    view.reviewOpen = false;
    view.pendingWriting = undefined;
    renderAndFocus(appRoot, session, "open-reasoning-review");
  } else if (action === "review-writing") {
    view.writingMode = "reviewed";
    view.writingInvitationOpen = false;
    view.reviewOpen = true;
    renderAndFocus(appRoot, session, "reasoning-review-heading");
  } else if (action === "export-draft" || action === "continue-writing") {
    const output = view.pendingWriting;
    if (!output) return;
    view.writingMode = action === "export-draft" ? "draft" : "reviewed";
    view.writingInvitationOpen = false;
    view.reviewOpen = false;
    view.pendingWriting = undefined;
    render(appRoot, session);
    focusWritingAction(appRoot, output);
    performWritingAction(appRoot, session, output);
  } else if (action === "cancel-writing") {
    const output = view.pendingWriting;
    view.writingInvitationOpen = false;
    view.pendingWriting = undefined;
    render(appRoot, session);
    if (output) focusWritingAction(appRoot, output);
  } else if (action === "toggle-draft-label") {
    view.writingMode = view.writingMode === "draft" ? "reviewed" : "draft";
    renderPreservingFocus(appRoot, session, render);
  } else if (action === "load-example") {
    const result = session.importFile(JSON.stringify(createExampleBoard()), () => confirm("Replace this board with the worked example? You can undo this."));
    if (result?.ok) { resetWritingReview(view); view.facts.resetSearch(); session.setStage("construct"); renderAndFocus(appRoot, session, "stage-heading-construct"); }
  } else if (action === "preview-mode") {
    view.preview.setMode(target.dataset.mode === "outline" ? "outline" : "diagram");
    renderPreservingFocus(appRoot, session, render);
  } else if (action === "zoom") {
    view.preview.zoom(target.dataset.zoom === "fit" ? "fit" : target.dataset.zoom === "in" ? "in" : "out");
  } else if (action === "download-writing") {
    requestWritingAction(appRoot, session, target.dataset.format as "markdown" | "text");
  } else if (action === "print") {
    requestWritingAction(appRoot, session, "print");
  } else if (action === "keep-this-draft") {
    view.draft.setEnabled(true);
    renderPreservingFocus(appRoot, session, render);
  } else if (action === "load-other-draft") {
    if (view.draft.loadOther(() => confirm("Load the other tab's draft? You can undo this replacement."))) {
      resetWritingReview(view);
      renderPreservingFocus(appRoot, session, render);
    }
  } else if (action === "focus-framing") {
    appRoot.querySelector<HTMLElement>(`#${target.dataset.targetId}`)?.focus();
  } else if (action === "stage") {
    view.reviewOpen = false;
    view.writingInvitationOpen = false;
    const stage = target.dataset.stage as WorkflowStage;
    session.setStage(stage);
    renderAndFocus(appRoot, session, `stage-heading-${stage}`);
  } else if (action === "add-fact") {
    const board = session.dispatch({ type: "create-gathered-fact" });
    focusCanonicalFact(appRoot, session, board.gatheredFacts.at(-1)!.id);
  } else if (action === "move-library-fact" && factId) {
    session.dispatch({ type: "move-gathered-fact", factId, direction });
    focusCanonicalFact(appRoot, session, factId);
  } else if (action === "another-fact-source" && factId) {
    const source = session.snapshot().board.gatheredFacts.find((fact) => fact.id === factId);
    if (!source) return;
    const board = session.dispatch({ type: "create-gathered-fact", evidenceLink: source.evidenceLink });
    focusCanonicalFact(appRoot, session, board.gatheredFacts.at(-1)!.id);
  } else if (action === "delete-fact" && factId) {
    deleteFact(appRoot, session, factId);
  } else if (action === "add-argument") {
    const board = session.dispatch({ type: "add-supporting-argument" });
    renderAndFocus(appRoot, session, `argument-text-${safeDomId(board.supportingArguments.at(-1)!.id)}`);
  } else if (action === "move-argument" && argumentId) {
    session.dispatch({ type: "move-supporting-argument", argumentId, direction });
    renderAndFocus(appRoot, session, `argument-text-${safeDomId(argumentId)}`);
  } else if (action === "duplicate-argument" && argumentId) {
    const beforeIds = new Set(session.snapshot().board.supportingArguments.map(({ id }) => id));
    const board = session.dispatch({ type: "duplicate-supporting-argument", argumentId });
    const copy = board.supportingArguments.find(({ id }) => !beforeIds.has(id));
    renderAndFocus(appRoot, session, copy ? `argument-text-${safeDomId(copy.id)}` : undefined);
  } else if (action === "delete-argument" && argumentId) {
    session.dispatch({ type: "delete-supporting-argument", argumentId });
    renderAndFocus(appRoot, session, "supporting-arguments");
  } else if (action === "create-fact-here" && destinationId) {
    const board = session.dispatch({ type: "create-gathered-fact", destinationId });
    const newFact = board.gatheredFacts.at(-1)!;
    view.disclosures.set(`destination-${destinationId}`, true);
    renderAndFocus(appRoot, session, `attached-${safeDomId(destinationId)}-${safeDomId(newFact.id)}-text`);
  } else if (action === "focus-attached-fact") {
    document.getElementById(target.dataset.focusId ?? "")?.focus();
  } else if (action === "open-fact" && factId) {
    focusCanonicalFact(appRoot, session, factId);
  } else if (action === "move-attached-fact" && factId && destinationId) {
    session.dispatch({ type: "move-attached-fact", destinationId, factId, direction });
    renderAndFocus(appRoot, session, `attached-${safeDomId(destinationId)}-${safeDomId(factId)}-text`);
  } else if (action === "detach-fact" && factId && destinationId) {
    session.dispatch({ type: "detach-fact", destinationId, factId });
    renderAndFocus(appRoot, session, `stage-heading-construct`);
  } else if (action === "open-issue") {
    openIssue(appRoot, session, target.dataset.targetId ?? "");
  } else if (action === "copy-outline") {
    requestWritingAction(appRoot, session, "copy-outline");
  } else if (action === "copy-mermaid") {
    void copyOutput(appRoot, session.copyMermaid(), "Mermaid");
  } else if (action === "download") {
    downloadBoard(session);
  } else if (action === "clear") {
    clearBoard(appRoot, session);
  } else if (action === "undo") {
    session.undo();
    render(appRoot, session);
  } else if (action === "redo") {
    session.redo();
    render(appRoot, session);
  }
}

function resetWritingReview(view: ViewState) {
  view.writingMode = undefined;
  view.writingInvitationOpen = false;
  view.pendingWriting = undefined;
  view.reviewOpen = false;
}

function requestWritingAction(appRoot: HTMLDivElement, session: ArgumentBoardSession, action: WritingAction) {
  const view = views.get(appRoot)!;
  if (view.writingMode) {
    performWritingAction(appRoot, session, action);
    return;
  }
  view.pendingWriting = action;
  view.writingInvitationOpen = true;
  view.reviewOpen = false;
  renderAndFocus(appRoot, session, "writing-invitation-heading");
}

function performWritingAction(appRoot: HTMLDivElement, session: ArgumentBoardSession, action: WritingAction) {
  const draft = views.get(appRoot)!.writingMode === "draft";
  if (action === "copy-outline") void copyOutput(appRoot, session.copyOutline({ draft }), "Outline");
  else if (action === "print") {
    appRoot.querySelector(".print-document")!.outerHTML = renderPrintDocument(session.snapshot().board, draft);
    window.print();
  } else downloadFile(createWritingExport(session.snapshot().board, action, { draft }));
}

function focusWritingAction(appRoot: HTMLDivElement, action: WritingAction) {
  const selector = action === "markdown" || action === "text" ? `[data-action="download-writing"][data-format="${action}"]` : `[data-action="${action}"]`;
  (appRoot.querySelector<HTMLElement>(selector) ?? appRoot.querySelector<HTMLElement>("#open-reasoning-review"))?.focus();
}

async function copyOutput(appRoot: HTMLDivElement, contents: string, label: "Outline" | "Mermaid") {
  const view = views.get(appRoot)!;
  const request = Symbol();
  const update = (message: string) => {
    view.copyFeedback = { message, request };
    const status = appRoot.querySelector(".copy-feedback span");
    if (status) status.textContent = message;
  };
  update(`Copying ${label.toLowerCase()}…`);
  try {
    await navigator.clipboard.writeText(contents);
    if (view.copyFeedback?.request === request) update(`${label} copied.`);
  } catch {
    if (view.copyFeedback?.request === request) update(`Could not copy ${label.toLowerCase()}. Try Copy ${label} again.`);
  }
}

function deleteFact(appRoot: HTMLDivElement, session: ArgumentBoardSession, factId: string) {
  const board = session.snapshot().board;
  const index = board.gatheredFacts.findIndex((fact) => fact.id === factId);
  if (index < 0) return;

  const usage = factUsageLabels(board, factId);
  if (
    usage.length > 0 &&
    !confirm(`Delete this fact? It will be removed from ${new Intl.ListFormat("en").format(usage)}.`)
  ) {
    return;
  }

  const nextFocus = board.gatheredFacts[index + 1]?.id ?? board.gatheredFacts[index - 1]?.id;
  session.dispatch({ type: "delete-gathered-fact", factId });
  renderAndFocus(appRoot, session, nextFocus ? `fact-${safeDomId(nextFocus)}-text` : "add-fact");
}

function openIssue(appRoot: HTMLDivElement, session: ArgumentBoardSession, targetId: string) {
  views.get(appRoot)!.reviewOpen = false;
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
  const view = views.get(appRoot)!; view.facts.resetSearch();
  session.setStage("gather");
  renderAndFocus(appRoot, session, `fact-${safeDomId(factId)}-text`);
}

function renderAndFocus(appRoot: HTMLDivElement, session: ArgumentBoardSession, focusId?: string) {
  render(appRoot, session);
  if (focusId) {
    const target = document.getElementById(focusId);
    let ancestor = target?.parentElement;
    while (ancestor) {
      if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
      ancestor = ancestor.parentElement;
    }
    target?.focus();
  }
}

function downloadBoard(session: ArgumentBoardSession) {
  downloadFile(session.exportFile());
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

async function handleUpload(appRoot: HTMLDivElement, session: ArgumentBoardSession, input: HTMLInputElement) {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  const result = session.importFile(
    await file.text(),
    () => confirm("Replace this board? Download it first if you want to keep it."),
  );
  if (!result) {
    return;
  }

  if (!result.ok) {
    alert(result.message);
    return;
  }

  resetWritingReview(views.get(appRoot)!);
  session.setStage("gather");
  renderAndFocus(appRoot, session, "stage-heading-gather");
}

function clearBoard(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  if (session.hasTouchedContent() && !confirm("Clear this board? Download it first if you want to keep it.")) {
    return;
  }

  session.clear();
  resetWritingReview(views.get(appRoot)!);
  views.get(appRoot)!.disclosures.set("readiness", false);
  const checklist = appRoot.querySelector<HTMLDetailsElement>('details[data-disclosure="readiness"]');
  if (checklist) checklist.open = false;
  session.setStage("construct");
  renderAndFocus(appRoot, session, "stage-heading-construct");
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
    trash: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>',
    up: '<path d="m6 15 6-6 6 6"></path>',
    down: '<path d="m6 9 6 6 6-6"></path>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>',
    eyeOff: '<path d="m3 3 18 18"></path><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"></path><path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.9 17.9 0 0 1-3.1 4.1"></path><path d="M6.6 6.6C3.7 8.3 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.1-.8"></path>',
  };

  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[icon]}</svg>`;
}

function renderCommandButton(control: CommandDeskActionControl, attrs?: string): string {
  return renderIconButton({ ...control, attrs });
}

function refreshEditingState(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  const snapshot = session.snapshot();
  const board = snapshot.board;
  const outline = appRoot.querySelector(".construction-outline-content");
  if (outline) outline.innerHTML = renderStartingOutline(board);
  const guidance = appRoot.querySelector(".starting-guidance");
  if (guidance) guidance.innerHTML = renderStartingGuidance(board);
  for (const field of ["question", "answer", "situation", "complication"] as const) {
    const message = appRoot.querySelector<HTMLElement>(`#scqa-${field}-guidance`);
    if (message) {
      message.textContent = narrativeGuidance(board, field);
      message.hidden = !message.textContent;
    }
  }
  const checklist = appRoot.querySelector(".checklist");
  if (checklist) {
    const template = document.createElement("template");
    template.innerHTML = renderChecklist(snapshot.issues);
    const message = checklist.querySelector("p");
    const list = checklist.querySelector("ul");
    const summary = checklist.querySelector("summary");
    if (message) message.textContent = template.content.querySelector("p")!.textContent;
    if (list) list.innerHTML = template.content.querySelector("ul")!.innerHTML;
    if (summary) summary.textContent = template.content.querySelector("summary")!.textContent;
  }
}
