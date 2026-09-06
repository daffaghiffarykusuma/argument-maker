import {
  factCompleteness,
  factUsageLabels,
  isGatheredFactComplete,
  readFactAttachments,
  type ArgumentBoard,
  type DataType,
  type FactDestinationId,
  type GatheredFact,
  type SupportMode,
} from "./argument-board";
import { createArgumentBoardSession, type ArgumentBoardSession, type WorkflowStage } from "./argument-board-session";
import { projectArgumentPreview, type ArgumentPreviewFact } from "./argument-preview-projection";

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

let renderVersion = 0;
let mermaidPromise: Promise<typeof import("mermaid")["default"]> | undefined;

export function mountArgumentBoardApp(appRoot: HTMLDivElement, session = createArgumentBoardSession()) {
  window.addEventListener("beforeunload", (event) => {
    if (session.hasTouchedContent()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  appRoot.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "file") {
      void handleUpload(appRoot, session, target);
      return;
    }

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      handleChange(appRoot, session, target);
    }
  });

  appRoot.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (target) {
      handleAction(appRoot, session, target);
    }
  });

  render(appRoot, session);
}

function render(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  renderVersion += 1;
  const currentRender = renderVersion;
  const snapshot = session.snapshot();
  const preview = snapshot.stage === "preview" ? projectArgumentPreview(snapshot.board) : undefined;

  appRoot.innerHTML = `
    <main class="app-shell">
      ${renderCommandRail(snapshot.canUndo, snapshot.canRedo)}
      <div class="desk-main">
        ${renderTopbar(snapshot.board)}
        ${renderStageNavigation(snapshot.stage)}
        ${renderStage(snapshot.board, snapshot.stage, snapshot.issues, preview)}
      </div>
    </main>
  `;

  if (preview) {
    void renderMermaidPreview(appRoot, preview.mermaid, currentRender);
  }
}

function renderCommandRail(canUndo: boolean, canRedo: boolean): string {
  return `
    <aside class="command-rail" aria-label="Board tools">
      <div class="brand"><div class="mark" aria-hidden="true">a.</div><span>Argument<br>Maker<span class="brand-caption">A studio for clear thinking</span></span></div>
      <p class="rail-label">YOUR WORKSPACE</p><div class="rail-actions">
        ${renderCommandButton(commandDeskActions.copyOutline)}
        ${renderCommandButton(commandDeskActions.download)}
        <label class="icon-button file-button" aria-label="${commandDeskActions.upload.label}" title="${commandDeskActions.upload.label}" data-tooltip="${commandDeskActions.upload.label}" tabindex="0">
          ${renderIcon(commandDeskActions.upload.icon)}<span class="tool-label">Upload Board</span>
          <input type="file" accept=".json,.argument.json,application/json" data-action="upload" />
        </label>
        ${renderCommandButton({ ...commandDeskActions.undo, disabled: !canUndo })}
        ${renderCommandButton({ ...commandDeskActions.redo, disabled: !canRedo })}
        ${renderCommandButton(commandDeskActions.clear)}
      </div>
      <div class="rail-note"><span class="local-dot"></span> Private by design<p>Your ideas stay in this tab.<br>Download your board to keep it.</p></div>
    </aside>
  `;
}

function renderTopbar(board: ArgumentBoard): string {
  const usedCount = board.gatheredFacts.filter((fact) => factUsageLabels(board, fact.id).length > 0).length;

  return `
    <header class="topbar" aria-label="Argument board status">
      <div class="title-group">
        <p class="eyebrow">THE THINKING STUDIO <span class="edition">/ YOUR ARGUMENT BOARD</span></p>
        <input id="board-title" class="title-input" aria-label="Board title" value="${escapeAttr(board.title)}" placeholder="A good argument starts here." data-action="title" />
        <p class="subtitle">Make sense of your research. Build a case worth making.</p>
      </div>
      <div class="desk-status">
        <div><strong>${String(board.gatheredFacts.length).padStart(2, "0")}</strong><span>facts gathered</span></div><div><strong>${String(usedCount).padStart(2, "0")}</strong><span>in your argument</span></div>
      </div>
    </header>
  `;
}

