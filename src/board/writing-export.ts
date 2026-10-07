import { isValidEvidenceLink, type ArgumentBoard, type GatheredFact } from "./argument-board";
import { projectArgumentPreview } from "./argument-preview-projection";
import { createExportFileName } from "./export-file-contract";

export interface WritingSection { label: string; text: string; facts: Array<{ text: string; citation: number; markers: string[] }>; notes: Array<{ label: string; text: string }> }
export interface WritingDocument { title: string; sections: WritingSection[]; sources: Array<GatheredFact & { citation: number }> }

export function projectWritingDocument(board: ArgumentBoard): WritingDocument {
  const preview = projectArgumentPreview(board);
  const sources: WritingDocument["sources"] = [];
  const sections = [...preview.chain, ...preview.arguments].map((item) => {
    const argument = board.supportingArguments.find(({ id }) => id === item.id);
    return {
      label: item.label,
      text: item.text,
      facts: item.facts.map((fact) => {
        let source = sources.find(({ id }) => id === fact.id);
        if (!source) {
          source = { ...board.gatheredFacts.find(({ id }) => id === fact.id)!, citation: sources.length + 1 };
          sources.push(source);
        }
        return { text: fact.text, citation: source.citation, markers: fact.markers };
      }),
      notes: argument ? [
        { label: "How this supports the answer", text: argument.connection ?? "" },
        { label: "Assumptions", text: argument.assumptions ?? "" },
        { label: "Possible objection", text: argument.objection ?? "" },
        { label: "What would weaken the claim", text: argument.weakensClaim ?? "" },
      ].filter(({ text }) => text.trim()) : [],
    };
  });
  return { title: board.title.trim() || "Untitled argument", sections, sources };
}

export function createWritingExport(board: ArgumentBoard, format: "markdown" | "text") {
  const doc = projectWritingDocument(board);
  const markdown = format === "markdown";
  const text = (value: string) => markdown ? escapeMarkdown(value) : value;
  const lines = [markdown ? `# ${text(doc.title)}` : doc.title, ""];
  for (const section of doc.sections) {
    lines.push(markdown ? `## ${section.label}` : section.label, text(section.text || "[Not written]"));
    for (const fact of section.facts) lines.push(`- ${text(fact.text || "[Needs fact text]")} [${fact.citation}] ${fact.markers.join(" ")}`.trimEnd());
    for (const note of section.notes) lines.push(`${note.label}: ${text(note.text)}`);
    lines.push("");
  }
  lines.push(markdown ? "## Sources" : "Sources");
  if (!doc.sources.length) lines.push("No facts attached.");
  for (const source of doc.sources) {
    lines.push(`[${source.citation}] ${text(source.sourceTitle?.trim() || source.text || "Untitled source")}`);
    if (isValidEvidenceLink(source.evidenceLink)) lines.push(markdown ? `<${new URL(source.evidenceLink).href}>` : source.evidenceLink);
    else if (source.evidenceLink.trim() || !source.descriptiveCitation?.trim()) lines.push("[Missing or invalid evidence link]");
    if (source.descriptiveCitation?.trim()) lines.push(`Descriptive citation: ${text(source.descriptiveCitation)}`);
    if (source.dataType) lines.push(`Data Type: ${source.dataType[0]!.toUpperCase()}${source.dataType.slice(1)}`);
    if (source.sourceDate) lines.push(`Source date: ${text(source.sourceDate)}`);
    if (source.quotation) lines.push(`Quotation: ${text(source.quotation)}`);
    lines.push("");
  }
  lines.push("Link format checked; source quality and factual accuracy are not verified.");
  return { name: createExportFileName(board.title).replace(/\.argument\.json$/, markdown ? ".md" : ".txt"), mimeType: markdown ? "text/markdown" : "text/plain", contents: `${lines.join("\n")}\n` };
}

function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}\[\]<>#!|~]/g, "\\$&");
}
