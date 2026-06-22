import { describe, expect, test } from "bun:test";
import { createDefaultBoard } from "./argument-board";
import { createArgumentBoardSession } from "./argument-board-session";
import { createExportFile } from "./export-file-contract";

describe("Argument Board session", () => {
  test("concentrates commands, history, outputs, clear, and import replacement", () => {
    const session = createArgumentBoardSession(createDefaultBoard());
    session.dispatch({ type: "update-scqa", field: "answer", text: "Yes, recommend it." });

    expect(session.snapshot().board.scqa.answer.text).toBe("Yes, recommend it.");
    expect(session.snapshot().canUndo).toBe(true);
    expect(session.copyOutline()).toContain("Yes, recommend it.");

    session.undo();
    expect(session.snapshot().board.scqa.answer.text).toBe("");
    expect(session.snapshot().canRedo).toBe(true);

    session.redo();
    expect(session.exportFile().name).toBe("untitled-argument.argument.json");
    expect(session.clear().cleared).toBe(true);
    expect(session.snapshot().board.scqa.answer.text).toBe("");

    const importedFile = createExportFile({
      ...createDefaultBoard(),
      title: "Imported board",
    });
    const result = session.importFile(importedFile.contents);
    expect(result.ok).toBe(true);
    expect(session.snapshot().board.title).toBe("Imported board");
  });

  test("knows whether the current board has touched content", () => {
    const session = createArgumentBoardSession();
    expect(session.hasTouchedContent()).toBe(false);

    session.dispatch({ type: "update-scqa", field: "question", text: "Should we recommend it?" });
    expect(session.hasTouchedContent()).toBe(true);
  });

  test("opens with the Argument Preview visible in the Command Desk workspace", () => {
    const session = createArgumentBoardSession();

    expect(session.snapshot().mode).toBe("preview");
  });
});
