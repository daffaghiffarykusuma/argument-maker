import { factUsageLabels, isGatheredFactComplete, type ArgumentBoard } from "./argument-board";

export type FactFilter = "all" | "unused" | "incomplete";

export function filterFacts(board: ArgumentBoard, query: string, filter: FactFilter) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return board.gatheredFacts.filter((fact) => {
    if (filter === "unused" && factUsageLabels(board, fact.id).length > 0) return false;
    if (filter === "incomplete" && isGatheredFactComplete(fact)) return false;
    const text = [fact.text, fact.evidenceLink, fact.sourceTitle, fact.sourceDate, fact.quotation, fact.dataType]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
