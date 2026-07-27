import { describe, expect, test } from "bun:test";
import { applyArgumentBoardCommand, createDefaultBoard } from "./argument-board";
import { generateOutline } from "./output";

describe("Argument Board outputs", () => {
  test("copies attached facts by destination order, repeats reuse, and omits unused research", () => {
    let board = { ...createDefaultBoard(), title: "Capacity case" };
    board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "situation", text: "Demand is rising." });
    board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "complication", text: "Capacity is fixed." });
    board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "question", text: "What should change?" });
    board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "answer", text: "Expand capacity." });
    const argumentId = board.supportingArguments[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-supporting-argument",
      argumentId,
      changes: { text: "The gap is material.", mode: "evidence-backed" },
    });
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      evidenceLink: "https://example.com/report",
    });
    const reusedId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: reusedId,
      changes: { text: "Demand rose 20%.", dataType: "fact" },
    });
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: "situation", factId: reusedId });
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: argumentId, factId: reusedId });
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      evidenceLink: "https://example.com/unused",
    });
    const unusedId = board.gatheredFacts.at(-1)!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: unusedId,
      changes: { text: "Unused research" },
    });
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      destinationId: "complication",
      evidenceLink: "not-a-url",
    });
    const incompleteId = board.gatheredFacts.at(-1)!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: incompleteId,
      changes: { text: "Capacity has not changed.", dataType: "observation" },
    });

    const outline = generateOutline(board);

    expect(outline).toContain("# Capacity case");
    expect(outline).toContain("Situation: Demand is rising.");
    expect(outline).toContain("- Demand rose 20%.");
    expect(outline).toContain("  Data Type: Fact");
    expect(outline).toContain("  Evidence Link: https://example.com/report");
    expect(outline).toContain("- Capacity has not changed. [Invalid evidence link]");
    expect(outline).toContain("Incomplete Evidence");
    expect(outline).not.toContain("Unused research");
    expect((outline.match(/Demand rose 20%\./g) ?? [])).toHaveLength(2);
  });
});
