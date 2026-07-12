import { describe, expect, test } from "bun:test";
import {
  createDefaultBoard,
  updateScqaEvidenceLink,
  updateScqaField,
  updateSupportingArgument,
  updateSupportingDataFact,
} from "./argument-board";
import { generateMermaidPreview, generateOutline } from "./output";

describe("Argument Board outputs", () => {
  test("generates a drafting outline that preserves hierarchy and incomplete evidence markers", () => {
    let board = createDefaultBoard();
    board = { ...board, title: "Restaurant review" };
    board = updateScqaField(board, "situation", "A group needs a dinner venue.");
    board = updateScqaField(board, "complication", "Shared meals need to be good value.");
    board = updateScqaField(board, "question", "Should we recommend it?");
    board = updateScqaField(board, "answer", "Yes, for group dinners.");
    board = updateScqaEvidenceLink(board, "situation", "https://example.com/demand");
    const argumentId = board.supportingArguments[0]!.id;
    board = updateSupportingArgument(board, argumentId, {
      text: "The menu supports sharing.",
      mode: "evidence-backed",
    });
    const dataId = board.supportingArguments[0]!.data[0]!.id;
    board = updateSupportingDataFact(board, argumentId, dataId, {
      text: "A platter serves four people.",
      dataType: "fact",
    });

    const outline = generateOutline(board);

    expect(outline).toContain("# Restaurant review");
    expect(outline).toContain("Situation: A group needs a dinner venue.");
    expect(outline).toContain("Situation Evidence: https://example.com/demand");
    expect(outline).toContain("Supporting Argument 1: The menu supports sharing.");
    expect(outline).toContain("Support Mode: Evidence-backed");
    expect(outline).toContain("Data Type: Fact");
    expect(outline).toContain("Incomplete Evidence");
    expect(outline).toContain("A platter serves four people.");
  });

  test("generates Mermaid-compatible preview text with readiness markers and no untouched empty slots", () => {
    let board = createDefaultBoard();
    board = updateScqaField(board, "situation", "A group needs a dinner venue.");
    board = updateScqaField(board, "complication", "Shared meals need to be good value.");
    board = updateScqaField(board, "question", "Should we recommend it?");
    board = updateScqaField(board, "answer", "Yes, for group dinners.");
    const argumentId = board.supportingArguments[0]!.id;
    board = updateSupportingArgument(board, argumentId, {
      text: "The menu supports sharing.",
      mode: "evidence-backed",
    });

    const mermaid = generateMermaidPreview(board);

    expect(mermaid).toStartWith("flowchart TD");
    expect(mermaid).toContain("The menu supports sharing. [needs data]");
    expect(mermaid).not.toContain("argument-2");
    expect(mermaid).not.toContain("argument-3-data-1");
  });
});
