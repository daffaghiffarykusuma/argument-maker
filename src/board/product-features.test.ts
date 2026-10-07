import { expect, test } from "bun:test";
import { createDefaultBoard, applyArgumentBoardCommand } from "./argument-board";
import { createArgumentBoardSession } from "./argument-board-session";
import { createExampleBoard } from "./example-board";
import { createExportFile, parseExportFile } from "./export-file-contract";
import { filterFacts } from "./fact-library";
import { createWritingExport, projectWritingDocument } from "./writing-export";

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

test("Copy Outline retains support modes and citations without adding reasoning notes", () => {
  const session = createArgumentBoardSession();
  session.importFile(createExportFile(createExampleBoard()).contents, () => true);
  session.dispatch({ type: "add-supporting-argument" });
  session.dispatch({ type: "update-supporting-argument", argumentId: "argument-2", changes: { text: "A familiar pattern reduces guesswork", mode: "reasoning" } });
  const board = session.snapshot().board;
  const outline = session.copyOutline({ draft: true });
  expect(outline).toContain("\nDraft\n");
  expect(outline).toContain("Support Mode: Evidence-backed");
  expect(outline).toContain("Support Mode: Reasoning / Interpretation");
  expect(outline).toContain("[1] W3C WAI: Tabs pattern");
  expect(outline).toContain("https://www.w3.org/WAI/ARIA/apg/patterns/tabs/");
  for (const note of ["connection", "assumptions", "objection", "weakensClaim"] as const) {
    const text = board.supportingArguments[0]![note]!;
    expect(outline).not.toContain(text);
    expect(createWritingExport(board, "text").contents).toContain(text);
    expect(createWritingExport(board, "markdown").contents).toContain(text);
  }
  expect(projectWritingDocument(board).sections[4]!.notes).toHaveLength(4);
});

test("fact search combines terms across metadata and filters unused or incomplete drafts", () => {
  const board = createExampleBoard();
  board.gatheredFacts.push({ id: "draft", text: "A keyboard observation", sourceTitle: "Interview notes", quotation: "Focus moved", touched: true, evidenceLink: "", dataType: "observation" });
  expect(filterFacts(board, "interview focus", "all").map(({ id }) => id)).toEqual(["draft"]);
  expect(filterFacts(board, "keyboard", "unused").map(({ id }) => id)).toEqual(["draft"]);
  expect(filterFacts(board, "", "incomplete").map(({ id }) => id)).toEqual(["draft"]);
  expect(filterFacts(board, "absent", "all")).toEqual([]);
});
