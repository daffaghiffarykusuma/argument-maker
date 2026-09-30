import type { ArgumentBoard } from "./argument-board";
import { parseExportFile } from "./export-file-contract";

export const localDraftKey = "argument-maker.local-draft.v1";
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** One atomic record holds the opt-in and board. No browser dependency in the model. */
export function createLocalDraft(storage: DraftStorage) {
  let enabled = false;
  let paused = false;
  let status = "Temporary session. Download your board to keep it.";
  return {
    get enabled() { return enabled; },
    get status() { return status; },
    load(): ArgumentBoard | undefined {
      try {
        const contents = storage.getItem(localDraftKey);
        if (!contents) return;
        const result = parseExportFile(contents);
        if (!result.ok) {
          status = "Saved draft could not be read. Download this board before enabling autosave.";
          return;
        }
        enabled = true;
        paused = false;
        status = "Local draft restored.";
        return result.board;
      } catch {
        status = "Browser storage unavailable. Download your board to keep it.";
        return;
      }
    },
    setEnabled(next: boolean, board: ArgumentBoard): boolean {
      try {
        if (next) storage.setItem(localDraftKey, JSON.stringify(board));
        else storage.removeItem(localDraftKey);
        enabled = next;
        paused = false;
        status = next ? "Saved in this browser." : "Temporary session. Download your board to keep it.";
        return true;
      } catch {
        status = "Draft could not be saved or removed. Download your board to keep it.";
        return false;
      }
    },
    save(board: ArgumentBoard): boolean {
      if (!enabled || paused) return false;
      try {
        storage.setItem(localDraftKey, JSON.stringify(board));
        status = "Saved in this browser.";
        return true;
      } catch {
        status = "Draft could not be saved. Download your board to keep it.";
        return false;
      }
    },
    pause() {
      paused = true;
      status = "Draft changed in another tab. Choose which board to keep saving.";
    },
  };
}
