import { describe, expect, test } from "bun:test";
import {
  applyArgumentBoardCommand,
  createDefaultBoard,
  factCompleteness,
  factUsageLabels,
  isGatheredFactComplete,
} from "./argument-board";

describe("Argument Board", () => {
  test("starts as an empty version-2 fact library with three reasoning slots", () => {
    const board = createDefaultBoard(new Date("2026-07-27T00:00:00.000Z"));

    expect(board.schemaVersion).toBe(2);
    expect(board.gatheredFacts).toEqual([]);
    expect(board.scqa.situation.factIds).toEqual([]);
    expect(board.scqa.complication.factIds).toEqual([]);
    expect(board.supportingArguments).toHaveLength(3);
    expect(board.supportingArguments.every((argument) => argument.mode === "reasoning")).toBe(true);
    expect(board.supportingArguments.every((argument) => argument.factIds.length === 0)).toBe(true);
  });

  test("creates, completes, copies the source of, edits, and reorders canonical facts", () => {
    let board = createDefaultBoard();
    board = applyArgumentBoardCommand(board, { type: "create-gathered-fact" });
    const firstId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: firstId,
      changes: {
        text: "Demand increased by 20%.",
        evidenceLink: "https://example.com/report",
        dataType: "fact",
      },
    });
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      evidenceLink: board.gatheredFacts[0]!.evidenceLink,
    });
    const secondId = board.gatheredFacts[1]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: secondId,
      changes: { text: "A second finding." },
    });
    board = applyArgumentBoardCommand(board, {
      type: "move-gathered-fact",
      factId: secondId,
      direction: "up",
    });

    expect(board.gatheredFacts.map((fact) => fact.id)).toEqual([secondId, firstId]);
    expect(board.gatheredFacts[0]).toMatchObject({
      text: "A second finding.",
      evidenceLink: "https://example.com/report",
      dataType: "",
    });
    expect(isGatheredFactComplete(board.gatheredFacts[1]!)).toBe(true);
    expect(factCompleteness(board.gatheredFacts[0]!)).toEqual([]);
  });

  test("attaches complete facts, reuses them, and keeps destination orders independent", () => {
    let board = createDefaultBoard();
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      evidenceLink: "https://example.com/one",
    });
    const firstId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: firstId,
      changes: { text: "First fact" },
    });
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      evidenceLink: "https://example.com/two",
    });
    const secondId = board.gatheredFacts[1]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: secondId,
      changes: { text: "Second fact" },
    });
    const argumentId = board.supportingArguments[0]!.id;

    for (const factId of [firstId, secondId]) {
      board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: "situation", factId });
      board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: argumentId, factId });
    }
    board = applyArgumentBoardCommand(board, {
      type: "move-attached-fact",
      destinationId: argumentId,
      factId: secondId,
      direction: "up",
    });
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: "situation", factId: firstId });

    expect(board.scqa.situation.factIds).toEqual([firstId, secondId]);
    expect(board.supportingArguments[0]!.factIds).toEqual([secondId, firstId]);
    expect(factUsageLabels(board, firstId)).toEqual(["Situation", "Supporting Argument 1"]);
  });

  test("creates and attaches an incomplete fact atomically, then detaches without deleting it", () => {
    let board = createDefaultBoard();
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      destinationId: "complication",
    });
    const factId = board.gatheredFacts[0]!.id;

    expect(board.scqa.complication.factIds).toEqual([factId]);
    expect(factCompleteness(board.gatheredFacts[0]!)).toEqual(["needs-text", "needs-link"]);

    board = applyArgumentBoardCommand(board, {
      type: "detach-fact",
      destinationId: "complication",
      factId,
    });

    expect(board.scqa.complication.factIds).toEqual([]);
    expect(board.gatheredFacts.map((fact) => fact.id)).toEqual([factId]);
  });

  test("deleting a used fact removes every reference and undo-ready state stays immutable", () => {
    let board = createDefaultBoard();
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      destinationId: "situation",
      evidenceLink: "https://example.com/source",
    });
    const factId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId,
      changes: { text: "Shared fact" },
    });
    const beforeDelete = applyArgumentBoardCommand(board, {
      type: "attach-fact",
      destinationId: board.supportingArguments[0]!.id,
      factId,
    });
    const deleted = applyArgumentBoardCommand(beforeDelete, { type: "delete-gathered-fact", factId });

    expect(deleted.gatheredFacts).toEqual([]);
    expect(deleted.scqa.situation.factIds).toEqual([]);
    expect(deleted.supportingArguments[0]!.factIds).toEqual([]);
    expect(beforeDelete.gatheredFacts[0]!.text).toBe("Shared fact");
  });

  test("preserves supporting argument editing, movement, duplication, and deletion", () => {
    let board = createDefaultBoard();
    const firstId = board.supportingArguments[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-supporting-argument",
      argumentId: firstId,
      changes: { text: "A reason", mode: "evidence-backed" },
    });
    board = applyArgumentBoardCommand(board, { type: "duplicate-supporting-argument", argumentId: firstId });
    const copyId = board.supportingArguments[1]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "move-supporting-argument",
      argumentId: copyId,
      direction: "down",
    });
    board = applyArgumentBoardCommand(board, { type: "delete-supporting-argument", argumentId: firstId });

    expect(board.supportingArguments.some((argument) => argument.id === firstId)).toBe(false);
    expect(board.supportingArguments.some((argument) => argument.id === copyId)).toBe(true);
  });
});
