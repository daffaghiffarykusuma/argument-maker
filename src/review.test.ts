import { describe, expect, test } from "bun:test";
import { applyArgumentBoardCommand, createDefaultBoard, type ArgumentBoard } from "./argument-board";
import { reviewBoard } from "./review";

describe("Argument Board review", () => {
  test("keeps unused incomplete facts out of argument readiness", () => {
    let board = completeFrame(createDefaultBoard());
    board = applyArgumentBoardCommand(board, { type: "create-gathered-fact" });

    expect(reviewBoard(board)).toEqual([]);
  });

  test("reports one canonical issue for an incomplete fact reused across destinations", () => {
    let board = completeFrame(createDefaultBoard());
    board = applyArgumentBoardCommand(board, { type: "create-gathered-fact", destinationId: "situation" });
    const factId = board.gatheredFacts[0]!.id;
    board = {
      ...board,
      supportingArguments: board.supportingArguments.map((argument, index) =>
        index === 0 ? { ...argument, factIds: [factId] } : argument,
      ),
    };

    const factIssues = reviewBoard(board).filter((issue) => issue.targetId === factId);

    expect(factIssues).toEqual([
      {
        code: "incomplete-attached-fact",
        message: "Complete this fact; it is used in Situation and Supporting Argument 1.",
        targetId: factId,
        fieldMessages: ["Add fact text.", "Add an evidence link."],
      },
    ]);
  });

  test("requires one complete fact for evidence-backed support", () => {
    let board = completeFrame(createDefaultBoard());
    const argumentId = board.supportingArguments[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-supporting-argument",
      argumentId,
      changes: { mode: "evidence-backed" },
    });

    expect(reviewBoard(board)).toContainEqual({
      code: "needs-complete-fact",
      message: "Attach at least one complete fact to this evidence-backed reason.",
      targetId: argumentId,
    });

    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      evidenceLink: "https://example.com/source",
    });
    const factId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId,
      changes: { text: "Complete evidence" },
    });
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: argumentId, factId });

    expect(reviewBoard(board)).toEqual([]);
  });

  test("gives exact guidance for an attached fact with an invalid link", () => {
    let board = completeFrame(createDefaultBoard());
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      destinationId: "complication",
      evidenceLink: "not-a-url",
    });
    const factId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId,
      changes: { text: "A claim with a broken source" },
    });

    expect(reviewBoard(board).find((issue) => issue.targetId === factId)?.fieldMessages).toEqual([
      "Use a valid http:// or https:// evidence link.",
    ]);
  });

  test("keeps structural SCQA and Supporting Argument guidance", () => {
    const issues = reviewBoard(createDefaultBoard());

    expect(issues.map((issue) => issue.code)).toEqual([
      "missing-situation",
      "missing-complication",
      "missing-question",
      "missing-answer",
      "missing-supporting-argument",
    ]);
  });
});

function completeFrame(initial: ArgumentBoard): ArgumentBoard {
  let board = initial;
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "situation", text: "Demand is rising." });
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "complication", text: "Capacity is fixed." });
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "question", text: "What should change?" });
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "answer", text: "Expand capacity." });
  board = applyArgumentBoardCommand(board, {
    type: "update-supporting-argument",
    argumentId: board.supportingArguments[0]!.id,
    changes: { text: "The gap is material." },
  });
  return board;
}
