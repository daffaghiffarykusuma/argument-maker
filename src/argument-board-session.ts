import {
  applyArgumentBoardCommand,
  createDefaultBoard,
  type ArgumentBoard,
  type ArgumentBoardCommand,
} from "./argument-board";
import { createExportFile, parseExportFile } from "./export-file-contract";
import { generateMermaidPreview, generateOutline } from "./output";
import { reviewBoard } from "./review";

export type ViewMode = "board" | "preview";

export function createArgumentBoardSession(initialBoard = createDefaultBoard()) {
  let board = initialBoard;
  let mode: ViewMode = "board";
  const undoStack: ArgumentBoard[] = [];
  const redoStack: ArgumentBoard[] = [];

  function commit(nextBoard: ArgumentBoard) {
    if (nextBoard === board) {
      return;
    }

    undoStack.push(board);
    redoStack.length = 0;
    board = nextBoard;
  }

  return {
    snapshot() {
      return {
        board,
        mode,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        issues: reviewBoard(board),
      };
    },
    setMode(nextMode: ViewMode) {
      mode = nextMode;
    },
    dispatch(command: ArgumentBoardCommand) {
      commit(applyArgumentBoardCommand(board, command));
    },
    undo() {
      const previous = undoStack.pop();
      if (!previous) {
        return;
      }

      redoStack.push(board);
      board = previous;
    },
    redo() {
      const next = redoStack.pop();
      if (!next) {
        return;
      }

      undoStack.push(board);
      board = next;
    },
    clear() {
      commit(createDefaultBoard());
      return { cleared: true };
    },
    importFile(contents: string) {
      const result = parseExportFile(contents);
      if (result.ok) {
        commit(result.board);
      }
      return result;
    },
    exportFile() {
      return createExportFile(board);
    },
    copyOutline() {
      return generateOutline(board);
    },
    copyMermaid() {
      return generateMermaidPreview(board);
    },
    hasTouchedContent() {
      return hasTouchedContent(board);
    },
  };
}

export type ArgumentBoardSession = ReturnType<typeof createArgumentBoardSession>;

export function hasTouchedContent(value: ArgumentBoard): boolean {
  return (
    value.title.trim().length > 0 ||
    Object.values(value.scqa).some((slot) => slot.touched && slot.text.trim().length > 0) ||
    Boolean(value.scqa.situation.evidenceLink?.trim() || value.scqa.complication.evidenceLink?.trim()) ||
    value.supportingArguments.some(
      (argument) =>
        (argument.touched && argument.text.trim().length > 0) ||
        argument.data.some(
          (item) =>
            (item.touched && item.text.trim().length > 0) ||
            item.evidenceLink.trim().length > 0 ||
            item.dataType !== "",
        ),
    )
  );
}
