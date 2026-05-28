import type { SupportingArgument, SupportingDataFact } from "./argument-board";
import { isValidEvidenceLink } from "./review";

export function previewArgumentLabel(argument: SupportingArgument): string {
  if (argument.mode === "evidence-backed" && hasText(argument.text) && !argument.data.some((item) => hasText(item.text))) {
    return `${argument.text} [needs data]`;
  }

  return argument.text;
}

export function previewDataLabel(item: Pick<SupportingDataFact, "text" | "evidenceLink">): string {
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

export function hasPreviewText(value: string): boolean {
  return hasText(value);
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}
