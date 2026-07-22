import type { ArgumentBoard } from "./argument-board";
import { projectArgumentPreview } from "./argument-preview-projection";

export function generateOutline(board: ArgumentBoard): string {
  const preview = projectArgumentPreview(board);
  const lines: string[] = [];
  const incompleteEvidence: string[] = [];

  lines.push(`# ${board.title.trim() || "Untitled argument"}`);
  lines.push("");
  lines.push(`Situation: ${board.scqa.situation.text}`);
  if (board.scqa.situation.evidenceLink?.trim()) lines.push(`Situation Evidence: ${board.scqa.situation.evidenceLink}`);
  lines.push(`Complication: ${board.scqa.complication.text}`);
  if (board.scqa.complication.evidenceLink?.trim()) lines.push(`Complication Evidence: ${board.scqa.complication.evidenceLink}`);
  lines.push(`Question: ${board.scqa.question.text}`);
  lines.push(`Answer: ${board.scqa.answer.text}`);
  lines.push("");

  for (const argument of preview.arguments) {
    lines.push(`${argument.label}: ${argument.text.replace(" [needs data]", "")}`);
    lines.push(`Support Mode: ${argument.supportMode}`);

    for (const item of argument.data) {
      lines.push(`- ${item.text}`);

      if (item.dataType) {
        lines.push(`  Data Type: ${item.formattedDataType}`);
      }

      if (item.evidenceLink.trim()) {
        lines.push(`  Evidence Link: ${item.evidenceLink}`);
      } else {
        lines.push("  Evidence Link: [needs evidence link]");
        incompleteEvidence.push(item.text);
      }
    }

    lines.push("");
  }

  if (incompleteEvidence.length > 0) {
    lines.push("Incomplete Evidence");

    for (const item of incompleteEvidence) {
      lines.push(`- ${item}`);
    }
  }

  return lines.join("\n").trimEnd();
}
