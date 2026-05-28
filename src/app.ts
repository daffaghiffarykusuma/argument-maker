import type { ArgumentBoard, DataType, SupportMode } from "./argument-board";
import { createArgumentBoardSession, type ArgumentBoardSession, type ViewMode } from "./argument-board-session";
import { createArgumentBoardViewModel, type ArgumentBoardViewModel } from "./argument-board-view-model";
import mermaid from "mermaid";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

const appRoot = app;
const session = createArgumentBoardSession();
let renderVersion = 0;

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: "dark",
  themeVariables: {
    background: "#02080d",
    primaryColor: "#06131d",
    primaryTextColor: "#f4ffe4",
    primaryBorderColor: "#d9ed92",
    lineColor: "#b5e48c",
    secondaryColor: "#123f61",
    tertiaryColor: "#000000",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
});

render();

window.addEventListener("beforeunload", (event) => {
  if (session.hasTouchedContent()) {
    event.preventDefault();
    event.returnValue = "";
  }
});

appRoot.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return;
  }

  applyInput(session, target);
});

appRoot.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === "file") {
    void handleUpload(session, target);
    return;
  }

  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
    applyInput(session, target);
  }
});

appRoot.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target) {
    return;
  }

  handleAction(session, target);
});

function render() {
  renderVersion += 1;
  const currentRender = renderVersion;
  const view = createArgumentBoardViewModel(session.snapshot());
  appRoot.innerHTML = `
    <main class="app-shell">
      ${renderToolbar(view)}
      ${view.mode === "board" ? renderBoard(view) : renderPreview(view)}
    </main>
  `;

  if (view.mode === "preview") {
    void renderMermaidPreview(view.preview.mermaid, currentRender);
  }
}

function renderToolbar(view: ArgumentBoardViewModel): string {
  return `
    <header class="toolbar" aria-label="Argument board toolbar">
      <div>
        <input class="title-input" aria-label="Board title" value="${escapeAttr(view.toolbar.title)}" placeholder="Untitled argument" data-action="title" />
        <p class="subtitle">Build the argument structure first. Download it when you want to keep it.</p>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="${view.mode === "board" ? "active" : ""}" data-action="mode" data-mode="board">Board</button>
        <button type="button" class="${view.mode === "preview" ? "active" : ""}" data-action="mode" data-mode="preview">Preview</button>
        <button type="button" data-action="copy-outline">Copy Outline</button>
        <button type="button" data-action="download">Download</button>
        <label class="file-button">
          Upload
          <input type="file" accept=".json,.argument.json,application/json" data-action="upload" />
        </label>
        <button type="button" data-action="undo" ${view.toolbar.canUndo ? "" : "disabled"}>Undo</button>
        <button type="button" data-action="redo" ${view.toolbar.canRedo ? "" : "disabled"}>Redo</button>
        <button type="button" class="danger" data-action="clear">Clear</button>
      </div>
    </header>
  `;
}

function renderBoard(view: ArgumentBoardViewModel): string {
  return `
    <section class="board-view" aria-label="Argument board">
      <section class="scqa-grid" aria-label="Argument frame">
        ${view.scqa.map((panel) => renderTextPanel(panel.field, panel.label, panel.term, panel.value)).join("")}
      </section>
      <section class="support-section" aria-label="Supporting argument structure">
        <div class="section-heading">
          <div>
            <h2>Why should someone believe this?</h2>
            <span>Supporting Argument</span>
          </div>
          <button type="button" data-action="add-argument">+ Argument</button>
        </div>
        <div class="argument-list">
          ${view.supportingArguments.map((argument) => renderArgument(argument)).join("")}
        </div>
      </section>
      ${renderChecklist(view)}
    </section>
  `;
}