function renderStageNavigation(stage: WorkflowStage): string {
  const stages: Array<{ id: WorkflowStage; label: string }> = [
    { id: "gather", label: "Gather Facts" },
    { id: "construct", label: "Construct Argument" },
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
              aria-controls="stage-panel-${id}"
              data-action="stage"
              data-stage="${id}"
              class="${stage === id ? "active" : ""}"
            ><span class="step-number">0${index + 1}</span><span>${label}<small>${["Collect the evidence", "Connect your thinking", "See the whole picture"][index]}</small></span><b aria-hidden="true">${stage === id ? "&#8599;" : "&#8594;"}</b></button>
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
  preview: ReturnType<typeof projectArgumentPreview> | undefined,
): string {
  if (stage === "gather") {
    return renderGatherStage(board);
  }

  if (stage === "construct") {
    return renderConstructStage(board, issues);
  }

  return renderPreviewStage(preview ?? projectArgumentPreview(board));
}

function renderGatherStage(board: ArgumentBoard): string {
  return `
    <section id="stage-panel-gather" class="workflow-stage" role="tabpanel" aria-labelledby="stage-heading-gather">
      <div class="section-heading">
        <div>
          <p class="eyebrow">01 / THE RESEARCH</p>
          <h2 id="stage-heading-gather" tabindex="-1">Gather Facts</h2>
          <span>Every strong argument begins with something you can point to.</span>
        </div>
        <button id="add-fact" type="button" data-action="add-fact">+ Add fact</button>
      </div>
      <p class="verification-note">Link format checked; source quality and factual accuracy are not verified.</p>
      <div class="research-layout"><div class="fact-library">
        ${
          board.gatheredFacts.length === 0
            ? `<div class="empty-state"><div class="paper-stack" aria-hidden="true"><div class="paper-back"></div><div class="paper-front"><span>FIELD NOTE / 001</span><i></i><i></i><i></i><b>Every idea needs<br>a starting point.</b></div><span class="paper-seal">&#10035;</span></div><h3>A little evidence.<br>A world of possibility.</h3><p>Collect a finding, an observation, or a telling example.<br>Give it a source. You can connect the dots later.</p><button type="button" data-action="add-fact">Create your first fact <span aria-hidden="true">&#8599;</span></button><span class="empty-hint">Or open an existing board with Upload Board.</span></div>`
            : board.gatheredFacts.map((fact, index) => renderFactCard(board, fact, index)).join("")
        }
      </div><aside class="research-guide" aria-label="Research guidance"><p class="eyebrow">A NOTE ON METHOD</p><h3>Collect first.<br>Connect later.</h3><p>You don't need the whole argument yet. Start with what you know.</p><ol><li><strong>One idea per fact</strong><span>Keep each finding focused so it can support more than one point.</span></li><li><strong>Keep the source close</strong><span>Add the original link. Your future self will thank you.</span></li><li><strong>Leave room to think</strong><span>Drafts are welcome. Complete the details as you go.</span></li></ol><div class="guide-footer">FACTS &#8594; REASONING &#8594; CLARITY</div></aside></div>
    </section>
  `;
}

function renderFactCard(board: ArgumentBoard, fact: GatheredFact, index: number): string {
  const usage = factUsageLabels(board, fact.id);
  const incomplete = factCompleteness(fact);
  const prefix = `fact-${safeDomId(fact.id)}`;

  return `
    <article class="fact-card ${incomplete.length ? "incomplete" : ""}" data-fact-id="${escapeAttr(fact.id)}">
      <div class="fact-card-heading">
        <div>
          <span class="term">Gathered Fact ${index + 1}</span>
          <strong class="fact-status">${incomplete.length ? "Incomplete" : "Complete"}</strong>
        </div>
        <div class="usage-block">
          <strong>${usage.length === 0 ? "Unused" : `Used in ${usage.length} place${usage.length === 1 ? "" : "s"}`}</strong>
          ${usage.map((label) => `<span class="usage-badge">${escapeHtml(label)}</span>`).join("")}
        </div>
      </div>
      ${usage.length === 0 ? "" : `<p class="shared-warning">Used in ${usage.length} place${usage.length === 1 ? "" : "s"}—changes update all uses.</p>`}
      <div class="fact-fields">
        ${renderDataTypeField(fact, `${prefix}-type`)}
        <label for="${prefix}-text">
          <span>Fact text</span>
          <textarea id="${prefix}-text" data-action="fact-text" data-fact-id="${escapeAttr(fact.id)}" rows="3" placeholder="Write one fact, observation, example, or estimate...">${escapeHtml(fact.text)}</textarea>
        </label>
        <label for="${prefix}-link">
          <span>Evidence Link</span>
          <input id="${prefix}-link" data-action="fact-link" data-fact-id="${escapeAttr(fact.id)}" type="url" value="${escapeAttr(fact.evidenceLink)}" placeholder="https://example.com/source" />
        </label>
      </div>
      ${
        incomplete.length === 0
          ? ""
          : `<ul class="field-guidance">${incomplete
              .map((reason) => `<li>${escapeHtml(incompleteGuidance(reason))}</li>`)
              .join("")}</ul>`
      }
      <div class="text-actions" aria-label="Gathered Fact ${index + 1} controls">
        <button type="button" data-action="move-library-fact" data-fact-id="${escapeAttr(fact.id)}" data-direction="up">Move up</button>
        <button type="button" data-action="move-library-fact" data-fact-id="${escapeAttr(fact.id)}" data-direction="down">Move down</button>
        <button type="button" data-action="another-fact-source" data-fact-id="${escapeAttr(fact.id)}">Another fact from this source</button>
        <button type="button" class="danger" data-action="delete-fact" data-fact-id="${escapeAttr(fact.id)}">Delete fact</button>
      </div>
    </article>
  `;
}

function renderConstructStage(
  board: ArgumentBoard,
  issues: ReturnType<ArgumentBoardSession["snapshot"]>["issues"],
): string {
  return `
    <section id="stage-panel-construct" class="workflow-stage" role="tabpanel" aria-labelledby="stage-heading-construct">
      <div class="section-heading">
        <div>
          <p class="eyebrow">02 / THE REASONING</p>
          <h2 id="stage-heading-construct" tabindex="-1">Construct Argument</h2>
          <span>Shape the SCQA story and deliberately choose evidence for each destination.</span>
        </div>
      </div>
      <section class="scqa-grid" aria-label="Argument frame">
        ${renderTextPanel(board, "situation", "What is happening?", "Situation")}
        ${renderTextPanel(board, "complication", "What changed or makes this matter?", "Complication")}
        ${renderTextPanel(board, "question", "What question must this answer?", "Question")}
        ${renderTextPanel(board, "answer", "What is your main answer?", "Answer")}
      </section>
      <section class="support-section" aria-label="Supporting argument structure">
        <div class="section-heading">
          <div>
            <h2 id="supporting-arguments">Supporting Arguments</h2>
            <span>Reasoning claims with deliberately selected facts</span>
          </div>
          <button type="button" data-action="add-argument">+ Argument</button>
        </div>
        <div class="argument-list">
          ${board.supportingArguments.map((argument, index) => renderArgument(board, argument, index)).join("")}
        </div>
      </section>
      ${renderChecklist(issues)}
    </section>
  `;
}

function renderTextPanel(
  board: ArgumentBoard,
  field: keyof ArgumentBoard["scqa"],
  label: string,
  term: string,
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
      <textarea id="scqa-${field}" data-action="scqa" data-field="${field}" rows="4" placeholder="Write here...">${escapeHtml(slot.text)}</textarea>
      ${destinationId ? renderDestinationFacts(board, destinationId) : ""}
    </article>
  `;
}

