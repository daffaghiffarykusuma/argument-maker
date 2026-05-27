import type { ArgumentBoard, DataType, SupportMode, SupportingArgument, SupportingDataFact } from "./argument-board";
import { isValidEvidenceLink } from "./review";

export function generateOutline(board: ArgumentBoard): string {
  const lines: string[] = [];
  const incompleteEvidence: string[] = [];

  lines.push(`# ${board.title.trim() || "Untitled argument"}`);
  lines.push("");
  lines.push(`Situation: ${board.scqa.situation.text}`);
  lines.push(`Complication: ${board.scqa.complication.text}`);
  lines.push(`Question: ${board.scqa.question.text}`);
  lines.push(`Answer: ${board.scqa.answer.text}`);
  lines.push("");

  for (const [argumentIndex, argument] of activeArguments(board).entries()) {
    lines.push(`Supporting Argument ${argumentIndex + 1}: ${argument.text}`);
    lines.push(`Support Mode: ${formatSupportMode(argument.mode)}`);

    for (const item of activeData(argument)) {
      lines.push(`- ${item.text}`);

      if (item.dataType) {
        lines.push(`  Data Type: ${formatDataType(item.dataType)}`);
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

export function generateMermaidPreview(board: ArgumentBoard): string {
  const lines = ["flowchart TD"];

  addMermaidNode(lines, "situation", board.scqa.situation.text || "Situation");
  addMermaidNode(lines, "complication", board.scqa.complication.text || "Complication");
  addMermaidNode(lines, "question", board.scqa.question.text || "Question");
  addMermaidNode(lines, "answer", board.scqa.answer.text || "Answer");
  lines.push("  situation --> complication");
  lines.push("  complication --> question");
  lines.push("  question --> answer");

  for (const argument of activeArguments(board)) {
    const label = argument.mode === "evidence-backed" && activeData(argument).length === 0
      ? `${argument.text} [needs data]`
      : argument.text;
    addMermaidNode(lines, argument.id, label);
    lines.push(`  answer --> ${mermaidId(argument.id)}`);

    for (const item of argument.data) {
      if (!hasText(item.text) && !item.touched) {
        continue;
      }

      addMermaidNode(lines, item.id, dataFactPreviewLabel(item));
      lines.push(`  ${mermaidId(argument.id)} --> ${mermaidId(item.id)}`);
    }
  }

  return lines.join("\n");
}

function dataFactPreviewLabel(item: SupportingDataFact): string {
  if (!hasText(item.text)) {
    return "[empty]";
  }

  if (!hasText(item.evidenceLink)) {
    return `${item.text} [needs evidence link]`;
  }

  if (!isValidEvidenceLink(item.evidenceLink)) {
    return `${item.text} [invalid evidence link]`;
  }

  return item.text;
}

function activeArguments(board: ArgumentBoard): SupportingArgument[] {
  return board.supportingArguments.filter((argument) => hasText(argument.text) || argument.touched);
}

function activeData(argument: SupportingArgument): SupportingDataFact[] {
  return argument.data.filter((item) => hasText(item.text) || item.touched);
}

function addMermaidNode(lines: string[], id: string, label: string) {
  lines.push(`  ${mermaidId(id)}["${escapeMermaidLabel(label)}"]`);
}

function mermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function escapeMermaidLabel(label: string): string {
  return label.replace(/"/g, '\\"');
}

function formatSupportMode(mode: SupportMode): string {
  return mode === "evidence-backed" ? "Evidence-backed" : "Reasoning / Interpretation";
}

function formatDataType(type: DataType): string {
  const labels: Record<Exclude<DataType, "">, string> = {
    fact: "Fact",
    observation: "Observation",
    example: "Example",
    estimate: "Estimate",
  };

  return type ? labels[type] : "Unspecified";
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}
