import { expect, test } from "bun:test";
import { createArgumentBoardSession } from "./argument-board-session";
import { createDefaultBoard, readFactAttachments, type GatheredFact } from "./argument-board";
import { parseExportFile } from "./export-file-contract";
import { createLocalDraft } from "./local-draft";

test("another fact reuses source provenance in one undoable creation without copying the finding", () => {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "create-gathered-fact", destinationId: "situation" });
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: {
    text: "The original finding", quotation: "The original quotation", dataType: "observation",
    evidenceLink: "https://example.com/source", sourceTitle: "Research notebook", sourceDate: "2026-09", descriptiveCitation: "Notebook, p. 4",
  } });
  const original = session.snapshot().board.gatheredFacts[0]!;
  session.dispatch({ type: "reuse-fact-source", factId: "fact-1" });
  const copy = session.snapshot().board.gatheredFacts[1]!;
  expect(copy).toMatchObject({ id: "fact-2", text: "", evidenceLink: "https://example.com/source", sourceTitle: "Research notebook", sourceDate: "2026-09", descriptiveCitation: "Notebook, p. 4" });
  expect(copy.quotation ?? "").toBe("");
  expect(copy.dataType).toBe("");
  expect(session.snapshot().board.gatheredFacts[0]).toEqual(original);
  expect(session.snapshot().board.scqa.situation.factIds).toEqual(["fact-1"]);
  expect(readFactAttachments(session.snapshot().board, "situation").attachableFacts).toEqual([]);
  session.undo();
  expect(session.snapshot().board.gatheredFacts).toEqual([original]);
  session.redo();
  expect(session.snapshot().board.gatheredFacts[1]).toEqual(copy);
  session.dispatch({ type: "update-gathered-fact", factId: copy.id, changes: { text: "A separate finding" } });
  expect(readFactAttachments(session.snapshot().board, "situation").attachableFacts.map(({ id }) => id)).toEqual(["fact-2"]);
  session.undo();
  expect(session.snapshot().board.gatheredFacts[1]!.text).toBe("");
  session.redo();
  expect(session.snapshot().board.gatheredFacts[1]!.text).toBe("A separate finding");
});

for (const [name, provenance] of [
  ["URL-only", { evidenceLink: "https://example.com/report" }],
  ["citation-only", { evidenceLink: "", descriptiveCitation: "Interview notes, p. 3" }],
  ["both", { evidenceLink: "https://example.com/report", descriptiveCitation: "Appendix, p. 4", sourceDate: "2026" }],
  ["partial", { evidenceLink: "", sourceTitle: "Notebook", sourceDate: "September" }],
] as const) {
  test(`${name} source reuse preserves untouched originals, editable files and local drafts`, () => {
    const board = createDefaultBoard();
    const original: GatheredFact = { id: "fact-1", text: "", touched: false, dataType: "", ...provenance };
    board.gatheredFacts.push(original);
    const session = createArgumentBoardSession(board);
    session.dispatch({ type: "reuse-fact-source", factId: original.id });
    expect(session.snapshot().board.gatheredFacts[0]).toEqual(original);
    expect(session.snapshot().board.gatheredFacts[1]).toMatchObject({ id: "fact-2", text: "", ...provenance });
    const loaded = parseExportFile(session.exportFile().contents);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.board.gatheredFacts[1]).toMatchObject({ id: "fact-2", text: "", ...provenance });
    expect(loaded.board.gatheredFacts[1]!.quotation ?? "").toBe("");
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const draft = createLocalDraft({ storage, initialSession: session });
    draft.setEnabled(true);
    expect(createLocalDraft({ storage }).session.snapshot().board.gatheredFacts[1]).toMatchObject({ id: "fact-2", text: "", ...provenance });
  });
}
