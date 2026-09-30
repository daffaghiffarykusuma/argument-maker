import {
  applyArgumentBoardCommand,
  createDefaultBoard,
  type ArgumentBoard,
  type ArgumentBoardCommand,
} from "./argument-board";
import { projectArgumentPreview } from "./argument-preview-projection";
import { createExportFile, parseExportFile } from "./export-file-contract";
import { reviewBoard } from "./review";

export type WorkflowStage = "gather" | "construct" | "preview";

export function createArgumentBoardSession(initialBoard = createDefaultBoard()) {
  let board = initialBoard;
  let stage: WorkflowStage = "gather";
  const undoStack: ArgumentBoard[] = [];
  const redoStack: ArgumentBoard[] = [];
  let editGroup: string | undefined;

  function commit(nextBoard: ArgumentBoard, group?: string) {
    if (nextBoard === board) {
      return;
    }

    if (!group || group !== editGroup) undoStack.push(board);
    editGroup = group;
    redoStack.length = 0;
    board = nextBoard;
  }

  return {
    snapshot() {
      return {
        board,
        stage,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        issues: reviewBoard(board),
      };
    },
    setStage(nextStage: WorkflowStage) {
      stage = nextStage;
    },
    dispatch(command: ArgumentBoardCommand, group?: string) {
      commit(applyArgumentBoardCommand(board, command), group);
      return board;
    },
    finishEdit() {
      editGroup = undefined;
    },
    undo() {
      editGroup = undefined;
      const previous = undoStack.pop();
      if (!previous) {
        return;
      }

      redoStack.push(board);
      board = previous;
    },
    redo() {
      editGroup = undefined;
      const next = redoStack.pop();
      if (!next) {
        return;
      }

      undoStack.push(board);
      board = next;
    },
    clear() {
      commit(createDefaultBoard());
    },
    importFile(contents: string, confirmReplacement: () => boolean) {
      const result = parseExportFile(contents);
      if (!result.ok) {
        return result;
      }

      if (hasTouchedContent(board) && !confirmReplacement()) {
        return;
      }

      commit(result.board);
      return result;
    },
    exportFile() {
      return createExportFile(board);
    },
    copyOutline() {
      return projectArgumentPreview(board).outline;
    },
    copyMermaid() {
      return projectArgumentPreview(board).mermaid;
    },
    hasTouchedContent() {
      return hasTouchedContent(board);
    },
  };
}

export type ArgumentBoardSession = ReturnType<typeof createArgumentBoardSession>;

export function hasTouchedContent(board: ArgumentBoard): boolean {
  return (
    board.title.trim().length > 0 ||
    board.gatheredFacts.length > 0 ||
    Object.values(board.scqa).some((slot) => slot.touched || slot.text.trim().length > 0) ||
    board.scqa.situation.factIds.length > 0 ||
    board.scqa.complication.factIds.length > 0 ||
    board.supportingArguments.some(
      (argument) =>
        argument.touched ||
        argument.text.trim().length > 0 ||
        argument.mode !== "reasoning" ||
        argument.factIds.length > 0,
    )
  );
}
