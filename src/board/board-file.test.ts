import { describe, expect, test } from "bun:test";
import { applyArgumentBoardCommand, createDefaultBoard, type ArgumentBoard } from "./argument-board";
import { createExportFile, createExportFileName, parseExportFile } from "./export-file-contract";

describe("Argument Board file persistence", () => {
  test("round-trips canonical facts, reused order, incomplete drafts, and unknown fields", () => {
    let board = createDefaultBoard(new Date("2026-07-27T09:00:00.000Z"));
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      evidenceLink: "https://example.com/report",
    });
    const completeId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: completeId,
      changes: { text: "Demand increased.", dataType: "fact" },
    });
    board = applyArgumentBoardCommand(board, { type: "create-gathered-fact" });
    const incompleteId = board.gatheredFacts[1]!.id;
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: "situation", factId: completeId });
    board = applyArgumentBoardCommand(board, {
      type: "attach-fact",
      destinationId: board.supportingArguments[0]!.id,
      factId: completeId,
    });

    const withUnknowns = {
      ...board,
      futureLayout: { zoom: 0.9 },
      gatheredFacts: board.gatheredFacts.map((fact) =>
        fact.id === completeId ? { ...fact, sourceTitle: "Annual report" } : fact,
      ),
      scqa: {
        ...board.scqa,
        situation: { ...board.scqa.situation, futureTone: "direct" },
      },
      supportingArguments: board.supportingArguments.map((argument, index) =>
        index === 0 ? { ...argument, futureGroup: "primary" } : argument,
      ),
    } as ArgumentBoard;

    const file = createExportFile(withUnknowns);
    const result = parseExportFile(file.contents);

    expect(file.name).toBe("untitled-argument.argument.json");
    expect(createExportFileName("Evidence Plan")).toBe("evidence-plan.argument.json");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.board.schemaVersion).toBe(2);
    expect(result.board.gatheredFacts.map((fact) => fact.id)).toEqual([completeId, incompleteId]);
    expect(result.board.scqa.situation.factIds).toEqual([completeId]);
    expect(result.board.supportingArguments[0]!.factIds).toEqual([completeId]);
    expect(createExportFile(result.board).contents).toContain('"futureLayout"');
    expect(createExportFile(result.board).contents).toContain('"sourceTitle"');
    expect(createExportFile(result.board).contents).toContain('"futureTone"');
    expect(createExportFile(result.board).contents).toContain('"futureGroup"');
    expect(createExportFile(result.board).contents).not.toContain('"data"');
  });

  test("rejects version 1 and every invalid identity or reference relationship", () => {
    expect(parseExportFile(JSON.stringify({ schemaVersion: 1, appName: "Argument Maker" }))).toEqual({
      ok: false,
      message: "Unsupported Argument Board file version.",
    });

    const valid = createDefaultBoard();
    const fact = {
      id: "fact-1",
      text: "",
      touched: true,
      evidenceLink: "",
      dataType: "",
    } as const;
    const cases: unknown[] = [
      { ...valid, gatheredFacts: [fact, fact] },
      {
        ...valid,
        supportingArguments: [{ ...valid.supportingArguments[0] }, { ...valid.supportingArguments[0] }],
      },
      {
        ...valid,
        gatheredFacts: [{ ...fact, id: valid.supportingArguments[0]!.id }],
      },
      {
        ...valid,
        supportingArguments: [{ ...valid.supportingArguments[0], id: "situation" }],
      },
      { ...valid, scqa: { ...valid.scqa, situation: { ...valid.scqa.situation, id: "wrong" } } },
      { ...valid, scqa: { ...valid.scqa, situation: { ...valid.scqa.situation, factIds: ["missing"] } } },
      {
        ...valid,
        gatheredFacts: [fact],
        scqa: { ...valid.scqa, situation: { ...valid.scqa.situation, factIds: ["fact-1", "fact-1"] } },
      },
      { ...valid, gatheredFacts: [{ ...fact, dataType: "unsupported" }] },
      { ...valid, supportingArguments: [{ ...valid.supportingArguments[0], mode: "unsupported" }] },
    ];

    for (const invalid of cases) {
      expect(parseExportFile(JSON.stringify(invalid))).toEqual({
        ok: false,
        message: "This Argument Board file is missing required data.",
      });
    }
  });

  test("rejects malformed input without inventing a board", () => {
    expect(parseExportFile("{")).toEqual({
      ok: false,
      message: "This is not a readable Argument Board file.",
    });
    expect(parseExportFile("null")).toEqual({
      ok: false,
      message: "This Argument Board file is missing required data.",
    });
  });
});
