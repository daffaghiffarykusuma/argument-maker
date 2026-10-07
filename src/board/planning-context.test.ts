import { expect, test } from "bun:test";
import { createExampleBoard } from "./example-board";
import { createWritingExport, projectWritingDocument } from "./writing-export";
import { createLocalDraft } from "./local-draft";
import { createArgumentBoardSession } from "./argument-board-session";

test("planning context edits undo and redo independently without losing the Answer", () => {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "update-scqa", field: "answer", text: "Improve service." });
  session.dispatch({ type: "update-planning-context", field: "audience", text: "Service managers" });
  session.dispatch({ type: "update-planning-context", field: "intendedOutcome", text: "Approve a pilot" });
  expect(session.snapshot().board).toMatchObject({ audience: "Service managers", intendedOutcome: "Approve a pilot" });
  session.undo();
  expect(session.snapshot().board.intendedOutcome ?? "").toBe("");
  expect(session.snapshot().board.audience).toBe("Service managers");
  session.undo();
  expect(session.snapshot().board.audience ?? "").toBe("");
  session.redo();
  session.redo();
  expect(session.snapshot().board).toMatchObject({ audience: "Service managers", intendedOutcome: "Approve a pilot" });
  expect(session.snapshot().board.scqa.answer.text).toBe("Improve service.");
});

test.each(["audience", "intendedOutcome"] as const)("%s alone protects work from replacement and unsaved loss", (field) => {
  const session = createArgumentBoardSession();
  const draft = createLocalDraft({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }, initialSession: session });
  session.dispatch({ type: "update-planning-context", field, text: "Keep this planning note" });
  expect(session.hasTouchedContent()).toBe(true);
  expect(draft.snapshot().hasUnsavedChanges).toBe(true);
  let prompted = false;
  const result = session.importFile(createArgumentBoardSession().exportFile().contents, () => { prompted = true; return false; });
  expect(result).toBeUndefined();
  expect(prompted).toBe(true);
  expect(session.snapshot().board[field]).toBe("Keep this planning note");
});

test.each(["audience", "intendedOutcome"] as const)("malformed %s imports preserve the active board and history", (field) => {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "update-planning-context", field: "audience", text: "Current audience" });
  const active = session.snapshot().board;
  for (const value of [null, 42, {}, []]) {
    const file = JSON.parse(createArgumentBoardSession().exportFile().contents);
    file[field] = value;
    expect(session.importFile(JSON.stringify(file), () => { throw new Error("Invalid files must not ask to replace work"); })?.ok).toBe(false);
    expect(session.snapshot().board).toBe(active);
  }
  session.undo();
  expect(session.snapshot().board.audience).toBeUndefined();
});

test("planning context survives board files and opt-in draft restore while staying outside writing", () => {
  const session = createArgumentBoardSession(createExampleBoard());
  const originalIssues = session.snapshot().issues;
  session.dispatch({ type: "update-planning-context", field: "audience", text: "Private audience" });
  session.dispatch({ type: "update-planning-context", field: "intendedOutcome", text: "Private intended outcome" });
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const draft = createLocalDraft({ storage, initialSession: session });
  expect(draft.snapshot().enabled).toBe(false);
  expect(draft.setEnabled(true)).toBe(true);
  const restored = createLocalDraft({ storage });
  expect(restored.session.snapshot().board).toEqual(session.snapshot().board);
  const imported = createArgumentBoardSession();
  expect(imported.importFile(session.exportFile().contents, () => true)?.ok).toBe(true);
  expect(imported.snapshot().board).toEqual(session.snapshot().board);
  expect(imported.snapshot().issues).toEqual(originalIssues);
  for (const output of [session.copyOutline(), createWritingExport(session.snapshot().board, "markdown").contents, createWritingExport(session.snapshot().board, "text").contents, JSON.stringify(projectWritingDocument(session.snapshot().board))]) {
    expect(output).not.toContain("Private audience");
    expect(output).not.toContain("Private intended outcome");
  }
  const oldBoard = createExampleBoard();
  expect(imported.importFile(JSON.stringify(oldBoard), () => true)?.ok).toBe(true);
  expect(imported.snapshot().issues).toEqual(originalIssues);
});
