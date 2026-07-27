import type { ArgumentBoard } from "./argument-board";
import { projectArgumentPreview, type ArgumentPreviewFact } from "./argument-preview-projection";

export function generateOutline(board: ArgumentBoard): string {
  const preview = projectArgumentPreview(board);
  const lines: string[] = [`# ${board.title.trim() || "Untitled argument"}`, ""];
  const incompleteEvidence: string[] = [];

  for (const item of preview.chain) {
    lines.push(`${item.label}: ${item.text}`);
    appendFacts(lines, incompleteEvidence, item.label, item.facts);
  }

  lines.push("");

  for (const argument of preview.arguments) {
    lines.push(`${argument.label}: ${argument.text}`);
    lines.push(`Support Mode: ${argument.supportMode}`);
    appendFacts(lines, incompleteEvidence, argument.label, argument.facts);
    lines.push("");
  }

  if (incompleteEvidence.length > 0) {
    lines.push("Incomplete Evidence", ...incompleteEvidence);
  }

  return lines.join("\n").trimEnd();
}

function appendFacts(
  lines: string[],
  incompleteEvidence: string[],
  destinationLabel: string,
  facts: ArgumentPreviewFact[],
) {
  for (const fact of facts) {
    const displayText = [fact.text.trim(), ...fact.markers].filter(Boolean).join(" ");
    lines.push(`- ${displayText}`);

    if (fact.dataType) {
      lines.push(`  Data Type: ${fact.formattedDataType}`);
    }

    if (fact.evidenceLinkIsValid) {
      lines.push(`  Evidence Link: ${fact.evidenceLink}`);
    } else if (fact.evidenceLink.trim()) {
      lines.push("  Evidence Link: [Invalid evidence link]");
    } else {
      lines.push("  Evidence Link: [Needs evidence link]");
    }

    if (fact.markers.length > 0) {
      incompleteEvidence.push(`- ${destinationLabel}: ${displayText}`);
    }
  }
}
