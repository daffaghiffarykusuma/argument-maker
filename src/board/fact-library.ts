import {
  factCompleteness,
  factUsageLabels,
  isGatheredFactComplete,
  readFactAttachments,
  type ArgumentBoard,
  type FactDestinationId,
  type FactIncompleteReason,
  type GatheredFact,
} from "./argument-board";

/**
 * Board-level rules for Gather Facts and Fact Attachments: what can be
 * attached where, how a fact is being used, what deleting it affects, and
 * which step to suggest next. Renderers only turn these answers into markup.
 */

export type FactFilter = "all" | "unused" | "incomplete";

export function filterFacts(board: ArgumentBoard, query: string, filter: FactFilter) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return board.gatheredFacts.filter((fact) => {
    if (filter === "unused" && factUsageLabels(board, fact.id).length > 0) return false;
    if (filter === "incomplete" && isGatheredFactComplete(fact)) return false;
    const text = [fact.text, fact.evidenceLink, fact.descriptiveCitation, fact.sourceTitle, fact.sourceDate, fact.quotation, fact.dataType]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

export function incompleteGuidance(reason: FactIncompleteReason): string {
  return {
    "needs-text": "Add fact text.",
    "needs-link": "Add an evidence link or descriptive citation.",
    "invalid-link": "Use a valid http:// or https:// evidence link.",
  }[reason];
}

export function usedFactCount(board: ArgumentBoard): number {
  return board.gatheredFacts.filter((fact) => factUsageLabels(board, fact.id).length > 0).length;
}

/** Where a fact sits in the library and how far a change to it reaches. */
export function describeFact(board: ArgumentBoard, fact: GatheredFact) {
  const incomplete = factCompleteness(fact);
  return {
    number: board.gatheredFacts.indexOf(fact) + 1,
    usage: factUsageLabels(board, fact.id),
    incomplete,
    guidance: incomplete.map(incompleteGuidance),
  };
}

export type AttachmentCandidateStatus = "attached" | "incomplete" | "available";

/** Every Gathered Fact matching the picker's search, with whether it can be attached to this destination. */
export function attachmentCandidates(board: ArgumentBoard, destinationId: FactDestinationId, query: string) {
  const attached = new Set(readFactAttachments(board, destinationId).attachedFacts.map((fact) => fact.id));
  return filterFacts(board, query, "all").map((fact) => {
    const description = describeFact(board, fact);
    const status: AttachmentCandidateStatus = attached.has(fact.id) ? "attached" : description.incomplete.length ? "incomplete" : "available";
    return { fact, status, ...description };
  });
}

/** Why a destination can or cannot take another fact, and which unfinished fact to complete. */
export function attachmentAvailability(board: ArgumentBoard, destinationId: FactDestinationId) {
  const { attachedFacts, attachableFacts: available } = readFactAttachments(board, destinationId);
  const attachedIds = new Set(attachedFacts.map((fact) => fact.id));
  const unfinished = board.gatheredFacts.find((fact) => !attachedIds.has(fact.id) && !isGatheredFactComplete(fact));
  const allCompleteAttached = available.length === 0 && attachedFacts.some(isGatheredFactComplete);
  let message = "Choose a gathered fact to attach it here.";
  if (!board.gatheredFacts.length) message = "No facts gathered yet. Create a fact here to start gathering evidence.";
  else if (available.length === 0) {
    message = allCompleteAttached ? "All complete facts are already attached here." : "The gathered facts are already attached here. Complete them below or create another fact.";
  }
  if (unfinished) message = `${allCompleteAttached ? "All complete facts are already attached here. " : ""}Finish an incomplete fact to attach it.`;
  return { available, message, unfinished };
}

/** What deleting a fact removes, and which fact should take focus afterwards. */
export function factDeletionImpact(board: ArgumentBoard, factId: string) {
  const index = board.gatheredFacts.findIndex((fact) => fact.id === factId);
  if (index < 0) return undefined;
  return {
    usage: factUsageLabels(board, factId),
    nextFocusFactId: board.gatheredFacts[index + 1]?.id ?? board.gatheredFacts[index - 1]?.id,
  };
}
