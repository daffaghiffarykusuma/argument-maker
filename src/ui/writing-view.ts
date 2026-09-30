import { isValidEvidenceLink } from "../board/argument-board";
import type { WritingDocument } from "../board/writing-export";
import { escapeAttr, escapeHtml } from "./html";

export function renderWritingDocument(doc: WritingDocument, idPrefix = "outline"): string {
  return `<article class="writing-document">
    <h2>${escapeHtml(doc.title)}</h2>
    ${doc.sections.map((section) => `<section>
      <h3>${escapeHtml(section.label)}</h3><p>${escapeHtml(section.text || "[Not written]")}</p>
      ${section.facts.length ? `<ul>${section.facts.map((fact) => `<li>${escapeHtml(fact.text || "[Needs fact text]")} <a href="#${escapeAttr(idPrefix)}-source-${fact.citation}" aria-label="Source ${fact.citation}">[${fact.citation}]</a> ${escapeHtml(fact.markers.join(" "))}</li>`).join("")}</ul>` : ""}
      ${section.notes.map((note) => `<p class="reasoning-note"><strong>${escapeHtml(note.label)}</strong> ${escapeHtml(note.text)}</p>`).join("")}
    </section>`).join("")}
    <section><h3>Sources</h3>${doc.sources.length ? `<ol>${doc.sources.map((source) => `<li id="${escapeAttr(idPrefix)}-source-${source.citation}">
      <strong>${escapeHtml(source.sourceTitle || source.text || "Untitled source")}</strong>
      ${isValidEvidenceLink(source.evidenceLink) ? `<a href="${escapeAttr(source.evidenceLink)}" target="_blank" rel="noreferrer">${escapeHtml(source.evidenceLink)}</a>` : `<span>Missing or invalid evidence link</span>`}
      ${source.sourceDate ? `<span>Source date: ${escapeHtml(source.sourceDate)}</span>` : ""}
      ${source.quotation ? `<blockquote>${escapeHtml(source.quotation)}</blockquote>` : ""}
    </li>`).join("")}</ol>` : "<p>No facts attached.</p>"}</section>
    <p class="verification-note">Link format checked; source quality and factual accuracy are not verified.</p>
  </article>`;
}
