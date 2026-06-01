import { describe, expect, test } from "bun:test";
import { createDefaultBoard } from "./argument-board";
import { createExportFile, createExportFileName, exportFileContract, parseExportFile } from "./export-file-contract";

describe("Export File contract", () => {
  test("owns schema metadata, filename policy, and readable JSON export", () => {
    const file = createExportFile({ ...createDefaultBoard(), title: "Dinner Recommendation" });

    expect(exportFileContract).toMatchObject({
      appName: "Argument Maker",
      currentSchemaVersion: 1,
      extension: ".argument.json",
      mimeType: "application/json",
    });
    expect(file.name).toBe("dinner-recommendation.argument.json");
    expect(file.mimeType).toBe("application/json");
    expect(file.contents).toContain("\n  ");
  });

  test("keeps validation and future migration entrypoint behind one interface", () => {
    const board = createDefaultBoard();
    const imported = parseExportFile(JSON.stringify(board));

    expect(imported.ok).toBe(true);
    expect(imported.ok ? imported.board.schemaVersion : undefined).toBe(1);
    expect(parseExportFile("{")).toEqual({
      ok: false,
      message: "This is not a readable Argument Board file.",
    });
    expect(parseExportFile(JSON.stringify({ schemaVersion: 999, appName: "Argument Maker" }))).toEqual({
      ok: false,
      message: "Unsupported Argument Board file version.",
    });
  });

  test("falls back to the default filename for empty or unsafe titles", () => {
    expect(createExportFileName("")).toBe("untitled-argument.argument.json");
    expect(createExportFileName("!!!")).toBe("untitled-argument.argument.json");
  });
});
