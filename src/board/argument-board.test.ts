import { describe, expect, test } from "bun:test";
import {
  applyArgumentBoardCommand,
  createDefaultBoard,
  factCompleteness,
  isGatheredFactComplete,
  readFactAttachments,
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

  test("reads ordered attachments and attachable canonical facts through one seam", () => {
    const initial = createDefaultBoard();
    const destinationId = initial.supportingArguments[0]!.id;
    const facts = [
      { id: "fact-1", text: "First", touched: true, evidenceLink: "https://example.com/1", dataType: "fact" as const },
      { id: "fact-2", text: "Second", touched: true, evidenceLink: "https://example.com/2", dataType: "fact" as const },
      { id: "fact-3", text: "Draft", touched: true, evidenceLink: "", dataType: "" as const },
      { id: "fact-4", text: "Available", touched: true, evidenceLink: "https://example.com/4", dataType: "" as const },
    ];
    const board = {
      ...initial,
      gatheredFacts: facts,
      supportingArguments: initial.supportingArguments.map((argument) =>
        argument.id === destinationId ? { ...argument, factIds: ["fact-2", "missing-fact", "fact-1"] } : argument,
      ),
    };

    const attachments = readFactAttachments(board, destinationId);

    expect(attachments.label).toBe("Supporting Argument 1");
    expect(attachments.attachedFacts).toEqual([facts[1]!, facts[0]!]);
    expect(attachments.attachableFacts).toEqual([facts[3]!]);
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
