import {
  factCompleteness,
  isValidEvidenceLink,
  type ArgumentBoard,
  type DataType,
  type FactIncompleteReason,
  type GatheredFact,
  type SupportingArgument,
} from "./argument-board";

export interface ArgumentPreviewProjection {
  chain: ArgumentPreviewChainItem[];
  arguments: ArgumentPreviewArgument[];
  evidenceGroups: ArgumentPreviewEvidenceGroup[];
  mermaid: string;
}

export interface ArgumentPreviewChainItem {
  id: string;
  label: string;
  text: string;
  facts: ArgumentPreviewFact[];
}

export interface ArgumentPreviewArgument {
  id: string;
  label: string;
  text: string;
  supportMode: string;
  facts: ArgumentPreviewFact[];
}

export interface ArgumentPreviewEvidenceGroup {
  id: string;
  label: string;
  facts: ArgumentPreviewFact[];
}

export interface ArgumentPreviewFact {
  id: string;
  text: string;
  label: string;
  evidenceLink: string;
  evidenceLinkIsValid: boolean;
  dataType: DataType;
  formattedDataType: string;
  markers: string[];
}

export function projectArgumentPreview(board: ArgumentBoard): ArgumentPreviewProjection {
  const chain: ArgumentPreviewChainItem[] = [
    {
      id: "situation",
      label: "Situation",
      text: board.scqa.situation.text,
      facts: projectFacts(board, board.scqa.situation.factIds),
    },
    {
      id: "complication",
      label: "Complication",
      text: board.scqa.complication.text,
      facts: projectFacts(board, board.scqa.complication.factIds),
    },
    { id: "question", label: "Question", text: board.scqa.question.text, facts: [] },
    { id: "answer", label: "Answer", text: board.scqa.answer.text, facts: [] },
  ];
  const argumentsView = activeArguments(board).map(({ argument, index }) => ({
    id: argument.id,
    label: `Supporting Argument ${index + 1}`,
    text: argument.text,
    supportMode: formatSupportMode(argument.mode),
    facts: projectFacts(board, argument.factIds),
  }));
  const evidenceGroups = [
    ...chain.filter((item) => item.facts.length > 0).map(({ id, label, facts }) => ({ id, label, facts })),
    ...argumentsView
      .filter((argument) => argument.facts.length > 0)
      .map(({ id, label, facts }) => ({ id, label, facts })),
  ];

  return {
    chain,
    arguments: argumentsView,
    evidenceGroups,
    mermaid: generateMermaid(chain, argumentsView),
  };
}

function activeArguments(board: ArgumentBoard): Array<{ argument: SupportingArgument; index: number }> {
  return board.supportingArguments
    .map((argument, index) => ({ argument, index }))
    .filter(({ argument }) => argument.text.trim() || argument.touched || argument.factIds.length > 0);
}

function projectFacts(board: ArgumentBoard, factIds: string[]): ArgumentPreviewFact[] {
  const factsById = new Map(board.gatheredFacts.map((fact) => [fact.id, fact]));

  return factIds.flatMap((factId) => {
    const fact = factsById.get(factId);
    return fact ? [projectFact(fact)] : [];
  });
}

function projectFact(fact: GatheredFact): ArgumentPreviewFact {
  const markers = factCompleteness(fact).map(formatIncompleteReason);
  const text = fact.text.trim();
  const labelParts = [text, ...markers].filter(Boolean);
  const content = labelParts.join(" ");

  return {
    id: fact.id,
    text: fact.text,
    label: fact.dataType ? `${formatDataType(fact.dataType)}: ${content}` : content,
    evidenceLink: fact.evidenceLink,
    evidenceLinkIsValid: isValidEvidenceLink(fact.evidenceLink),
    dataType: fact.dataType,
    formattedDataType: formatDataType(fact.dataType),
    markers,
  };
}

function formatIncompleteReason(reason: FactIncompleteReason): string {
  const markers: Record<FactIncompleteReason, string> = {
    "needs-text": "[Needs fact text]",
    "needs-link": "[Needs evidence link]",
    "invalid-link": "[Invalid evidence link]",
  };

  return markers[reason];
}

function generateMermaid(chain: ArgumentPreviewChainItem[], argumentsView: ArgumentPreviewArgument[]): string {
  const lines = ["flowchart TD"];

  for (const item of chain) {
    addMermaidNode(lines, item.id, item.text || item.label);
  }

  lines.push("  situation --> complication");
  lines.push("  complication --> question");
  lines.push("  question --> answer");

  for (const item of chain) {
    addFactNodes(lines, item.id, item.facts);
  }

  for (const argument of argumentsView) {
    addMermaidNode(lines, argument.id, argument.text || argument.label);
    lines.push(`  answer --> ${mermaidId(argument.id)}`);
    addFactNodes(lines, argument.id, argument.facts);
  }

  return lines.join("\n");
}

function addFactNodes(lines: string[], destinationId: string, facts: ArgumentPreviewFact[]) {
  facts.forEach((fact, index) => {
    const placementId = `${destinationId}-fact-${index + 1}-${fact.id}`;
    addMermaidNode(lines, placementId, fact.label);
    lines.push(`  ${mermaidId(destinationId)} --> ${mermaidId(placementId)}`);
  });
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
