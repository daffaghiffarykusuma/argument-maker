import type { ArgumentBoard } from "./argument-board";
import { createArgumentBoardSession, type ArgumentBoardSession } from "./argument-board-session";
import { parseExportFile } from "./export-file-contract";

export const localDraftKey = "argument-maker.local-draft.v1";
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface LocalDraftOptions {
  storage: DraftStorage;
  initialSession?: ArgumentBoardSession;
  onChange?: () => void;
  schedule?: (callback: () => void, delay: number) => () => void;
}

const temporaryStatus = "Temporary session. Download your board to keep it.";
const conflictStatus = "Draft changed in another tab. Choose which board to keep saving.";
const unreadableStatus = "No readable draft found. Download this board or keep saving it.";

/** Owns recovery and saving; the session remains the owner of board edits and history. */
export function createLocalDraft({ storage, initialSession, onChange = () => {}, schedule = scheduleTimeout }: LocalDraftOptions) {
  let enabled = false;
  let conflict = false;
  let persisted: string | null = null;
  let savedBoard: ArgumentBoard | undefined;
  let cancelSave: (() => void) | undefined;
  let status = temporaryStatus;

  // An explicitly supplied session must not restore or overwrite a stored draft.
  if (!initialSession) {
    try {
      persisted = storage.getItem(localDraftKey);
      if (persisted) {
        const result = parseExportFile(persisted);
        if (result.ok) {
          savedBoard = result.board;
          enabled = true;
          status = "Local draft restored.";
        } else status = "Saved draft could not be read. Download this board before enabling autosave.";
      }
    } catch {
      status = "Browser storage unavailable. Download your board to keep it.";
    }
  }
  const session = initialSession ?? createArgumentBoardSession(savedBoard);

  function cancelPendingSave() {
    cancelSave?.();
    cancelSave = undefined;
  }

  function pause(message = conflictStatus) {
    cancelPendingSave();
    conflict = true;
    savedBoard = undefined;
    status = message;
    onChange();
  }

  function flush(): boolean {
    cancelPendingSave();
    if (!enabled || conflict) return false;
    try {
      // Storage events may arrive late. Check again before trusting or replacing the draft.
      if (storage.getItem(localDraftKey) !== persisted) {
        pause();
        return false;
      }
      const board = session.snapshot().board;
      if (savedBoard === board) {
        if (status === "Saving locally...") {
          status = "Saved in this browser.";
          onChange();
        }
        return true;
      }
      const contents = JSON.stringify(board);
      storage.setItem(localDraftKey, contents);
      persisted = contents;
      savedBoard = board;
      status = "Saved in this browser.";
    } catch {
      status = "Draft could not be saved. Download your board to keep it.";
      onChange();
      return false;
    }
    onChange();
    return true;
  }

  return {
    session,
    snapshot() {
      return {
        enabled,
        conflict,
        status,
        hasUnsavedChanges: session.hasTouchedContent() && (!enabled || conflict || savedBoard !== session.snapshot().board),
      };
    },
    scheduleSave() {
      cancelPendingSave();
      if (!enabled || conflict || savedBoard === session.snapshot().board) return;
      status = "Saving locally...";
      cancelSave = schedule(flush, 250);
      onChange();
    },
    flush,
    setEnabled(next: boolean): boolean {
      cancelPendingSave();
      try {
        const board = session.snapshot().board;
        const contents = next ? JSON.stringify(board) : null;
        // Enabling also represents the explicit choice to keep this board after a conflict.
        if (contents !== null) storage.setItem(localDraftKey, contents);
        else storage.removeItem(localDraftKey);
        persisted = contents;
        savedBoard = next ? board : undefined;
        enabled = next;
        conflict = false;
        status = next ? "Saved in this browser." : temporaryStatus;
      } catch {
        status = "Draft could not be saved or removed. Download your board to keep it.";
        onChange();
        return false;
      }
      onChange();
      return true;
    },
    storageChanged(key: string | null) {
      if (enabled && (key === localDraftKey || key === null)) pause();
    },
    loadOther(confirmReplacement: () => boolean): boolean {
      cancelPendingSave();
      let contents: string | null;
      try {
        contents = storage.getItem(localDraftKey);
      } catch {
        pause(unreadableStatus);
        return false;
      }
      if (!contents) {
        pause(unreadableStatus);
        return false;
      }
      const result = session.importFile(contents, confirmReplacement);
      if (!result?.ok) {
        pause(result ? unreadableStatus : conflictStatus);
        return false;
      }
      persisted = contents;
      savedBoard = session.snapshot().board;
      enabled = true;
      conflict = false;
      status = "Local draft restored.";
      onChange();
      return true;
    },
  };
}

function scheduleTimeout(callback: () => void, delay: number) {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
}

export type LocalDraft = ReturnType<typeof createLocalDraft>;
