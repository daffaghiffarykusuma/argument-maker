import {
  applyArgumentBoardCommand,
  createDefaultBoard,
  type ArgumentBoard,
  type ArgumentBoardCommand,
} from "./argument-board";
import { exportBoardFile, importBoardFile, type ExportedBoardFile, type ImportBoardFileResult } from "./board-file";
import { generateMermaidPreview, generateOutline } from "./output";
import { reviewBoard, type ReviewIssue } from "./review";

export type ViewMode = "board" | "preview";

export interface ArgumentBoardSessionSnapshot {
  board: ArgumentBoard;
  mode: ViewMode;
  canUndo: boolean;
  canRedo: boolean;
  issues: ReviewIssue[];
}

export interface ArgumentBoardSession {
  snapshot(): ArgumentBoardSessionSnapshot;
  setMode(mode: ViewMode): void;
  dispatch(command: ArgumentBoardCommand, options?: { rerender?: boolean }): void;
  undo(): void;
  redo(): void;
  clear(): { cleared: boolean };
  importFile(contents: string): ImportBoardFileResult;
  exportFile(): ExportedBoardFile;
  copyOutline(): string;
  copyMermaid(): string;
  hasTouchedContent(): boolean;
}

export function createArgumentBoardSession(initialBoard = createDefaultBoard()): ArgumentBoardSession {
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
    setMode(nextMode) {
      mode = nextMode;
    },
    dispatch(command) {
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
    importFile(contents) {
      const result = importBoardFile(contents);
      if (result.ok) {
        commit(result.board);
      }
      return result;
    },
    exportFile() {
      return exportBoardFile(board);
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

export function hasTouchedContent(value: ArgumentBoard): boolean {
  return (
    value.title.trim().length > 0 ||
    Object.values(value.scqa).some((slot) => slot.touched && slot.text.trim().length > 0) ||
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
