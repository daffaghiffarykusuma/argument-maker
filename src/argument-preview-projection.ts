import type { ArgumentBoard, DataType, SupportingArgument, SupportingDataFact } from "./argument-board";

export type EvidenceState = "empty" | "needs-link" | "invalid-link" | "complete";

export interface ArgumentPreviewProjection {
  chain: Array<{ label: string; text: string }>;
  arguments: ArgumentPreviewArgument[];
  mermaid: string;
}

export interface ArgumentPreviewArgument {
  id: string;
  label: string;
  text: string;
  supportMode: string;
  data: ArgumentPreviewDataFact[];
}

export interface ArgumentPreviewDataFact {
  id: string;
  text: string;
  label: string;
  evidenceLink: string;
  dataType: DataType;
  formattedDataType: string;
  evidenceState: EvidenceState;
}

export function projectArgumentPreview(board: ArgumentBoard): ArgumentPreviewProjection {
  const chain = [
    { label: "Situation", text: board.scqa.situation.text },
    { label: "Complication", text: board.scqa.complication.text },
    { label: "Question", text: board.scqa.question.text },
    { label: "Answer", text: board.scqa.answer.text },
  ];
  const projectedArguments = activeArguments(board).map((argument, index) => ({
    id: argument.id,
    label: `Supporting Argument ${index + 1}`,
    text: previewArgumentLabel(argument),
    supportMode: formatSupportMode(argument.mode),
    data: activeData(argument).map(projectDataFact),
  }));

  return {
    chain,
    arguments: projectedArguments,
    mermaid: generateMermaid(chain, projectedArguments),
  };
}

export function isValidEvidenceLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function activeArguments(board: ArgumentBoard): SupportingArgument[] {
  return board.supportingArguments.filter((argument) => hasText(argument.text) || argument.touched);
}

function activeData(argument: SupportingArgument): SupportingDataFact[] {
  return argument.data.filter((item) => hasText(item.text) || item.touched);
}

function projectDataFact(item: SupportingDataFact): ArgumentPreviewDataFact {
  const evidenceState = getEvidenceState(item);

  return {
    id: item.id,
    text: item.text,
    label: previewDataLabel(item, evidenceState),
    evidenceLink: item.evidenceLink,
    dataType: item.dataType,
    formattedDataType: formatDataType(item.dataType),
    evidenceState,
  };
}

function previewArgumentLabel(argument: SupportingArgument): string {
  if (argument.mode === "evidence-backed" && hasText(argument.text) && !argument.data.some((item) => hasText(item.text))) {
    return `${argument.text} [needs data]`;
  }

  return argument.text;
}

function previewDataLabel(item: Pick<SupportingDataFact, "text" | "evidenceLink">, evidenceState = getEvidenceState(item)): string {
  if (evidenceState === "empty") {
    return "[empty]";
  }

  if (evidenceState === "needs-link") {
    return `${item.text} [needs evidence link]`;
  }

  if (evidenceState === "invalid-link") {
    return `${item.text} [invalid evidence link]`;
  }

  return item.text;
}

function getEvidenceState(item: Pick<SupportingDataFact, "text" | "evidenceLink">): EvidenceState {
  if (!hasText(item.text)) {
    return "empty";
  }

  if (!hasText(item.evidenceLink)) {
    return "needs-link";
  }

  return isValidEvidenceLink(item.evidenceLink) ? "complete" : "invalid-link";
}

function generateMermaid(chain: ArgumentPreviewProjection["chain"], argumentsView: ArgumentPreviewArgument[]): string {
  const lines = ["flowchart TD"];

  for (const item of chain) {
    addMermaidNode(lines, item.label.toLowerCase(), item.text || item.label);
  }

  lines.push("  situation --> complication");
  lines.push("  complication --> question");
  lines.push("  question --> answer");

  for (const argument of argumentsView) {
    addMermaidNode(lines, argument.id, argument.text);
    lines.push(`  answer --> ${mermaidId(argument.id)}`);

    for (const item of argument.data) {
      addMermaidNode(lines, item.id, item.label);
      lines.push(`  ${mermaidId(argument.id)} --> ${mermaidId(item.id)}`);
    }
  }

  return lines.join("\n");
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

function formatSupportMode(mode: SupportingArgument["mode"]): string {
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
