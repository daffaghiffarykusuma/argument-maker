import { describe, expect, test } from "bun:test";
import { createDefaultBoard, updateScqaField, updateSupportingArgument, updateSupportingDataFact } from "./argument-board";
import { createArgumentBoardViewModel } from "./argument-board-view-model";

describe("Argument Board view model", () => {
  test("returns render-ready labels, active support, review state, and preview data", () => {
    let board = createDefaultBoard();
    board = updateScqaField(board, "answer", "Yes, recommend it.");
    const argumentId = board.supportingArguments[0]!.id;
    board = updateSupportingArgument(board, argumentId, {
      text: "The menu works for groups.",
      mode: "evidence-backed",
    });
    const dataId = board.supportingArguments[0]!.data[0]!.id;
    board = updateSupportingDataFact(board, argumentId, dataId, {
      text: "The menu has a shared platter.",
      evidenceLink: "not-a-url",
    });

    const view = createArgumentBoardViewModel({ board, mode: "preview", canUndo: true, canRedo: false, issues: [] });

    expect(view.scqa[0]!.label).toBe("What is happening?");
    expect(view.supportingArguments[0]!.data[0]!.previewLabel).toContain("invalid evidence link");
    expect(view.preview.mermaid).toContain("flowchart TD");
    expect(view.toolbar.canUndo).toBe(true);
    expect(view.mode).toBe("preview");
  });
});
