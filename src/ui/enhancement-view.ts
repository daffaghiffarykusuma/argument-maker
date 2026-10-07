import type { ArgumentBoard } from "../board/argument-board";
import { projectWritingDocument } from "../board/writing-export";
import { escapeAttr, escapeHtml, safeDomId } from "./html";
import { renderWritingDocument } from "./writing-view";

export function renderReasoningPrompts(argument: ArgumentBoard["supportingArguments"][number], expanded = false): string {
  const fields = [["connection", "How does this reason support your answer?"], ["assumptions", "What are you assuming?"], ["objection", "What might someone object to?"], ["weakensClaim", "What evidence would weaken this claim?"]] as const;
  const content = `<p>These notes help you review your reasoning. They do not verify accuracy. Consider an important objection and what could change your conclusion.</p>${fields.map(([field, label]) => `<label for="reasoning-${safeDomId(argument.id)}-${field}">${label}<textarea id="reasoning-${safeDomId(argument.id)}-${field}" data-action="reasoning-note" data-argument-id="${escapeAttr(argument.id)}" data-field="${field}" rows="2">${escapeHtml(argument[field] ?? "")}</textarea></label>`).join("")}`;
  return expanded ? `<div class="reasoning-prompts">${content}</div>` : `<details class="reasoning-prompts" data-disclosure="reasoning-${escapeAttr(argument.id)}"><summary>Challenge this reason <span>optional</span></summary>${content}</details>`;
}

export function renderCompactOutline(board: ArgumentBoard): string {
  return projectWritingDocument(board).sections.map((section) => `<div class="outline-item"><strong>${escapeHtml(section.label)}</strong><p>${escapeHtml(section.text || "Not written yet")}</p>${section.facts.length ? `<span>${section.facts.length} attached fact${section.facts.length === 1 ? "" : "s"}</span>` : ""}</div>`).join("");
}

export function renderPrintDocument(board: ArgumentBoard) {
  return `<div class="print-document">${renderWritingDocument(projectWritingDocument(board), "print")}</div>`;
}