function renderTextPanel(field: keyof ArgumentBoard["scqa"], label: string, term: string, value: string): string {
  return `
    <label class="panel">
      <span class="panel-label">${label}</span>
      <span class="term">${term}</span>
      <textarea data-action="scqa" data-field="${field}" rows="4" placeholder="Write here...">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderArgument(argument: ArgumentBoardViewModel["supportingArguments"][number]): string {
  return `
    <article class="argument-card">
      <div class="argument-header">
        <label>
          <span class="panel-label">${argument.label}</span>
          <span class="term">${argument.term}</span>
          <textarea data-action="argument-text" data-argument-id="${argument.id}" rows="2" placeholder="Write a reason...">${escapeHtml(argument.text)}</textarea>
        </label>
        <div class="card-controls" aria-label="Supporting Argument controls">
          ${renderModeControl(argument.id, argument.mode)}
          <button type="button" data-action="move-argument" data-direction="up" data-argument-id="${argument.id}">Up</button>
          <button type="button" data-action="move-argument" data-direction="down" data-argument-id="${argument.id}">Down</button>
          <button type="button" data-action="duplicate-argument" data-argument-id="${argument.id}">Duplicate</button>
          <button type="button" class="danger" data-action="delete-argument" data-argument-id="${argument.id}">Delete</button>
        </div>
      </div>
      <div class="data-heading">
        <span>What fact supports this?</span>
        <small>Supporting Data or Facts</small>
        <button type="button" data-action="add-data" data-argument-id="${argument.id}">+ Data/Fact</button>
      </div>
      <div class="data-list">
        ${argument.data.map((item) => renderDataFact(argument.id, item)).join("")}
      </div>
    </article>
  `;
}

function renderModeControl(argumentId: string, modeValue: SupportMode): string {
  return `
    <fieldset class="segmented">
      <legend>Support Mode</legend>
      <label><input type="radio" name="mode-${argumentId}" data-action="mode-change" data-argument-id="${argumentId}" value="reasoning" ${modeValue === "reasoning" ? "checked" : ""} /> Reasoning</label>
      <label><input type="radio" name="mode-${argumentId}" data-action="mode-change" data-argument-id="${argumentId}" value="evidence-backed" ${modeValue === "evidence-backed" ? "checked" : ""} /> Evidence-backed</label>
    </fieldset>
  `;
}

function renderDataFact(argumentId: string, item: ArgumentBoardViewModel["supportingArguments"][number]["data"][number]): string {
  return `
    <div class="data-row">
      <textarea data-action="data-text" data-argument-id="${argumentId}" data-data-id="${item.id}" rows="2" placeholder="Write a fact, observation, example, or estimate...">${escapeHtml(item.text)}</textarea>
      <input data-action="evidence-link" data-argument-id="${argumentId}" data-data-id="${item.id}" value="${escapeAttr(item.evidenceLink)}" placeholder="https://evidence-link" aria-label="Where can this be checked?" />
      <select data-action="data-type" data-argument-id="${argumentId}" data-data-id="${item.id}" aria-label="Data Type">
        ${renderDataTypeOption("", "Unspecified", item.dataType)}
        ${renderDataTypeOption("fact", "Fact", item.dataType)}
        ${renderDataTypeOption("observation", "Observation", item.dataType)}
        ${renderDataTypeOption("example", "Example", item.dataType)}
        ${renderDataTypeOption("estimate", "Estimate", item.dataType)}
      </select>
      <div class="row-controls">
        <button type="button" data-action="move-data" data-direction="up" data-argument-id="${argumentId}" data-data-id="${item.id}">Up</button>
        <button type="button" data-action="move-data" data-direction="down" data-argument-id="${argumentId}" data-data-id="${item.id}">Down</button>
        <button type="button" data-action="duplicate-data" data-argument-id="${argumentId}" data-data-id="${item.id}">Duplicate</button>
        <button type="button" class="danger" data-action="delete-data" data-argument-id="${argumentId}" data-data-id="${item.id}">Delete</button>
      </div>
    </div>
  `;
}

function renderDataTypeOption(value: DataType, label: string, selected: DataType): string {
  return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
}

function renderChecklist(view: ArgumentBoardViewModel): string {
  return `
    <aside class="checklist" aria-label="Review checklist">
      <h2>Readiness Check</h2>
      <p>${view.checklist.summary}</p>
      <ul>
        ${view.checklist.messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("") || "<li>No structural issues found.</li>"}
      </ul>
    </aside>
  `;
}

function renderPreview(view: ArgumentBoardViewModel): string {
  return `
    <section class="preview-view" aria-label="Argument Preview">
      <div class="section-heading">
        <div>
          <h2>Argument Preview</h2>
          <span>Rendered workflow with copyable Mermaid source</span>
        </div>
        <button type="button" data-action="copy-mermaid">Copy Mermaid</button>
      </div>
      ${renderPreviewDiagram(view)}
      <div class="mermaid-diagram" aria-label="Rendered Mermaid workflow">
        <div class="mermaid-status">Rendering workflow...</div>
      </div>
      <details class="mermaid-source">
        <summary>Mermaid source</summary>
        <pre class="mermaid-box">${escapeHtml(view.preview.mermaid)}</pre>
      </details>
    </section>
  `;
}

function renderPreviewDiagram(view: ArgumentBoardViewModel): string {
  return `
    <div class="preview-diagram" aria-label="Read-only argument workflow">
      <div class="preview-chain">
        ${view.preview.chain.map((node) => renderPreviewNode(node.label, node.text)).join("")}
      </div>
      <div class="preview-support">
        ${view.preview.arguments
          .map(
            (argument) => `
              <article class="preview-argument">
                ${renderPreviewNode(argument.label, argument.text)}
                <div class="preview-data">
                  ${argument.data.map((item) => renderPreviewNode(item.label, item.text)).join("")}
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderPreviewNode(label: string, text: string): string {
  return `
    <div class="preview-node">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(text.trim() || "[empty]")}</strong>
    </div>
  `;
}

async function renderMermaidPreview(source: string, currentRender: number) {
  const container = appRoot.querySelector<HTMLDivElement>(".mermaid-diagram");

  if (!container) {
    return;
  }

  try {
    const { svg } = await mermaid.render(`argument-preview-${currentRender}`, source);

    if (currentRender !== renderVersion) {
      return;
    }

    container.innerHTML = svg;
  } catch {
    if (currentRender !== renderVersion) {
      return;
    }

    container.innerHTML = `<div class="mermaid-status error">The workflow could not be rendered. Check the Mermaid source below.</div>`;
  }
}

function applyInput(argumentSession: ArgumentBoardSession, target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const action = target.dataset.action;
  const argumentId = target.dataset.argumentId;
  const dataId = target.dataset.dataId;

  if (action === "title") {
    argumentSession.dispatch({ type: "update-title", title: target.value });
  } else if (action === "scqa" && target instanceof HTMLTextAreaElement) {
    argumentSession.dispatch({
      type: "update-scqa",
      field: target.dataset.field as keyof ArgumentBoard["scqa"],
      text: target.value,
    });
  } else if (action === "argument-text" && argumentId && target instanceof HTMLTextAreaElement) {
    argumentSession.dispatch({ type: "update-supporting-argument", argumentId, changes: { text: target.value } });
  } else if (action === "mode-change" && argumentId && target instanceof HTMLInputElement) {
    argumentSession.dispatch({
      type: "update-supporting-argument",
      argumentId,
      changes: { mode: target.value as SupportMode },
    });
    render();
  } else if (action === "data-text" && argumentId && dataId && target instanceof HTMLTextAreaElement) {
    argumentSession.dispatch({ type: "update-supporting-data-fact", argumentId, dataId, changes: { text: target.value } });
  } else if (action === "evidence-link" && argumentId && dataId && target instanceof HTMLInputElement) {
    argumentSession.dispatch({ type: "update-supporting-data-fact", argumentId, dataId, changes: { evidenceLink: target.value } });
  } else if (action === "data-type" && argumentId && dataId && target instanceof HTMLSelectElement) {
    argumentSession.dispatch({
      type: "update-supporting-data-fact",
      argumentId,
      dataId,
      changes: { dataType: target.value as DataType },
    });
    render();
  }
}

function handleAction(argumentSession: ArgumentBoardSession, target: HTMLElement) {
  const action = target.dataset.action;
  const argumentId = target.dataset.argumentId;
  const dataId = target.dataset.dataId;
  const direction = target.dataset.direction as "up" | "down" | undefined;

  if (action === "mode") {
    argumentSession.setMode(target.dataset.mode === "preview" ? "preview" : "board");
    render();
  } else if (action === "add-argument") {
    argumentSession.dispatch({ type: "add-supporting-argument" });
    render();
  } else if (action === "add-data" && argumentId) {
    argumentSession.dispatch({ type: "add-supporting-data-fact", argumentId });
    render();
  } else if (action === "move-argument" && argumentId && direction) {
    argumentSession.dispatch({ type: "move-supporting-argument", argumentId, direction });
    render();
  } else if (action === "duplicate-argument" && argumentId) {
    argumentSession.dispatch({ type: "duplicate-supporting-argument", argumentId });
    render();
  } else if (action === "delete-argument" && argumentId) {
    argumentSession.dispatch({ type: "delete-supporting-argument", argumentId });
    render();
  } else if (action === "move-data" && argumentId && dataId && direction) {
    argumentSession.dispatch({ type: "move-supporting-data-fact", argumentId, dataId, direction });
    render();
  } else if (action === "duplicate-data" && argumentId && dataId) {
    argumentSession.dispatch({ type: "duplicate-supporting-data-fact", argumentId, dataId });
    render();
  } else if (action === "delete-data" && argumentId && dataId) {
    argumentSession.dispatch({ type: "delete-supporting-data-fact", argumentId, dataId });
    render();
  } else if (action === "copy-outline") {
    void navigator.clipboard.writeText(argumentSession.copyOutline());
  } else if (action === "copy-mermaid") {
    void navigator.clipboard.writeText(argumentSession.copyMermaid());
  } else if (action === "download") {
    downloadBoard(argumentSession);
  } else if (action === "clear") {
    clearBoard(argumentSession);
  } else if (action === "undo") {
    argumentSession.undo();
    render();
  } else if (action === "redo") {
    argumentSession.redo();
    render();
  }
}

function downloadBoard(argumentSession: ArgumentBoardSession) {
  const file = argumentSession.exportFile();
  const blob = new Blob([file.contents], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

async function handleUpload(argumentSession: ArgumentBoardSession, input: HTMLInputElement) {
  const file = input.files?.[0];
  input.value = "";

  if (!file) {
    return;
  }

  if (argumentSession.hasTouchedContent() && !confirm("Replace this board? Download it first if you want to keep it.")) {
    return;
  }

  const result = argumentSession.importFile(await file.text());

  if (!result.ok) {
    alert(result.message);
    return;
  }

  render();
}

function clearBoard(argumentSession: ArgumentBoardSession) {
  if (argumentSession.hasTouchedContent() && !confirm("Clear this board? Download it first if you want to keep it.")) {
    return;
  }

  argumentSession.clear();
  render();
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
