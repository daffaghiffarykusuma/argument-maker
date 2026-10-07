import type { ArgumentBoard } from "../board/argument-board";
import type { ReviewIssue } from "../board/review";
import { projectWritingDocument } from "../board/writing-export";
import { renderReasoningPrompts } from "./enhancement-view";
import { escapeAttr, escapeHtml } from "./html";
import { renderWritingDocument } from "./writing-view";

export function renderReasoningReview(board: ArgumentBoard, issues: ReviewIssue[], continueToExport = false): string {
  return `<section class="workflow-stage reasoning-review" aria-labelledby="reasoning-review-heading">
    <div class="section-heading"><h2 id="reasoning-review-heading" tabindex="-1">Reasoning review</h2><button type="button" data-action="close-review">Back to editing</button></div>
    <p>Consider whether your evidence and reasoning support your Answer. Every reflection is optional; you can leave at any time.</p>
    <section class="panel" aria-labelledby="review-purpose-heading">
      <h3 id="review-purpose-heading">Purpose and Answer</h3>
      <dl><dt>Audience</dt><dd>${escapeHtml(board.audience?.trim() || "Audience not set (optional)")}</dd>
      <dt>Intended outcome</dt><dd>${escapeHtml(board.intendedOutcome?.trim() || "Intended outcome not set (optional)")}</dd>
      <dt>Question</dt><dd>${escapeHtml(board.scqa.question.text.trim() || "Question not written yet")}</dd>
      <dt>Answer</dt><dd>${escapeHtml(board.scqa.answer.text.trim() || "Answer not written yet")}</dd></dl>
      <p>Does your explanation help this Audience understand or do what you intend?</p>
    </section>
    <section class="panel" aria-labelledby="review-structure-heading">
      <h3 id="review-structure-heading">Structural completeness</h3>
      <p>Completeness checks required fields and support. It does not establish truth or reasoning quality.</p>
      ${issues.length ? `<ul>${issues.map((issue) => `<li><button type="button" class="issue-link" data-action="open-issue" data-target-id="${escapeAttr(issue.targetId)}">${escapeHtml(issue.message)}</button>${issue.fieldMessages?.map((message) => `<p>${escapeHtml(message)}</p>`).join("") ?? ""}</li>`).join("")}</ul>` : "<p>No structural gaps found. You decide whether the reasoning is convincing.</p>"}
    </section>
    <details class="review-evidence" data-disclosure="review-evidence"><summary>Read current argument and evidence</summary>${renderWritingDocument(projectWritingDocument(board), "screen")}</details>
    <section aria-labelledby="review-notes-heading"><h3 id="review-notes-heading">Reflect on each Supporting Argument</h3>
      <p>Notes are saved with your board and can also be edited under Construct Argument.</p>
      ${board.supportingArguments.map((argument, index) => `<article class="argument-card"><h4>Supporting Argument ${index + 1}</h4><p>${escapeHtml(argument.text.trim() || "Reason not written yet")}</p>${renderReasoningPrompts(argument, true)}</article>`).join("") || "<p>No Supporting Arguments yet. Return to Construct Argument to add a reason.</p>"}
    </section>
    ${continueToExport ? '<div class="review-export-actions"><button type="button" data-action="continue-writing">Continue to export</button><p>Reflection fields are optional. Exporting does not certify correctness.</p></div>' : ""}
  </section>`;
}

export function renderWritingInvitation(): string {
  return `<section class="workflow-stage writing-invitation panel" aria-labelledby="writing-invitation-heading">
    <h2 id="writing-invitation-heading" tabindex="-1">Before you share</h2>
    <p>Review how your evidence and reasoning support the Answer, or share an unfinished draft for feedback.</p>
    <p>Review is optional. A draft includes a visible Draft label in the writing you export.</p>
    <div class="review-export-actions"><button type="button" data-action="review-writing">Review now</button><button type="button" data-action="export-draft">Export draft</button><button type="button" data-action="cancel-writing">Cancel export</button></div>
  </section>`;
}
