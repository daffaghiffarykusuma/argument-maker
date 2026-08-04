import {
  factCompleteness,
  factUsageLabels,
  isGatheredFactComplete,
  readFactAttachments,
  type ArgumentBoard,
  type FactIncompleteReason,
  type SupportingArgument,
} from "./argument-board";

export type ReviewIssueCode =
  | "missing-situation"
  | "missing-complication"
  | "missing-question"
  | "missing-answer"
  | "missing-supporting-argument"
  | "empty-touched-item"
  | "needs-complete-fact"
  | "incomplete-attached-fact";

export interface ReviewIssue {
  code: ReviewIssueCode;
  message: string;
  targetId: string;
  fieldMessages?: string[];
}

export function reviewBoard(board: ArgumentBoard): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  addMissingScqaIssue(issues, board, "situation", "missing-situation", "Add what is happening.");
  addMissingScqaIssue(issues, board, "complication", "missing-complication", "Add what changed or makes this matter.");
  addMissingScqaIssue(issues, board, "question", "missing-question", "Add the question this argument must answer.");
  addMissingScqaIssue(issues, board, "answer", "missing-answer", "Add your main answer.");

  if (!board.supportingArguments.some((argument) => hasText(argument.text))) {
    issues.push({
      code: "missing-supporting-argument",
      message: "Add at least one reason someone should believe the answer.",
      targetId: "supporting-arguments",
    });
  }

  for (const argument of board.supportingArguments) {
    addTouchedEmptyIssue(issues, argument);

    if (
      argument.mode === "evidence-backed" &&
      hasText(argument.text) &&
      !readFactAttachments(board, argument.id).attachedFacts.some(isGatheredFactComplete)
    ) {
      issues.push({
        code: "needs-complete-fact",
        message: "Attach at least one complete fact to this evidence-backed reason.",
        targetId: argument.id,
      });
    }
  }

  for (const fact of board.gatheredFacts) {
    const usageLabels = factUsageLabels(board, fact.id);
    const incompleteReasons = factCompleteness(fact);

    if (usageLabels.length === 0 || incompleteReasons.length === 0) {
      continue;
    }

    issues.push({
      code: "incomplete-attached-fact",
      message: `Complete this fact; it is used in ${formatList(usageLabels)}.`,
      targetId: fact.id,
      fieldMessages: incompleteReasons.map(fieldMessage),
    });
  }

  return issues;
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

function addTouchedEmptyIssue(issues: ReviewIssue[], item: SupportingArgument) {
  if (item.touched && !hasText(item.text)) {
    issues.push({
      code: "empty-touched-item",
      message: "Remove this item or add content.",
      targetId: item.id,
    });
  }
}

function fieldMessage(reason: FactIncompleteReason): string {
  const messages: Record<FactIncompleteReason, string> = {
    "needs-text": "Add fact text.",
    "needs-link": "Add an evidence link.",
    "invalid-link": "Use a valid http:// or https:// evidence link.",
  };

  return messages[reason];
}

function formatList(items: string[]): string {
  if (items.length < 2) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}