function renderArgument(board: ArgumentBoard, argument: ArgumentBoard["supportingArguments"][number], index: number): string {
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
      ${renderDestinationFacts(board, argument.id)}
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

function renderDestinationFacts(board: ArgumentBoard, destinationId: FactDestinationId): string {
  const { attachedFacts: facts, attachableFacts: available, label } = readFactAttachments(board, destinationId);

  return `
    <section class="destination-facts" aria-label="Facts supporting ${escapeAttr(label)}">
      <div class="destination-heading">
        <div>
          <strong>Supporting Facts</strong>
          <span>${facts.length} attached</span>
        </div>
        <div class="fact-picker">
          <label>
            <span class="sr-only">Choose Gathered Facts for ${escapeHtml(label)}</span>
            <select data-action="attach-fact" data-destination-id="${escapeAttr(destinationId)}" ${available.length === 0 ? "disabled" : ""}>
              <option value="">${available.length === 0 ? "No complete facts available" : "Choose Gathered Facts…"}</option>
              ${available.map((fact) => `<option value="${escapeAttr(fact.id)}">${escapeHtml(fact.text)}</option>`).join("")}
            </select>
          </label>
          <button type="button" data-action="create-fact-here" data-destination-id="${escapeAttr(destinationId)}">Create new fact here</button>
        </div>
      </div>
      <div class="attached-list">
        ${
          facts.length === 0
            ? `<p class="empty-attachment">No facts attached.</p>`
            : facts.map((fact, index) => renderAttachedFact(board, destinationId, fact, index)).join("")
        }
      </div>
    </section>
  `;
}

function renderAttachedFact(
  board: ArgumentBoard,
  destinationId: FactDestinationId,
  fact: GatheredFact,
  index: number,
): string {
  const usage = factUsageLabels(board, fact.id);
  const prefix = `attached-${safeDomId(destinationId)}-${safeDomId(fact.id)}`;

  return `
    <article class="attached-fact ${isGatheredFactComplete(fact) ? "" : "incomplete"}">
      <div class="attached-fact-heading">
        <strong>Fact ${index + 1}</strong>
        <span>Used in ${usage.length} place${usage.length === 1 ? "" : "s"}—changes update all uses</span>
      </div>
      <div class="attached-fields">
        ${renderDataTypeField(fact, `${prefix}-type`)}
        <label for="${prefix}-text">
          <span>Fact text</span>
          <textarea id="${prefix}-text" data-action="fact-text" data-fact-id="${escapeAttr(fact.id)}" rows="2">${escapeHtml(fact.text)}</textarea>
        </label>
        <label for="${prefix}-link">
          <span>Evidence Link</span>
          <input id="${prefix}-link" data-action="fact-link" data-fact-id="${escapeAttr(fact.id)}" type="url" value="${escapeAttr(fact.evidenceLink)}" />
        </label>
      </div>
      <div class="text-actions">
        <button type="button" data-action="focus-attached-fact" data-focus-id="${prefix}-text">Edit fact</button>
        <button type="button" data-action="open-fact" data-fact-id="${escapeAttr(fact.id)}">Open in Gathered Facts</button>
        <button type="button" data-action="move-attached-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}" data-direction="up">Move up</button>
        <button type="button" data-action="move-attached-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}" data-direction="down">Move down</button>
        <button type="button" data-action="detach-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}">Remove from here</button>
      </div>
    </article>
  `;
}

function renderDataTypeField(fact: GatheredFact, id: string): string {
  return `
    <label for="${id}">
      <span>Data Type <small>(optional)</small></span>
      <select id="${id}" data-action="fact-data-type" data-fact-id="${escapeAttr(fact.id)}">
        ${renderDataTypeOption("", "Unspecified", fact.dataType)}
        ${renderDataTypeOption("fact", "Fact", fact.dataType)}
        ${renderDataTypeOption("observation", "Observation", fact.dataType)}
        ${renderDataTypeOption("example", "Example", fact.dataType)}
        ${renderDataTypeOption("estimate", "Estimate", fact.dataType)}
      </select>
    </label>
  `;
}

function renderDataTypeOption(value: DataType, label: string, selected: DataType): string {
  return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
}

function renderChecklist(issues: ReturnType<ArgumentBoardSession["snapshot"]>["issues"]): string {
  return `
    <aside class="checklist" aria-label="Review checklist">
      <h2>Readiness Check</h2>
      <p>${issues.length === 0 ? "Ready to preview, copy, or download." : `${issues.length} item${issues.length === 1 ? "" : "s"} need attention.`}</p>
      <ul>
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
      </ul>
    </aside>
  `;
}

function renderPreviewStage(preview: ReturnType<typeof projectArgumentPreview>): string {
  return `
    <section id="stage-panel-preview" class="workflow-stage preview-view" role="tabpanel" aria-labelledby="stage-heading-preview">
      <div class="section-heading">
        <div>
          <p class="eyebrow">03 / THE BIG PICTURE</p>
          <h2 id="stage-heading-preview" tabindex="-1">Argument Preview</h2>
          <span>Read-only structure and destination-grouped evidence</span>
        </div>
        ${renderCommandButton(commandDeskActions.copyMermaid)}
      </div>
      <p class="verification-note">Link format checked; source quality and factual accuracy are not verified.</p>
      <div class="mermaid-diagram" role="img" aria-label="Rendered Argument Board workflow">
        <div class="mermaid-status">Rendering workflow...</div>
      </div>
      <p class="diagram-hint">Scroll across the diagram to follow each branch.</p>
      <section class="evidence-list" aria-labelledby="evidence-list-heading">
        <h3 id="evidence-list-heading">Evidence by destination</h3>
        ${
          preview.evidenceGroups.length === 0
            ? "<p>No facts are attached to the argument.</p>"
            : preview.evidenceGroups.map(renderEvidenceGroup).join("")
        }
      </section>
      <details class="mermaid-source">
        <summary>Mermaid source</summary>
        <pre class="mermaid-box">${escapeHtml(preview.mermaid)}</pre>
      </details>
    </section>
  `;
}

function renderEvidenceGroup(group: ReturnType<typeof projectArgumentPreview>["evidenceGroups"][number]): string {
  return `
    <section class="evidence-group">
      <h4>${escapeHtml(group.label)}</h4>
      <ol>
        ${group.facts
          .map(
            (fact) => `
              <li>
                <span>${escapeHtml(fact.label)}</span>
                ${renderEvidenceSource(fact)}
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  `;
}

function renderEvidenceSource(fact: ArgumentPreviewFact): string {
  if (fact.evidenceLinkIsValid) {
    return `<a href="${escapeAttr(fact.evidenceLink)}" target="_blank" rel="noreferrer" aria-label="Open evidence source for ${escapeAttr(fact.text || "fact needing text")}">Open evidence source</a>`;
  }

  return `<span class="invalid-source">${fact.evidenceLink.trim() ? "Evidence link is invalid" : "Evidence link is missing"}</span>`;
}

function handleChange(
  appRoot: HTMLDivElement,
  session: ArgumentBoardSession,
  target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
) {
  const action = target.dataset.action;
  const factId = target.dataset.factId;
  const argumentId = target.dataset.argumentId;

  if (action === "title") {
    session.dispatch({ type: "update-title", title: target.value });
  } else if (action === "scqa" && target instanceof HTMLTextAreaElement) {
    session.dispatch({
      type: "update-scqa",
      field: target.dataset.field as keyof ArgumentBoard["scqa"],
      text: target.value,
    });
  } else if (action === "argument-text" && argumentId && target instanceof HTMLTextAreaElement) {
    session.dispatch({ type: "update-supporting-argument", argumentId, changes: { text: target.value } });
  } else if (action === "mode-change" && argumentId && target instanceof HTMLInputElement) {
    session.dispatch({
      type: "update-supporting-argument",
      argumentId,
      changes: { mode: target.value as SupportMode },
    });
  } else if (action === "fact-text" && factId && target instanceof HTMLTextAreaElement) {
    session.dispatch({ type: "update-gathered-fact", factId, changes: { text: target.value } });
  } else if (action === "fact-link" && factId && target instanceof HTMLInputElement) {
    session.dispatch({ type: "update-gathered-fact", factId, changes: { evidenceLink: target.value } });
  } else if (action === "fact-data-type" && factId && target instanceof HTMLSelectElement) {
    session.dispatch({ type: "update-gathered-fact", factId, changes: { dataType: target.value as DataType } });
  } else if (action === "attach-fact" && target instanceof HTMLSelectElement && target.value) {
    session.dispatch({
      type: "attach-fact",
      destinationId: target.dataset.destinationId ?? "",
      factId: target.value,
    });
  } else {
    return;
  }

  renderAndFocus(appRoot, session, target.id);
}

function handleAction(appRoot: HTMLDivElement, session: ArgumentBoardSession, target: HTMLElement) {
  const action = target.dataset.action;
  const factId = target.dataset.factId;
  const argumentId = target.dataset.argumentId;
  const destinationId = target.dataset.destinationId;
  const direction = target.dataset.direction === "up" ? "up" : "down";

  if (action === "stage") {
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
    void navigator.clipboard.writeText(session.copyOutline());
  } else if (action === "copy-mermaid") {
    void navigator.clipboard.writeText(session.copyMermaid());
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
  session.setStage("gather");
  renderAndFocus(appRoot, session, `fact-${safeDomId(factId)}-text`);
}

function renderAndFocus(appRoot: HTMLDivElement, session: ArgumentBoardSession, focusId?: string) {
  render(appRoot, session);
  if (focusId) {
    document.getElementById(focusId)?.focus();
  }
}

function downloadBoard(session: ArgumentBoardSession) {
  const file = session.exportFile();
  const blob = new Blob([file.contents], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
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

  session.setStage("gather");
  renderAndFocus(appRoot, session, "stage-heading-gather");
}

function clearBoard(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  if (session.hasTouchedContent() && !confirm("Clear this board? Download it first if you want to keep it.")) {
    return;
  }

  session.clear();
  session.setStage("gather");
  renderAndFocus(appRoot, session, "stage-heading-gather");
}

async function renderMermaidPreview(appRoot: HTMLDivElement, source: string, currentRender: number) {
  const container = appRoot.querySelector<HTMLDivElement>(".mermaid-diagram");
  if (!container) return;

  try {
    const mermaid = await loadMermaid();
    const { svg } = await mermaid.render(`argument-preview-${currentRender}`, source);
    if (currentRender === renderVersion) {
      container.innerHTML = svg;
    }
  } catch {
    if (currentRender === renderVersion) {
      container.innerHTML = `<div class="mermaid-status error">The workflow could not be rendered. Check the Mermaid source below.</div>`;
    }
  }
}

function loadMermaid() {
  return (mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background: "#111111",
        primaryColor: "#242424",
        primaryTextColor: "#ededed",
        darkMode: true,
        textColor: "#ededed",
        primaryBorderColor: "#616161",
        lineColor: "#a0a0a0",
        secondaryColor: "#1c1c1c",
        tertiaryColor: "#151515",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
    });
    return mermaid;
  }));
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

function incompleteGuidance(reason: ReturnType<typeof factCompleteness>[number]): string {
  const messages = {
    "needs-text": "Add fact text.",
    "needs-link": "Add an evidence link.",
    "invalid-link": "Use a valid http:// or https:// evidence link.",
  };
  return messages[reason];
}

function safeDomId(value: string): string {
  return Array.from(value, (character) => character.codePointAt(0)!.toString(16)).join("-");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
