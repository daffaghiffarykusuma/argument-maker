import type { ArgumentBoard, DataType, SupportMode } from "./argument-board";
import { createArgumentBoardSession, type ArgumentBoardSession } from "./argument-board-session";
import { projectArgumentPreview } from "./argument-preview-projection";
import {
  commandDeskActions,
  decodeCommandDeskAction,
  togglePreviewAction,
  type CommandDeskActionControl,
} from "./command-desk-actions";
import { renderIcon, renderIconButton } from "./icon-controls";
import mermaid from "mermaid";

let renderVersion = 0;
let previewRenderRequest: ReturnType<typeof setTimeout> | undefined;

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

function createArgumentBoardView(session: ArgumentBoardSession) {
  const snapshot = session.snapshot();
  const preview = projectArgumentPreview(snapshot.board);

  return {
    mode: snapshot.mode,
    toolbar: {
      title: snapshot.board.title,
      canUndo: snapshot.canUndo,
      canRedo: snapshot.canRedo,
    },
    status: {
      argumentCount: snapshot.board.supportingArguments.length,
      dataFactCount: snapshot.board.supportingArguments.reduce((count, argument) => count + argument.data.length, 0),
    },
    scqa: [
      { field: "situation", label: "What is happening?", term: "Situation", value: snapshot.board.scqa.situation.text },
      {
        field: "complication",
        label: "What changed or makes this matter?",
        term: "Complication",
        value: snapshot.board.scqa.complication.text,
      },
      {
        field: "question",
        label: "What question must this answer?",
        term: "Question",
        value: snapshot.board.scqa.question.text,
      },
      { field: "answer", label: "What is your main answer?", term: "Answer", value: snapshot.board.scqa.answer.text },
    ] satisfies Array<{
      field: keyof ArgumentBoard["scqa"];
      label: string;
      term: string;
      value: string;
    }>,
    supportingArguments: snapshot.board.supportingArguments.map((argument, index) => ({
      ...argument,
      label: "Why should someone believe this?",
      term: `Supporting Argument ${index + 1}`,
    })),
    checklist: {
      messages: snapshot.issues.map((issue) => issue.message),
      summary:
        snapshot.issues.length === 0
          ? "Ready to preview, copy, or download."
          : `${snapshot.issues.length} item${snapshot.issues.length === 1 ? "" : "s"} need attention.`,
    },
    preview: { mermaid: preview.mermaid },
  };
}

type ArgumentBoardView = ReturnType<typeof createArgumentBoardView>;

export function mountArgumentBoardApp(appRoot: HTMLDivElement, session = createArgumentBoardSession()) {
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

    applyInput(appRoot, session, target);
  });

  appRoot.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "file") {
      void handleUpload(appRoot, session, target);
      return;
    }

    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
      applyInput(appRoot, session, target);
    }
  });

  appRoot.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!target) {
      return;
    }

    handleAction(appRoot, session, target);
  });

  render(appRoot, session);
}

function render(appRoot: HTMLDivElement, session: ArgumentBoardSession) {
  renderVersion += 1;
  const currentRender = renderVersion;
  const view = createArgumentBoardView(session);
  appRoot.innerHTML = `
    <main class="app-shell">
      ${renderCommandRail(view)}
      <div class="desk-main">
        ${renderTopbar(view)}
        <div class="workspace ${view.mode === "preview" ? "with-preview" : ""}">
          ${renderBoard(view)}
          ${view.mode === "preview" ? renderPreview(view) : ""}
        </div>
      </div>
    </main>
  `;

  if (view.mode === "preview") {
    void renderMermaidPreview(appRoot, view.preview.mermaid, currentRender);
  }
}

function renderCommandRail(view: ArgumentBoardView): string {
  const togglePreview = togglePreviewAction(view.mode === "preview");

  return `
    <aside class="command-rail" aria-label="Board tools">
      <div class="mark" aria-label="Argument Maker">AM</div>
      <div class="rail-actions">
        ${renderCommandButton(commandDeskActions.copyOutline)}
        ${renderCommandButton(commandDeskActions.download)}
        <label class="icon-button file-button" aria-label="${commandDeskActions.upload.label}" title="${commandDeskActions.upload.label}" data-tooltip="${commandDeskActions.upload.label}" tabindex="0">
          ${renderIcon(commandDeskActions.upload.icon)}
          <input type="file" accept=".json,.argument.json,application/json" data-action="upload" />
        </label>
        ${renderCommandButton(togglePreview)}
        ${renderCommandButton({ ...commandDeskActions.undo, disabled: !view.toolbar.canUndo })}
        ${renderCommandButton({ ...commandDeskActions.redo, disabled: !view.toolbar.canRedo })}
        ${renderCommandButton(commandDeskActions.clear)}
      </div>
    </aside>
  `;
}

