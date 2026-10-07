import { type ArgumentBoard, type GatheredFact } from "./argument-board";
import { projectArgumentPreview, type ArgumentPreviewFact } from "./argument-preview-projection";
import { createExportFileName } from "./export-file-contract";

export interface WritingSection { label: string; text: string; supportMode?: string; facts: Array<{ text: string; citation: number; markers: string[] }>; notes: Array<{ label: string; text: string }> }
export interface WritingDocument { title: string; sections: WritingSection[]; sources: Array<GatheredFact & Pick<ArgumentPreviewFact, "sourceReferenceStatus" | "formattedDataType"> & { citation: number }> }

export function projectWritingDocument(board: ArgumentBoard): WritingDocument {
  const preview = projectArgumentPreview(board);
  const sources: WritingDocument["sources"] = [];
  const sections = [...preview.chain, ...preview.arguments].map((item) => {
    const argument = board.supportingArguments.find(({ id }) => id === item.id);
    return {
      label: item.label,
      text: item.text,
      supportMode: preview.arguments.find(({ id }) => id === item.id)?.supportMode,
      facts: item.facts.map((fact) => {
        let source = sources.find(({ id }) => id === fact.id);
        if (!source) {
          source = {
            ...board.gatheredFacts.find(({ id }) => id === fact.id)!,
            citation: sources.length + 1,
            sourceReferenceStatus: fact.sourceReferenceStatus,
            formattedDataType: fact.formattedDataType,
          };
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

export function createWritingExport(board: ArgumentBoard, format: "markdown" | "text", options: { draft?: boolean; purpose?: "outline" } = {}) {
  const doc = projectWritingDocument(board);
  const markdown = format === "markdown";
  const text = (value: string) => markdown ? escapeMarkdown(value) : value;
  const lines = [markdown ? `# ${text(doc.title)}` : doc.title, ""];
  if (options.draft) lines.push("Draft", "");
  for (const section of doc.sections) {
    lines.push(markdown ? `## ${section.label}` : section.label, text(section.text || "[Not written]"));
    if (options.purpose === "outline" && section.supportMode) lines.push(`Support Mode: ${section.supportMode}`);
    for (const fact of section.facts) lines.push(`- ${text(fact.text || "[Needs fact text]")} [${fact.citation}] ${fact.markers.join(" ")}`.trimEnd());
    if (options.purpose !== "outline") {
      for (const note of section.notes) lines.push(`${note.label}: ${text(note.text)}`);
    }
    lines.push("");
  }
  lines.push(markdown ? "## Sources" : "Sources");
  if (!doc.sources.length) lines.push("No facts attached.");
  for (const source of doc.sources) {
    lines.push(`[${source.citation}] ${text(source.sourceTitle?.trim() || source.text || "Untitled source")}`);
    if (source.sourceReferenceStatus === "valid-link") lines.push(markdown ? `<${new URL(source.evidenceLink).href}>` : source.evidenceLink);
    else if (source.sourceReferenceStatus !== "citation-only") lines.push("[Missing or invalid evidence link]");
    if (source.descriptiveCitation?.trim()) lines.push(`Descriptive citation: ${text(source.descriptiveCitation)}`);
    if (source.dataType) lines.push(`Data Type: ${source.formattedDataType}`);
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
