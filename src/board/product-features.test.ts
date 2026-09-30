import { describe, expect, test } from "bun:test";
import { createDefaultBoard, applyArgumentBoardCommand } from "./argument-board";
import { createArgumentBoardSession } from "./argument-board-session";
import { createExampleBoard } from "./example-board";
import { createExportFile, parseExportFile } from "./export-file-contract";
import { createLocalDraft, localDraftKey } from "./local-draft";
import { filterFacts } from "./fact-library";
import { createWritingExport, projectWritingDocument } from "./writing-export";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

describe("Local draft recovery", () => {
  test("requires opt-in, restores edits and clears persisted data on opt-out", () => {
    const storage = memoryStorage();
    const draft = createLocalDraft(storage);
    const board = createExampleBoard();
    expect(draft.save(board)).toBe(false);
    expect(storage.getItem(localDraftKey)).toBeNull();
    expect(draft.setEnabled(true, board)).toBe(true);
    const edited = { ...board, title: "Updated title" };
    expect(draft.save(edited)).toBe(true);
    const nextSession = createLocalDraft(storage);
    expect(nextSession.load()).toEqual(edited);
    expect(nextSession.enabled).toBe(true);
    expect(nextSession.setEnabled(false, edited)).toBe(true);
    expect(createLocalDraft(storage).load()).toBeUndefined();
  });
  test("does not silently overwrite another tab, corrupt data, or a failed save", () => {
    const storage = memoryStorage();
    const draft = createLocalDraft(storage);
    const board = createExampleBoard();
    draft.setEnabled(true, board);
    const otherTab = createLocalDraft(storage);
    expect(otherTab.load()).toEqual(board);
    const otherBoard = { ...board, title: "Other tab revision" };
    expect(otherTab.save(otherBoard)).toBe(true);
    expect(draft.save({ ...board, title: "Competing edit" })).toBe(false);
    expect(draft.paused).toBe(true);
    expect(JSON.parse(storage.getItem(localDraftKey)!).title).toBe(otherBoard.title);
    expect(draft.setEnabled(true, board)).toBe(true);
    expect(draft.save({ ...board, title: "Deliberately kept board" })).toBe(true);
    storage.setItem(localDraftKey, "{bad");
    const corrupt = createLocalDraft(storage);
    expect(corrupt.load()).toBeUndefined();
    expect(corrupt.enabled).toBe(false);
    expect(corrupt.status).toContain("could not be read");
    const blocked = createLocalDraft({ ...storage, setItem: () => { throw new Error("quota"); } });
    expect(blocked.setEnabled(true, board)).toBe(false);
    expect(blocked.enabled).toBe(false);
    expect(blocked.status).toContain("could not be saved");
  });
});

test("field typing is one board undo step without losing redo or later independent edits", () => {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "update-title", title: "A" }, "title");
  session.dispatch({ type: "update-title", title: "Article" }, "title");
  session.finishEdit();
  session.dispatch({ type: "update-scqa", field: "answer", text: "Answer" }, "answer");
  session.undo();
  expect(session.snapshot().board.title).toBe("Article");
  expect(session.snapshot().board.scqa.answer.text).toBe("");
  session.undo();
  expect(session.snapshot().board.title).toBe("");
  session.redo();
  expect(session.snapshot().board.title).toBe("Article");
  session.dispatch({ type: "update-title", title: "Revision" }, "title");
  expect(session.snapshot().canRedo).toBe(false);
  session.undo();
  expect(session.snapshot().board.title).toBe("Article");
});

test("source details and reasoning notes round-trip, old boards still load, and malformed known fields fail", () => {
  const board = createExampleBoard();
  board.gatheredFacts[0]!.sourceDate = "2026-09";
  board.gatheredFacts[0]!.quotation = "A quotation entered by the writer.";
  expect(parseExportFile(createExportFile(board).contents)).toEqual({ ok: true, board });
  expect(parseExportFile(createExportFile(createDefaultBoard()).contents).ok).toBe(true);
  const invalidFact = { ...board, gatheredFacts: [{ ...board.gatheredFacts[0], quotation: { text: "bad" } }] };
  expect(parseExportFile(JSON.stringify(invalidFact)).ok).toBe(false);
  const invalidArgument = { ...board, supportingArguments: [{ ...board.supportingArguments[0], assumptions: [] }] };
  expect(parseExportFile(JSON.stringify(invalidArgument)).ok).toBe(false);
});

test("writing exports reuse citation numbers, preserve source metadata, and mark incomplete attached evidence", () => {
  let board = createExampleBoard();
  board.gatheredFacts[0]!.quotation = "Keyboard navigation";
  board.gatheredFacts.push({ id: "unused", text: "Unused finding", touched: true, evidenceLink: "https://example.com/unused", dataType: "" });
  const doc = projectWritingDocument(board);
  expect(doc.sources).toHaveLength(1);
  expect(doc.sections[1]!.facts[0]!.citation).toBe(doc.sections[4]!.facts[0]!.citation);
  expect(createWritingExport(board, "markdown").contents).toContain("Possible objection:");
  expect(createWritingExport(board, "text").contents).toContain("Quotation: Keyboard navigation");
  expect(createWritingExport(board, "text").contents).not.toContain("Unused finding");
  board = applyArgumentBoardCommand(board, { type: "update-gathered-fact", factId: "fact-1", changes: { evidenceLink: "javascript:alert(1)", text: "<img src=x>" } });
  const output = createWritingExport(board, "markdown");
  expect(output.contents).toContain("[Missing or invalid evidence link]");
  expect(output.contents).not.toContain("javascript:");
  expect(output.contents).toContain("\\<img src=x\\>");
});

test("fact search combines terms across metadata and filters unused or incomplete drafts", () => {
  const board = createExampleBoard();
  board.gatheredFacts.push({ id: "draft", text: "A keyboard observation", sourceTitle: "Interview notes", quotation: "Focus moved", touched: true, evidenceLink: "", dataType: "observation" });
  expect(filterFacts(board, "interview focus", "all").map(({ id }) => id)).toEqual(["draft"]);
  expect(filterFacts(board, "keyboard", "unused").map(({ id }) => id)).toEqual(["draft"]);
  expect(filterFacts(board, "", "incomplete").map(({ id }) => id)).toEqual(["draft"]);
  expect(filterFacts(board, "absent", "all")).toEqual([]);
});
