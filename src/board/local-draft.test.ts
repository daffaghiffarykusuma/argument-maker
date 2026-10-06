import { expect, test } from "bun:test";
import { createArgumentBoardSession } from "./argument-board-session";
import { createExampleBoard } from "./example-board";
import { createLocalDraft, localDraftKey } from "./local-draft";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    writes: 0,
    failRead: false,
    failWrite: false,
    failRemove: false,
    getItem(key: string) {
      if (this.failRead) throw new Error("Storage unavailable");
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (this.failWrite) throw new Error("Quota exceeded");
      this.writes += 1;
      values.set(key, value);
    },
    removeItem(key: string) {
      if (this.failRemove) throw new Error("Storage unavailable");
      values.delete(key);
    },
  };
}

function manualClock() {
  let now = 0;
  const tasks = new Map<() => void, number>();
  return {
    schedule(callback: () => void, delay: number) {
      tasks.set(callback, now + delay);
      return () => { tasks.delete(callback); };
    },
    advance(ms: number) {
      now += ms;
      for (const [callback, due] of tasks) {
        if (due <= now) { tasks.delete(callback); callback(); }
      }
    },
  };
}

function setup() {
  const storage = memoryStorage();
  const clock = manualClock();
  const statuses: string[] = [];
  const draft = createLocalDraft({
    storage,
    schedule: clock.schedule,
    onChange: () => statuses.push(draft.snapshot().status),
  });
  const edit = (title: string) => draft.session.dispatch({ type: "update-title", title });
  const storedBoard = () => JSON.parse(storage.getItem(localDraftKey)!);
  return { storage, clock, statuses, draft, edit, storedBoard };
}

test("saving is opt-in, restores on startup and preserves an explicitly supplied session", () => {
  const { storage, clock, draft, edit } = setup();
  expect(draft.snapshot().hasUnsavedChanges).toBe(false);
  edit("Temporary board");
  draft.scheduleSave();
  clock.advance(1000);
  expect(draft.flush()).toBe(false);
  expect(storage.getItem(localDraftKey)).toBeNull();
  expect(draft.snapshot().hasUnsavedChanges).toBe(true);
  expect(draft.setEnabled(true)).toBe(true);
  expect(draft.snapshot().hasUnsavedChanges).toBe(false);

  const restored = createLocalDraft({ storage });
  expect(restored.session.snapshot().board).toEqual(draft.session.snapshot().board);
  expect(restored.snapshot()).toMatchObject({ enabled: true, hasUnsavedChanges: false, status: "Local draft restored." });
  const writes = storage.writes;
  restored.flush();
  expect(storage.writes).toBe(writes);

  const initialSession = createArgumentBoardSession(createExampleBoard());
  storage.failRead = true;
  const supplied = createLocalDraft({ storage, initialSession });
  expect(supplied.session).toBe(initialSession);
  expect(supplied.snapshot()).toMatchObject({ enabled: false, hasUnsavedChanges: true });
  expect(supplied.snapshot().status).toContain("Temporary session");
});

test("typing debounces for 250 ms, publishes status and navigation can flush synchronously", () => {
  const { storage, clock, statuses, draft, edit, storedBoard } = setup();
  draft.setEnabled(true);
  edit("First edit");
  draft.scheduleSave();
  clock.advance(200);
  expect(storedBoard().title).toBe("");
  edit("Latest edit");
  draft.scheduleSave();
  expect(statuses.at(-1)).toBe("Saving locally...");
  clock.advance(249);
  expect(storage.writes).toBe(1);
  clock.advance(1);
  expect(storedBoard().title).toBe("Latest edit");
  expect(statuses.at(-1)).toBe("Saved in this browser.");
  expect(draft.snapshot().hasUnsavedChanges).toBe(false);

  edit("Navigation edit");
  draft.scheduleSave();
  expect(draft.flush()).toBe(true);
  expect(storedBoard().title).toBe("Navigation edit");
  const writes = storage.writes;
  clock.advance(1000);
  expect(storage.writes).toBe(writes);
});

