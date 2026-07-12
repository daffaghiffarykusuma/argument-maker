import type { ArgumentBoard, SupportingArgument, SupportingDataFact } from "./argument-board";
import { isValidEvidenceLink } from "./argument-preview-projection";

export type ReviewIssueCode =
  | "missing-situation"
  | "missing-complication"
  | "missing-question"
  | "missing-answer"
  | "missing-supporting-argument"
  | "empty-touched-item"
  | "needs-data"
  | "needs-evidence-link"
  | "invalid-evidence-link";

export interface ReviewIssue {
  code: ReviewIssueCode;
  message: string;
  targetId: string;
}

export function reviewBoard(board: ArgumentBoard): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  addMissingScqaIssue(issues, board, "situation", "missing-situation", "Add what is happening.");
  addMissingScqaIssue(issues, board, "complication", "missing-complication", "Add what changed or makes this matter.");
  addMissingScqaIssue(issues, board, "question", "missing-question", "Add the question this argument must answer.");
  addMissingScqaIssue(issues, board, "answer", "missing-answer", "Add your main answer.");
  addOptionalEvidenceIssue(issues, board.scqa.situation.id, board.scqa.situation.evidenceLink);
  addOptionalEvidenceIssue(issues, board.scqa.complication.id, board.scqa.complication.evidenceLink);

  const activeArguments = board.supportingArguments.filter((argument) => hasText(argument.text));

  if (activeArguments.length === 0) {
    issues.push({
      code: "missing-supporting-argument",
      message: "Add at least one reason someone should believe the answer.",
      targetId: "supporting-arguments",
    });
  }

  for (const argument of board.supportingArguments) {
    addTouchedEmptyIssue(issues, argument);
    addNeedsDataIssue(issues, argument);

    for (const item of argument.data) {
      addTouchedEmptyIssue(issues, item);
      addEvidenceIssue(issues, item);
    }
  }

  return issues;
}

function addOptionalEvidenceIssue(issues: ReviewIssue[], targetId: string, evidenceLink?: string) {
  if (evidenceLink?.trim() && !isValidEvidenceLink(evidenceLink)) {
    issues.push({
      code: "invalid-evidence-link",
      message: "Use a valid http:// or https:// evidence link.",
      targetId,
    });
  }
}

function addMissingScqaIssue(
  issues: ReviewIssue[],
  board: ArgumentBoard,
  field: keyof ArgumentBoard["scqa"],
  code: ReviewIssueCode,
  message: string,
) {
  const slot = board.scqa[field];

  if (!hasText(slot.text)) {
    issues.push({ code, message, targetId: slot.id });
  }
}

function addTouchedEmptyIssue(issues: ReviewIssue[], item: { id: string; text: string; touched: boolean }) {
  if (item.touched && !hasText(item.text)) {
    issues.push({
      code: "empty-touched-item",
      message: "Remove this item or add content.",
      targetId: item.id,
    });
  }
}

function addNeedsDataIssue(issues: ReviewIssue[], argument: SupportingArgument) {
  const activeData = argument.data.filter((item) => hasText(item.text));

  if (argument.mode === "evidence-backed" && hasText(argument.text) && activeData.length === 0) {
    issues.push({
      code: "needs-data",
      message: "Add at least one data or fact item for this evidence-backed reason.",
      targetId: argument.id,
    });
  }
}

function addEvidenceIssue(issues: ReviewIssue[], item: SupportingDataFact) {
  if (!hasText(item.text)) {
    return;
  }

  if (!hasText(item.evidenceLink)) {
    issues.push({
      code: "needs-evidence-link",
      message: "Add a link where this data or fact can be checked.",
      targetId: item.id,
    });
    return;
  }

  if (!isValidEvidenceLink(item.evidenceLink)) {
    issues.push({
      code: "invalid-evidence-link",
      message: "Use a valid http:// or https:// evidence link.",
      targetId: item.id,
    });
  }
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}
