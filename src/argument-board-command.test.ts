import { describe, expect, test } from "bun:test";
import { applyArgumentBoardCommand, createDefaultBoard } from "./argument-board";

describe("Argument Board commands", () => {
  test("applies board commands through one interface", () => {
    let board = createDefaultBoard();
    board = applyArgumentBoardCommand(board, {
      type: "update-scqa",
      field: "answer",
      text: "Yes, recommend it.",
    });
    const argumentId = board.supportingArguments[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-supporting-argument",
      argumentId,
      changes: { text: "The menu works for groups.", mode: "evidence-backed" },
    });
    const dataId = board.supportingArguments[0]!.data[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-supporting-data-fact",
      argumentId,
      dataId,
      changes: { text: "A platter serves four people.", evidenceLink: "https://example.com", dataType: "fact" },
    });
    board = applyArgumentBoardCommand(board, { type: "duplicate-supporting-argument", argumentId });

    expect(board.scqa.answer.text).toBe("Yes, recommend it.");
    expect(board.supportingArguments[0]!.mode).toBe("evidence-backed");
    expect(board.supportingArguments[0]!.data[0]!.dataType).toBe("fact");
    expect(board.supportingArguments[1]!.text).toBe("The menu works for groups.");
  });

  test("returns the same board for an unknown support target", () => {
    const board = createDefaultBoard();
    expect(applyArgumentBoardCommand(board, { type: "move-supporting-argument", argumentId: "missing", direction: "up" })).toBe(
      board,
    );
  });
});