test.each(["undo", "import", "clear"] as const)("a pending save reads the current session after %s", (change) => {
  const { clock, draft, edit, storedBoard } = setup();
  edit("Saved board");
  draft.setEnabled(true);
  edit("Scheduled but superseded");
  draft.scheduleSave();
  if (change === "undo") draft.session.undo();
  else if (change === "clear") draft.session.clear();
  else draft.session.importFile(JSON.stringify(createExampleBoard()), () => true);
  clock.advance(250);
  expect(storedBoard()).toEqual(draft.session.snapshot().board);
  expect(draft.snapshot().hasUnsavedChanges).toBe(false);
  expect(draft.snapshot().status).toBe("Saved in this browser.");
});

test.each(["event", "save-time check"])("conflicts detected by %s block pending writes until the user keeps this board", (detection) => {
  const { clock, draft, edit, storage, storedBoard } = setup();
  draft.setEnabled(true);
  const other = createLocalDraft({ storage });
  edit("Local edit");
  draft.scheduleSave();
  other.session.dispatch({ type: "update-title", title: "Other tab revision" });
  other.flush();
  draft.storageChanged("unrelated-key");
  expect(draft.snapshot().conflict).toBe(false);
  if (detection === "event") draft.storageChanged(localDraftKey);
  clock.advance(250);
  expect(storedBoard().title).toBe("Other tab revision");
  expect(draft.snapshot()).toMatchObject({ enabled: true, conflict: true, hasUnsavedChanges: true });
  edit("Deliberately kept board");
  draft.scheduleSave();
  expect(draft.snapshot().status).toContain("Choose which board");
  expect(draft.flush()).toBe(false);
  expect(draft.setEnabled(true)).toBe(true);
  expect(draft.snapshot()).toMatchObject({ conflict: false, hasUnsavedChanges: false });
  expect(storedBoard().title).toBe("Deliberately kept board");
  edit("Saving resumed");
  draft.scheduleSave();
  clock.advance(250);
  expect(storedBoard().title).toBe("Saving resumed");
});

test("loading another draft can be cancelled, then accepted without a write, and undone in the same stage", () => {
  const { clock, draft, edit, storage, storedBoard } = setup();
  draft.setEnabled(true);
  const other = createLocalDraft({ storage });
  edit("Keep until accepted");
  draft.session.setStage("construct");
  draft.scheduleSave();
  other.session.importFile(JSON.stringify(createExampleBoard()), () => true);
  other.flush();
  draft.storageChanged(localDraftKey);
  const before = draft.session.snapshot().board;
  const writes = storage.writes;
  let confirmations = 0;
  expect(draft.loadOther(() => { confirmations += 1; return false; })).toBe(false);
  expect(confirmations).toBe(1);
  expect(draft.session.snapshot().board).toBe(before);
  expect(draft.snapshot()).toMatchObject({ conflict: true, hasUnsavedChanges: true });
  clock.advance(1000);
  expect(draft.flush()).toBe(false);
  expect(storage.writes).toBe(writes);

  expect(draft.loadOther(() => { confirmations += 1; return true; })).toBe(true);
  expect(confirmations).toBe(2);
  expect(draft.session.snapshot().stage).toBe("construct");
  expect(draft.session.snapshot().board).toEqual(other.session.snapshot().board);
  expect(draft.snapshot()).toMatchObject({ conflict: false, hasUnsavedChanges: false });
  expect(draft.flush()).toBe(true);
  expect(storage.writes).toBe(writes);
  draft.session.undo();
  expect(draft.session.snapshot().board).toBe(before);
  expect(draft.snapshot().hasUnsavedChanges).toBe(true);
  draft.flush();
  expect(storedBoard()).toEqual(before);
});

test("another write during replacement confirmation is detected before trusting the accepted draft", () => {
  const { draft, edit, storage, storedBoard } = setup();
  edit("Local board");
  draft.setEnabled(true);
  storage.setItem(localDraftKey, JSON.stringify({ ...createExampleBoard(), title: "Chosen snapshot" }));
  draft.storageChanged(localDraftKey);
  expect(draft.loadOther(() => {
    storage.setItem(localDraftKey, JSON.stringify({ ...createExampleBoard(), title: "Later revision" }));
    return true;
  })).toBe(true);
  expect(draft.session.snapshot().board.title).toBe("Chosen snapshot");
  expect(draft.flush()).toBe(false);
  expect(storedBoard().title).toBe("Later revision");
  expect(draft.snapshot()).toMatchObject({ conflict: true, hasUnsavedChanges: true });
});

