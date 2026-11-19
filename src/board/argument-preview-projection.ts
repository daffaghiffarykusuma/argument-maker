import {
  factCompleteness,
  isValidEvidenceLink,
  readFactAttachments,
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
  /** Reading order with numbered sources, shared by the readable outline, print, review and Writing exports. */
  writing: WritingDocument;
}

export interface WritingSection {
  label: string;
  text: string;
  supportMode?: string;
  facts: Array<{ text: string; citation: number; markers: string[] }>;
  notes: Array<{ label: string; text: string }>;
}

export interface WritingDocument {
  title: string;
  sections: WritingSection[];
  /** One entry per canonical Gathered Fact, numbered by first placement. */
  sources: Array<GatheredFact & Pick<ArgumentPreviewFact, "sourceReferenceStatus" | "formattedDataType"> & { citation: number }>;
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
  descriptiveCitation?: string;
  sourceReferenceStatus: "valid-link" | "citation-only" | "invalid-link" | "missing";
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
      facts: projectFacts(board, "situation"),
    },
    {
      id: "complication",
      label: "Complication",
      text: board.scqa.complication.text,
      facts: projectFacts(board, "complication"),
    },
    { id: "question", label: "Question", text: board.scqa.question.text, facts: [] },
    { id: "answer", label: "Answer", text: board.scqa.answer.text, facts: [] },
  ];
  const active = activeArguments(board);
  const argumentsView = active.map(({ argument, index }) => ({
    id: argument.id,
    label: `Supporting Argument ${index + 1}`,
    text: argument.text,
    supportMode: formatSupportMode(argument.mode),
    facts: projectFacts(board, argument.id),
  }));
  const evidenceGroups = [
    ...chain.filter((item) => item.facts.length > 0).map(({ id, label, facts }) => ({ id, label, facts })),
    ...argumentsView.filter((argument) => argument.facts.length > 0).map(({ id, label, facts }) => ({ id, label, facts })),
  ];

  return {
    chain,
    arguments: argumentsView,
    evidenceGroups,
    mermaid: generateMermaid(chain, argumentsView),
    writing: projectWriting(
      board,
      chain,
      argumentsView,
      active.map(({ argument }) => argument),
    ),
  };
}

function projectWriting(
  board: ArgumentBoard,
  chain: ArgumentPreviewChainItem[],
  argumentsView: ArgumentPreviewArgument[],
  activeSupportingArguments: SupportingArgument[],
): WritingDocument {
  const factsById = new Map(board.gatheredFacts.map((fact) => [fact.id, fact]));
  const sources: WritingDocument["sources"] = [];
  const cite = (fact: ArgumentPreviewFact) => {
    let source = sources.find(({ id }) => id === fact.id);
    if (!source) {
      source = {
        ...factsById.get(fact.id)!,
        citation: sources.length + 1,
        sourceReferenceStatus: fact.sourceReferenceStatus,
        formattedDataType: fact.formattedDataType,
      };
      sources.push(source);
    }
    return { text: fact.text, citation: source.citation, markers: fact.markers };
  };
  const sections: WritingSection[] = [
    ...chain.map((item) => ({ label: item.label, text: item.text, facts: item.facts.map(cite), notes: [] })),
    ...argumentsView.map((item, index) => ({
      label: item.label,
      text: item.text,
      supportMode: item.supportMode,
      facts: item.facts.map(cite),
      notes: reasoningNotes(activeSupportingArguments[index]!),
    })),
  ];
  return { title: board.title.trim() || "Untitled argument", sections, sources };
}

function reasoningNotes(argument: SupportingArgument): WritingSection["notes"] {
  return [
    { label: "How this supports the answer", text: argument.connection ?? "" },
    { label: "Assumptions", text: argument.assumptions ?? "" },
    { label: "Possible objection", text: argument.objection ?? "" },
    { label: "What would weaken the claim", text: argument.weakensClaim ?? "" },
  ].filter(({ text }) => text.trim());
}

function activeArguments(board: ArgumentBoard): Array<{ argument: SupportingArgument; index: number }> {
  return board.supportingArguments
    .map((argument, index) => ({ argument, index }))
    .filter(({ argument }) => argument.text.trim() || argument.touched || argument.factIds.length > 0);
}

function projectFacts(board: ArgumentBoard, destinationId: string): ArgumentPreviewFact[] {
  return readFactAttachments(board, destinationId).attachedFacts.map(projectFact);
}

function projectFact(fact: GatheredFact): ArgumentPreviewFact {
  const markers = factCompleteness(fact).map(formatIncompleteReason);
  const text = fact.text.trim();
  const labelParts = [text, ...markers].filter(Boolean);
  const content = labelParts.join(" ");
  const sourceReferenceStatus = isValidEvidenceLink(fact.evidenceLink)
    ? "valid-link"
    : fact.evidenceLink.trim()
      ? "invalid-link"
      : fact.descriptiveCitation?.trim()
        ? "citation-only"
        : "missing";

  return {
    id: fact.id,
    text: fact.text,
    label: fact.dataType ? `${formatDataType(fact.dataType)}: ${content}` : content,
    evidenceLink: fact.evidenceLink,
    descriptiveCitation: fact.descriptiveCitation,
    sourceReferenceStatus,
    dataType: fact.dataType,
    formattedDataType: formatDataType(fact.dataType),
    markers,
  };
}

function formatIncompleteReason(reason: FactIncompleteReason): string {
  const markers: Record<FactIncompleteReason, string> = {
    "needs-text": "[Needs fact text]",
    "needs-link": "[Needs evidence link or descriptive citation]",
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
  // Mermaid entities keep HTML, quotes and directives inert until label rendering.
  // Backslashes do not escape Mermaid quotes, and literal # can introduce entities.
  // Its style preprocessor also runs on labels, so hide those keywords from it.
  return label.replace(/["%<>&#]|style|classDef/g, (value) => `#${value.codePointAt(0)};${value.slice(1)}`);
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
