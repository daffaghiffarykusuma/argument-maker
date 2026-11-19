import type { ArgumentBoard } from "../board/argument-board";
import type { ReviewIssue } from "../board/review";
import { renderReasoningPrompts } from "./enhancement-view";
import { escapeAttr, escapeHtml } from "./html";
import type { WritingAction } from "./writing-review-gate";

/**
 * The Review tab's own sections. Review is one place: the same Structural checks
 * Construct Argument summarises, the argument read as a whole, and the optional
 * Reasoning review prompts.
 */

const actionLabels: Record<WritingAction, string> = {
  "copy-outline": "Copy Outline",
  markdown: "Markdown",
  text: "Text",
  print: "Print / PDF",
};

/** Shown while an export waits for the author to finish reviewing; it stays in reach as they scroll. */
export function renderExportWaiting(action: WritingAction): string {
  return `<div class="review-export-actions export-waiting" role="group" aria-labelledby="export-waiting-text">
    <p id="export-waiting-text">Your ${actionLabels[action]} export is waiting. Review below, then continue when you are ready.</p>
    <button type="button" data-action="continue-writing">Continue to export</button>
  </div>`;
}

export function renderReviewChecks(issues: ReviewIssue[], started: boolean): string {
  const content = !started
    ? '<p class="review-idle">Checks appear as you write.</p>'
    : issues.length
      ? `<ul>${issues.map((issue) => `<li><button type="button" class="issue-link" data-action="open-issue" data-target-id="${escapeAttr(issue.targetId)}">${escapeHtml(issue.message)}</button>${issue.fieldMessages?.map((message) => `<p>${escapeHtml(message)}</p>`).join("") ?? ""}</li>`).join("")}</ul>`
      : '<p class="review-clear">No structural gaps. You decide whether the reasoning is convincing.</p>';
  return `<section class="review-section review-checks" aria-labelledby="review-structure-heading">
    <h3 id="review-structure-heading">Structural checks</h3>
    <p>Checks find missing parts. They do not establish truth or reasoning quality.</p>
    ${content}
  </section>`;
}

export function renderReviewReasoning(board: ArgumentBoard): string {
  return `<section class="review-section review-reasoning" aria-labelledby="review-reasoning-heading">
    <h3 id="review-reasoning-heading">Test your reasoning</h3>
    <p>Consider whether your evidence and reasoning support your Answer. Every reflection is optional, and notes also appear under each reason in Construct Argument.</p>
    <article class="panel review-purpose" aria-labelledby="review-purpose-heading">
      <h4 id="review-purpose-heading">Purpose and Answer</h4>
      <dl>${(
        [
          ["Audience", board.audience, "Audience not set (optional)"],
          ["Intended outcome", board.intendedOutcome, "Intended outcome not set (optional)"],
          ["Question", board.scqa.question.text, "Question not written yet"],
          ["Answer", board.scqa.answer.text, "Answer not written yet"],
        ] as const
      )
        .map(
          ([term, text, unset]) =>
            `<dt>${term}</dt>${text?.trim() ? `<dd>${escapeHtml(text.trim())}</dd>` : `<dd class="unset">${unset}</dd>`}`,
        )
        .join("")}</dl>
      <p>Does your explanation help this Audience understand or do what you intend?</p>
    </article>
    ${board.supportingArguments.map((argument, index) => `<article class="argument-card"><h4>Supporting Argument ${index + 1}</h4><p>${escapeHtml(argument.text.trim() || "Reason not written yet")}</p>${renderReasoningPrompts(argument, true)}</article>`).join("") || "<p>No Supporting Arguments yet. Add a reason in Construct Argument.</p>"}
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