test.each(["missing", "corrupt", "unavailable"])("a recovery with %s storage keeps the current board and its failure status", (failure) => {
  const { clock, draft, edit, storage } = setup();
  edit("Current board");
  draft.setEnabled(true);
  edit("Pending edit");
  draft.scheduleSave();
  const before = draft.session.snapshot().board;
  if (failure === "missing") storage.removeItem(localDraftKey);
  else if (failure === "corrupt") storage.setItem(localDraftKey, "{bad");
  else storage.failRead = true;
  expect(draft.loadOther(() => { throw new Error("Invalid drafts must not ask for replacement"); })).toBe(false);
  expect(draft.session.snapshot().board).toBe(before);
  expect(draft.snapshot()).toMatchObject({ enabled: true, conflict: true, hasUnsavedChanges: true });
  expect(draft.snapshot().status).toContain("No readable draft found");
  draft.scheduleSave();
  clock.advance(1000);
  draft.flush();
  expect(draft.snapshot().status).toContain("No readable draft found");
});

test("failed enabling, saving and removal retain honest save state and can recover", () => {
  const { draft, edit, storage, storedBoard, statuses } = setup();
  edit("Unsaved board");
  storage.failWrite = true;
  expect(draft.setEnabled(true)).toBe(false);
  expect(draft.snapshot()).toMatchObject({ enabled: false, hasUnsavedChanges: true });
  expect(statuses.at(-1)).toContain("could not be saved");
  storage.failWrite = false;
  draft.setEnabled(true);
  edit("Unsaved change");
  storage.failWrite = true;
  expect(draft.flush()).toBe(false);
  expect(draft.snapshot()).toMatchObject({ enabled: true, hasUnsavedChanges: true });
  expect(storedBoard().title).toBe("Unsaved board");
  storage.failWrite = false;
  expect(draft.flush()).toBe(true);
  expect(storedBoard().title).toBe("Unsaved change");
  expect(draft.snapshot().hasUnsavedChanges).toBe(false);
  storage.failRemove = true;
  expect(draft.setEnabled(false)).toBe(false);
  expect(draft.snapshot()).toMatchObject({ enabled: true, hasUnsavedChanges: false });
  expect(statuses.at(-1)).toContain("could not be saved or removed");
  storage.failRemove = false;
  expect(draft.setEnabled(false)).toBe(true);
  expect(draft.snapshot()).toMatchObject({ enabled: false, hasUnsavedChanges: true });
  expect(storage.getItem(localDraftKey)).toBeNull();
});

test("unreadable startup drafts stay disabled and intact", () => {
  const storage = memoryStorage();
  storage.setItem(localDraftKey, "{bad");
  const corrupt = createLocalDraft({ storage });
  expect(corrupt.snapshot().enabled).toBe(false);
  expect(corrupt.snapshot().status).toContain("could not be read");
  expect(corrupt.flush()).toBe(false);
  expect(storage.getItem(localDraftKey)).toBe("{bad");
  storage.failRead = true;
  const blocked = createLocalDraft({ storage });
  expect(blocked.snapshot().enabled).toBe(false);
  expect(blocked.snapshot().status).toContain("storage unavailable");
});

test("opting out cancels a pending save, preserves the board and ignores subsequent storage events", () => {
  const { draft, edit, storage, clock } = setup();
  draft.setEnabled(true);
  edit("Current board");
  draft.scheduleSave();
  const board = draft.session.snapshot().board;
  draft.setEnabled(false);
  draft.storageChanged(null);
  clock.advance(1000);
  expect(storage.getItem(localDraftKey)).toBeNull();
  expect(draft.session.snapshot().board).toBe(board);
  expect(draft.snapshot()).toMatchObject({ enabled: false, conflict: false, hasUnsavedChanges: true });
  expect(createLocalDraft({ storage }).snapshot().enabled).toBe(false);
});
