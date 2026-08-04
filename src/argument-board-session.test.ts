import { describe, expect, test } from "bun:test";
import { applyArgumentBoardCommand, createDefaultBoard } from "./argument-board";
import { createArgumentBoardSession } from "./argument-board-session";
import { createExportFile } from "./export-file-contract";

describe("Argument Board session", () => {
  test("opens in Gather Facts and treats create-and-attach as one history action", () => {
    const session = createArgumentBoardSession();

    expect(session.snapshot().stage).toBe("gather");
    session.dispatch({ type: "create-gathered-fact", destinationId: "situation" });
    expect(session.snapshot().board.gatheredFacts).toHaveLength(1);
    expect(session.snapshot().board.scqa.situation.factIds).toHaveLength(1);

    session.undo();
    expect(session.snapshot().board.gatheredFacts).toEqual([]);
    expect(session.snapshot().board.scqa.situation.factIds).toEqual([]);

    session.redo();
    expect(session.snapshot().board.gatheredFacts).toHaveLength(1);
    expect(session.snapshot().board.scqa.situation.factIds).toHaveLength(1);
  });

  test("restores every placement when a cascading delete is undone", () => {
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
    board = applyArgumentBoardCommand(board, {
      type: "attach-fact",
      destinationId: board.supportingArguments[0]!.id,
      factId,
    });
    const session = createArgumentBoardSession(board);

    session.dispatch({ type: "delete-gathered-fact", factId });
    expect(session.snapshot().board.gatheredFacts).toEqual([]);

    session.undo();
    expect(session.snapshot().board.gatheredFacts[0]!.id).toBe(factId);
    expect(session.snapshot().board.scqa.situation.factIds).toEqual([factId]);
    expect(session.snapshot().board.supportingArguments[0]!.factIds).toEqual([factId]);
  });

  test("makes Clear Board and valid import replacement undoable while rejected imports preserve history", () => {
    const session = createArgumentBoardSession();
    session.dispatch({ type: "update-scqa", field: "answer", text: "Current answer" });
    session.clear();
    expect(session.snapshot().board.scqa.answer.text).toBe("");
    session.undo();
    expect(session.snapshot().board.scqa.answer.text).toBe("Current answer");

    let confirmationCount = 0;
    const rejectReplacement = () => {
      confirmationCount += 1;
      return false;
    };
    const failed = session.importFile("{", rejectReplacement);
    expect(failed).toEqual({ ok: false, message: "This is not a readable Argument Board file." });
    expect(confirmationCount).toBe(0);
    expect(session.snapshot().board.scqa.answer.text).toBe("Current answer");
    expect(session.snapshot().canRedo).toBe(true);

    const importedFile = createExportFile({ ...createDefaultBoard(), title: "Imported board" });
    expect(session.importFile(importedFile.contents, rejectReplacement)).toBeUndefined();
    expect(confirmationCount).toBe(1);
    expect(session.snapshot().board.scqa.answer.text).toBe("Current answer");
    expect(session.snapshot().canRedo).toBe(true);

    expect(session.importFile(importedFile.contents, () => true)?.ok).toBe(true);
    expect(session.snapshot().board.title).toBe("Imported board");
    session.undo();
    expect(session.snapshot().board.scqa.answer.text).toBe("Current answer");
    session.redo();
    expect(session.snapshot().board.title).toBe("Imported board");
  });

  test("recognizes gathered facts and references as touched local content", () => {
    const session = createArgumentBoardSession();
    expect(session.hasTouchedContent()).toBe(false);
    session.dispatch({ type: "create-gathered-fact" });
    expect(session.hasTouchedContent()).toBe(true);
  });
});
