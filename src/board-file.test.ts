import { describe, expect, test } from "bun:test";
import {
  createDefaultBoard,
  updateScqaField,
  updateSupportingArgument,
  updateSupportingDataFact,
} from "./argument-board";
import { exportBoardFile, importBoardFile } from "./board-file";

describe("Argument Board file persistence", () => {
  test("exports and imports a human-inspectable .argument.json board file without hidden personal data", () => {
    let board = createDefaultBoard(new Date("2026-05-27T09:00:00.000Z"));
    board = updateScqaField(board, "answer", "Yes, recommend it.", new Date("2026-05-27T09:01:00.000Z"));
    const argumentId = board.supportingArguments[0]!.id;
    board = updateSupportingArgument(
      board,
      argumentId,
      { text: "It works for groups.", mode: "evidence-backed" },
      new Date("2026-05-27T09:02:00.000Z"),
    );
    const dataId = board.supportingArguments[0]!.data[0]!.id;
    board = updateSupportingDataFact(
      board,
      argumentId,
      dataId,
      {
        text: "The menu has a shared platter.",
        evidenceLink: "https://example.com/menu",
        dataType: "fact",
      },
      new Date("2026-05-27T09:03:00.000Z"),
    );

    const file = exportBoardFile(board);
    const parsed = JSON.parse(file.contents) as Record<string, unknown>;
    const imported = importBoardFile(file.contents);

    expect(file.name).toBe("untitled-argument.argument.json");
    expect(parsed["schemaVersion"]).toBe(1);
    expect(parsed["appName"]).toBe("Argument Maker");
    expect(file.contents).toContain("\n  ");
    expect(file.contents).not.toContain("device");
    expect(file.contents).not.toContain("analytics");
    expect(file.contents).not.toContain("telemetry");
    expect(imported.ok).toBe(true);
    expect(imported.ok ? imported.board.scqa.answer.text : "").toBe("Yes, recommend it.");
    expect(imported.ok ? imported.board.supportingArguments[0]!.data[0]!.evidenceLink : "").toBe(
      "https://example.com/menu",
    );
  });

  test("rejects invalid and unsupported board files with clear messages", () => {
    expect(importBoardFile("{").ok).toBe(false);
    expect(importBoardFile(JSON.stringify({ schemaVersion: 999, appName: "Argument Maker" }))).toEqual({
      ok: false,
      message: "Unsupported Argument Board file version.",
    });
    expect(
      importBoardFile(
        JSON.stringify({
          schemaVersion: 1,
          appName: "Argument Maker",
          title: "Broken",
          createdAt: "2026-05-27T09:00:00.000Z",
          updatedAt: "2026-05-27T09:00:00.000Z",
          scqa: {},
          supportingArguments: [{ id: "argument-1", text: "Reason", touched: true, mode: "reasoning" }],
        }),
      ),
    ).toEqual({
      ok: false,
      message: "This Argument Board file is missing required data.",
    });
  });

  test("preserves reasonable unknown future fields during import and export", () => {
    const board = createDefaultBoard();
    const futureFile = JSON.stringify({
      ...board,
      futureLayoutPreference: { zoom: 0.9 },
    });

    const imported = importBoardFile(futureFile);
    expect(imported.ok).toBe(true);
    const importedBoard = imported.ok ? (imported.board as typeof imported.board & { futureLayoutPreference: { zoom: number } }) : undefined;
    expect(importedBoard?.futureLayoutPreference.zoom).toBe(0.9);
    expect(imported.ok ? exportBoardFile(imported.board).contents : "").toContain("futureLayoutPreference");
  });
});
