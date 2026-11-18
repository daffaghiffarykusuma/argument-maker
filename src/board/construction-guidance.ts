import type { ArgumentBoard } from "./argument-board";

/**
 * Prompts that help an author construct an Argument. They suggest; they never
 * block a stage or affect Structural completeness.
 */

export type StartingStep = "frame" | "gather" | "reason" | "preview";

/** The next step to suggest above the construction editor. Every tab stays available. */
export function suggestStartingStep(board: ArgumentBoard): StartingStep {
  if (!board.scqa.question.text.trim() && !board.scqa.answer.text.trim()) return "frame";
  if (board.gatheredFacts.length === 0) return "gather";
  if (!board.supportingArguments.some((argument) => argument.text.trim())) return "reason";
  return "preview";
}

/** A prompt for a narrative field the author visited and left empty. */
export function narrativeGuidance(board: ArgumentBoard, field: keyof ArgumentBoard["scqa"]): string {
  if (!board.scqa[field].touched || board.scqa[field].text.trim()) return "";
  return {
    question: "Add the question you want your argument to answer.",
    answer: "Add a tentative claim or main answer when you are ready.",
    situation: "Describe the context your reader needs.",
    complication: "Explain what changed or makes this matter.",
  }[field];
}

/** Whether the live outline has anything to show yet. */
export function hasOutlineContent(board: ArgumentBoard): boolean {
  return Object.values(board.scqa).some((slot) => slot.text.trim()) || board.supportingArguments.some((argument) => argument.text.trim());
}