function renderTopbar(view: ArgumentBoardView): string {
  return `
    <header class="topbar" aria-label="Argument board status">
      <div class="title-group">
        <p class="eyebrow">Argument Board</p>
        <input class="title-input" aria-label="Board title" value="${escapeAttr(view.toolbar.title)}" placeholder="Command Desk" data-action="title" />
        <p class="subtitle">A dense operator layout for fast argument editing and review.</p>
      </div>
      <div class="desk-status">
        <span>${view.status.argumentCount} arguments</span>
        <strong>${view.status.dataFactCount} facts/data</strong>
      </div>
    </header>
  `;
}

function renderBoard(view: ArgumentBoardView): string {
  return `
    <section class="board-view" aria-label="Argument board">
      <section class="scqa-grid" aria-label="Argument frame">
        ${view.scqa.map((panel) => renderTextPanel(panel.field, panel.label, panel.term, panel.value)).join("")}
      </section>
      <section class="support-section" aria-label="Supporting argument structure">
        <div class="section-heading">
          <div>
            <h2>Supporting Arguments</h2>
            <span>Reasoning claims with nested support</span>
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
  const classes = ["panel", field === "answer" ? "answer-panel" : ""].filter(Boolean).join(" ");

  return `
    <label class="${classes}">
      <span class="panel-label">${label}</span>
      <span class="term">${term}</span>
      <textarea data-action="scqa" data-field="${field}" rows="4" placeholder="Write here...">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderArgument(argument: ArgumentBoardView["supportingArguments"][number]): string {
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
          ${renderCommandButton(commandDeskActions.moveArgumentUp, `data-direction="up" data-argument-id="${argument.id}"`)}
          ${renderCommandButton(commandDeskActions.moveArgumentDown, `data-direction="down" data-argument-id="${argument.id}"`)}
          ${renderCommandButton(commandDeskActions.duplicateArgument, `data-argument-id="${argument.id}"`)}
          ${renderCommandButton(commandDeskActions.deleteArgument, `data-argument-id="${argument.id}"`)}
        </div>
      </div>
      <div class="data-heading">
        <span>Supporting Facts/Data</span>
        <small>Evidence belongs to each row</small>
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

function renderDataFact(argumentId: string, item: ArgumentBoardView["supportingArguments"][number]["data"][number]): string {
  return `
    <div class="data-row">
      <select data-action="data-type" data-argument-id="${argumentId}" data-data-id="${item.id}" aria-label="Data Type">
        ${renderDataTypeOption("", "Unspecified", item.dataType)}
        ${renderDataTypeOption("fact", "Fact", item.dataType)}
        ${renderDataTypeOption("observation", "Observation", item.dataType)}
        ${renderDataTypeOption("example", "Example", item.dataType)}
        ${renderDataTypeOption("estimate", "Estimate", item.dataType)}
      </select>
      <textarea data-action="data-text" data-argument-id="${argumentId}" data-data-id="${item.id}" rows="2" placeholder="Write a fact, observation, example, or estimate...">${escapeHtml(item.text)}</textarea>
      <input data-action="evidence-link" data-argument-id="${argumentId}" data-data-id="${item.id}" value="${escapeAttr(item.evidenceLink)}" placeholder="Evidence link" aria-label="Where can this be checked?" />
      <div class="row-controls">
        ${renderCommandButton(commandDeskActions.moveDataUp, `data-direction="up" data-argument-id="${argumentId}" data-data-id="${item.id}"`)}
        ${renderCommandButton(commandDeskActions.moveDataDown, `data-direction="down" data-argument-id="${argumentId}" data-data-id="${item.id}"`)}
        ${renderCommandButton(commandDeskActions.duplicateData, `data-argument-id="${argumentId}" data-data-id="${item.id}"`)}
        ${renderCommandButton(commandDeskActions.deleteData, `data-argument-id="${argumentId}" data-data-id="${item.id}"`)}
      </div>
    </div>
  `;
}

function renderCommandButton(control: CommandDeskActionControl, attrs?: string): string {
  return renderIconButton({
    action: control.action,
    label: control.label,
    icon: control.icon,
    attrs,
    active: control.active,
    danger: control.danger,
    disabled: control.disabled,
  });
}

function renderDataTypeOption(value: DataType, label: string, selected: DataType): string {
  return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
}

function renderChecklist(view: ArgumentBoardView): string {
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

function renderPreview(view: ArgumentBoardView): string {
  return `
    <section class="preview-view" aria-label="Argument Preview">
      <div class="section-heading">
        <div>
          <h2>Argument Preview</h2>
          <span>Rendered Mermaid workflow</span>
        </div>
        ${renderCommandButton(commandDeskActions.copyMermaid)}
      </div>
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

async function renderMermaidPreview(appRoot: HTMLDivElement, source: string, currentRender: number) {
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

function applyInput(
  appRoot: HTMLDivElement,
  argumentSession: ArgumentBoardSession,
  target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
) {
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
    render(appRoot, argumentSession);
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
    render(appRoot, argumentSession);
  }

  schedulePreviewRefresh(appRoot, argumentSession);
}

function schedulePreviewRefresh(appRoot: HTMLDivElement, argumentSession: ArgumentBoardSession) {
  if (argumentSession.snapshot().mode !== "preview" || !appRoot.querySelector(".preview-view")) {
    return;
  }

  if (previewRenderRequest !== undefined) {
    clearTimeout(previewRenderRequest);
  }

  previewRenderRequest = setTimeout(() => {
    previewRenderRequest = undefined;
    const view = createArgumentBoardView(argumentSession);
    const source = appRoot.querySelector<HTMLElement>(".mermaid-box");

    if (source) {
      source.textContent = view.preview.mermaid;
    }

    const container = appRoot.querySelector<HTMLDivElement>(".mermaid-diagram");
    if (container) {
      container.innerHTML = `<div class="mermaid-status">Rendering workflow...</div>`;
    }

    renderVersion += 1;
    void renderMermaidPreview(appRoot, view.preview.mermaid, renderVersion);
  }, 0);
}

function handleAction(appRoot: HTMLDivElement, argumentSession: ArgumentBoardSession, target: HTMLElement) {
  const decodedAction = decodeCommandDeskAction(target);

  if (!decodedAction) {
    return;
  }

  const { action, argumentId, dataId, direction } = decodedAction;

  if (action === "toggle-preview") {
    argumentSession.setMode(argumentSession.snapshot().mode === "preview" ? "board" : "preview");
    render(appRoot, argumentSession);
  } else if (action === "add-argument") {
    argumentSession.dispatch({ type: "add-supporting-argument" });
    render(appRoot, argumentSession);
  } else if (action === "add-data" && argumentId) {
    argumentSession.dispatch({ type: "add-supporting-data-fact", argumentId });
    render(appRoot, argumentSession);
  } else if (action === "move-argument" && argumentId && direction) {
    argumentSession.dispatch({ type: "move-supporting-argument", argumentId, direction });
    render(appRoot, argumentSession);
  } else if (action === "duplicate-argument" && argumentId) {
    argumentSession.dispatch({ type: "duplicate-supporting-argument", argumentId });
    render(appRoot, argumentSession);
  } else if (action === "delete-argument" && argumentId) {
    argumentSession.dispatch({ type: "delete-supporting-argument", argumentId });
    render(appRoot, argumentSession);
  } else if (action === "move-data" && argumentId && dataId && direction) {
    argumentSession.dispatch({ type: "move-supporting-data-fact", argumentId, dataId, direction });
    render(appRoot, argumentSession);
  } else if (action === "duplicate-data" && argumentId && dataId) {
    argumentSession.dispatch({ type: "duplicate-supporting-data-fact", argumentId, dataId });
    render(appRoot, argumentSession);
  } else if (action === "delete-data" && argumentId && dataId) {
    argumentSession.dispatch({ type: "delete-supporting-data-fact", argumentId, dataId });
    render(appRoot, argumentSession);
  } else if (action === "copy-outline") {
    void navigator.clipboard.writeText(argumentSession.copyOutline());
  } else if (action === "copy-mermaid") {
    void navigator.clipboard.writeText(argumentSession.copyMermaid());
  } else if (action === "download") {
    downloadBoard(argumentSession);
  } else if (action === "clear") {
    clearBoard(appRoot, argumentSession);
  } else if (action === "undo") {
    argumentSession.undo();
    render(appRoot, argumentSession);
  } else if (action === "redo") {
    argumentSession.redo();
    render(appRoot, argumentSession);
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

async function handleUpload(appRoot: HTMLDivElement, argumentSession: ArgumentBoardSession, input: HTMLInputElement) {
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

  render(appRoot, argumentSession);
}

function clearBoard(appRoot: HTMLDivElement, argumentSession: ArgumentBoardSession) {
  if (argumentSession.hasTouchedContent() && !confirm("Clear this board? Download it first if you want to keep it.")) {
    return;
  }

  argumentSession.clear();
  render(appRoot, argumentSession);
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
