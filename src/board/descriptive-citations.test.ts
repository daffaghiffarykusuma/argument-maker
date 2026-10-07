import { expect, test } from "bun:test";
import { createArgumentBoardSession } from "./argument-board-session";
import { readFactAttachments } from "./argument-board";
import { createExportFile, parseExportFile } from "./export-file-contract";
import { createWritingExport, projectWritingDocument } from "./writing-export";
import { projectArgumentPreview } from "./argument-preview-projection";
import { createLocalDraft } from "./local-draft";

test("citation-only facts support live attachments and undoable source edits", () => {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "create-gathered-fact" });
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: {
    text: "The interviewee described a delay.", descriptiveCitation: "Interview with the project lead, notes p. 3", dataType: "observation",
  } });
  expect(readFactAttachments(session.snapshot().board, "situation").attachableFacts).toHaveLength(1);
  session.dispatch({ type: "attach-fact", destinationId: "situation", factId: "fact-1" });
  session.dispatch({ type: "attach-fact", destinationId: "argument-1", factId: "fact-1" });
  session.dispatch({ type: "update-supporting-argument", argumentId: "argument-1", changes: { text: "Allow time for delays", mode: "evidence-backed" } });
  expect(session.snapshot().issues.filter(({ code }) => code === "incomplete-attached-fact" || code === "needs-complete-fact")).toEqual([]);
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: { descriptiveCitation: "Revised interview notes, p. 4" } });
  for (const destination of ["situation", "argument-1"]) {
    expect(readFactAttachments(session.snapshot().board, destination).attachedFacts[0]!.descriptiveCitation).toBe("Revised interview notes, p. 4");
  }
  session.undo();
  expect(session.snapshot().board.gatheredFacts[0]!.descriptiveCitation).toBe("Interview with the project lead, notes p. 3");
  session.redo();
  expect(session.snapshot().board.gatheredFacts[0]!.descriptiveCitation).toBe("Revised interview notes, p. 4");
});

test("local drafts restore citation-only sources and supplied malformed URLs remain correction issues", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const draft = createLocalDraft({ storage });
  draft.setEnabled(true);
  const session = draft.session;
  session.dispatch({ type: "create-gathered-fact", destinationId: "situation" });
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: { text: "Projected demand", dataType: "estimate", descriptiveCitation: "Planning notebook, p. 2" } });
  draft.flush();
  expect(createLocalDraft({ storage }).session.snapshot().board.gatheredFacts[0]).toMatchObject({ descriptiveCitation: "Planning notebook, p. 2", evidenceLink: "", dataType: "estimate" });
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: { evidenceLink: "javascript:alert(1)" } });
  expect(session.snapshot().issues.find(({ code }) => code === "incomplete-attached-fact")?.fieldMessages).toEqual(["Use a valid http:// or https:// evidence link."]);
  expect(readFactAttachments(session.snapshot().board, "complication").attachableFacts).toEqual([]);
  expect(createWritingExport(session.snapshot().board, "markdown").contents).not.toContain("javascript:");
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: { evidenceLink: "https://example.com/notes" } });
  expect(session.snapshot().issues.some(({ code }) => code === "incomplete-attached-fact")).toBe(false);
  expect(createWritingExport(session.snapshot().board, "text").contents).toContain("https://example.com/notes");
  expect(createWritingExport(session.snapshot().board, "text").contents).toContain("Planning notebook, p. 2");
});

test("citation-only research retains source numbering, classification and escaping in writing outputs", () => {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "create-gathered-fact", destinationId: "situation" });
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: {
    text: "Observed a delay", descriptiveCitation: "Interview <notes> [p. 3]", dataType: "observation",
  } });
  session.dispatch({ type: "attach-fact", destinationId: "complication", factId: "fact-1" });
  const board = session.snapshot().board;
  const doc = projectWritingDocument(board);
  expect(doc.sources).toHaveLength(1);
  expect(doc.sections[0]!.facts[0]!.citation).toBe(1);
  expect(doc.sections[1]!.facts[0]!.citation).toBe(1);
  const text = createWritingExport(board, "text").contents;
  expect(text).toContain("Descriptive citation: Interview <notes> [p. 3]");
  expect(text).toContain("Data Type: Observation");
  expect(text).not.toContain("Missing or invalid evidence link");
  expect(createWritingExport(board, "markdown").contents).toContain("Interview \\<notes\\> \\[p. 3\\]");
  const preview = projectArgumentPreview(board);
  expect(preview.outline).toContain("Descriptive citation: Interview <notes> [p. 3]");
  expect(preview.outline).not.toContain("Needs evidence link");
  expect(preview.chain[0]!.facts[0]!.markers).toEqual([]);
  expect(session.copyOutline()).toContain("Descriptive citation: Interview <notes> [p. 3]");
  expect(session.copyOutline()).toContain("Observed a delay [1]");
});

test("version-2 files preserve descriptive citations and unknown data but reject malformed known citations", () => {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "create-gathered-fact" });
  session.dispatch({ type: "update-gathered-fact", factId: "fact-1", changes: { descriptiveCitation: "Book, chapter 2" } });
  const board = session.snapshot().board;
  const file = JSON.parse(createExportFile(board).contents);
  file.gatheredFacts[0].futureMetadata = { page: 12 };
  const loaded = parseExportFile(JSON.stringify(file));
  expect(loaded).toEqual({ ok: true, board: file });
  expect(file.schemaVersion).toBe(2);
  file.gatheredFacts[0].descriptiveCitation = { text: "Invalid object" };
  expect(parseExportFile(JSON.stringify(file)).ok).toBe(false);
  delete file.gatheredFacts[0].descriptiveCitation;
  expect(parseExportFile(JSON.stringify(file)).ok).toBe(true);
});
