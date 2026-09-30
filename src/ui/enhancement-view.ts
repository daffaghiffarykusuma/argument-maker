import type { ArgumentBoard, GatheredFact } from "../board/argument-board";
import { filterFacts } from "../board/fact-library";
import { projectWritingDocument } from "../board/writing-export";
import { views, type ViewState } from "./board-view-state";
import { escapeAttr, escapeHtml } from "./html";
import { renderWritingDocument } from "./writing-view";

export function safeDomId(value: string): string {
  return Array.from(value, (character) => character.codePointAt(0)!.toString(16)).join("-");
}

export function renderLibraryTools(board: ArgumentBoard, view: ViewState): string {
  return `<div class="library-tools"><label>Search facts<input id="fact-search" type="search" data-action="fact-search" value="${escapeAttr(view.query)}" placeholder="Text, source, date, or quotation"></label>
    <label>Show<select id="fact-filter" data-action="fact-filter">${(["all", "unused", "incomplete"] as const).map((filter) => `<option value="${filter}" ${view.filter === filter ? "selected" : ""}>${filter === "all" ? "All facts" : filter === "unused" ? "Unused facts" : "Incomplete facts"}</option>`).join("")}</select></label>
    <button type="button" data-action="load-example">Worked example</button></div>
    <p id="fact-results" role="status">${filterFacts(board, view.query, view.filter).length} of ${board.gatheredFacts.length} facts</p>`;
}

export function renderSourceDetails(fact: GatheredFact, prefix: string): string {
  return `<details class="source-details" data-disclosure="source-${escapeAttr(fact.id)}"><summary>Source details</summary><div class="source-fields">
    ${([['sourceTitle', 'Source title'], ['sourceDate', 'Source date'], ['quotation', 'Quotation']] as const).map(([field, label]) => `<label for="${prefix}-${field}">${label}${field === "quotation" ? `<textarea id="${prefix}-${field}" data-action="source-detail" data-field="${field}" data-fact-id="${escapeAttr(fact.id)}" rows="2">${escapeHtml(fact[field] ?? "")}</textarea>` : `<input id="${prefix}-${field}" type="text" data-action="source-detail" data-field="${field}" data-fact-id="${escapeAttr(fact.id)}" value="${escapeAttr(fact[field] ?? "")}" ${field === "sourceDate" ? 'placeholder="Publication date, if known"' : ""}>`}</label>`).join("")}
  </div></details>`;
}

export function renderReasoningPrompts(argument: ArgumentBoard["supportingArguments"][number]): string {
  const fields = [["connection", "How does this reason support your answer?"], ["assumptions", "What are you assuming?"], ["objection", "What might someone object to?"], ["weakensClaim", "What evidence would weaken this claim?"]] as const;
  return `<details class="reasoning-prompts" data-disclosure="reasoning-${escapeAttr(argument.id)}"><summary>Challenge this reason <span>optional</span></summary><p>These notes help you review your reasoning. They do not verify accuracy.</p>${fields.map(([field, label]) => `<label for="reasoning-${safeDomId(argument.id)}-${field}">${label}<textarea id="reasoning-${safeDomId(argument.id)}-${field}" data-action="reasoning-note" data-argument-id="${escapeAttr(argument.id)}" data-field="${field}" rows="2">${escapeHtml(argument[field] ?? "")}</textarea></label>`).join("")}</details>`;
}

export function renderCompactOutline(board: ArgumentBoard): string {
  return projectWritingDocument(board).sections.map((section) => `<div class="outline-item"><strong>${escapeHtml(section.label)}</strong><p>${escapeHtml(section.text || "Not written yet")}</p>${section.facts.length ? `<span>${section.facts.length} attached fact${section.facts.length === 1 ? "" : "s"}</span>` : ""}</div>`).join("");
}

export function renderPreview(board: ArgumentBoard, view: ViewState): string {
  return `<div class="preview-tools" aria-label="Preview tools">
    <button type="button" data-action="preview-mode" data-mode="diagram" aria-pressed="${view.previewMode === "diagram"}">Diagram</button>
    <button type="button" data-action="preview-mode" data-mode="outline" aria-pressed="${view.previewMode === "outline"}">Readable outline</button>
    <button type="button" data-action="download-writing" data-format="markdown">Download Markdown</button>
    <button type="button" data-action="download-writing" data-format="text">Download text</button>
    <button type="button" data-action="print">Print / Save PDF</button></div>
    <div class="outline-preview" ${view.previewMode === "outline" ? "" : "hidden"}>${renderWritingDocument(projectWritingDocument(board))}</div>
    <div class="zoom-tools" ${view.previewMode === "diagram" ? "" : "hidden"}><button type="button" data-action="zoom" data-zoom="out" aria-label="Zoom out">−</button><output class="zoom-status" aria-live="polite">Fit</output><button type="button" data-action="zoom" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-action="zoom" data-zoom="fit">Fit to view</button></div>`;
}

export function sizeDiagram(root: HTMLDivElement) {
  const view = views.get(root)!;
  const container = root.querySelector<HTMLDivElement>(".mermaid-diagram");
  const svg = container?.querySelector<SVGSVGElement>("svg");
  if (!container || !svg || container.hidden) return;
  const box = svg.viewBox.baseVal;
  if (!box.width || !box.height) return;
  const scale = Math.min(1, (container.clientWidth - 32) / box.width, (container.clientHeight - 32) / box.height) * view.zoom;
  svg.style.width = `${Math.max(1, box.width * scale)}px`;
  svg.style.height = `${Math.max(1, box.height * scale)}px`;
  const output = root.querySelector(".zoom-status");
  if (output) output.textContent = view.zoom === 1 ? "Fit" : `${Math.round(view.zoom * 100)}% of fit`;
}

export function renderPrintDocument(board: ArgumentBoard) {
  return `<div class="print-document">${renderWritingDocument(projectWritingDocument(board), "print")}</div>`;
}
