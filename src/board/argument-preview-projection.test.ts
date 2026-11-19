import { describe, expect, test } from "bun:test";
import { applyArgumentBoardCommand, createDefaultBoard, type ArgumentBoard } from "./argument-board";
import { projectArgumentPreview } from "./argument-preview-projection";

describe("Argument Preview projection", () => {
  test("projects reused facts in independent destination order without duplicate attachments or unused facts", () => {
    let board = completeFrame(createDefaultBoard());
    board = addCompleteFact(board, "First fact", "https://example.com/first", "fact");
    const firstId = board.gatheredFacts.at(-1)!.id;
    board = addCompleteFact(board, "Second fact", "https://example.com/second", "observation");
    const secondId = board.gatheredFacts.at(-1)!.id;
    board = addCompleteFact(board, "Unused fact", "https://example.com/unused", "");
    const argumentId = board.supportingArguments[0]!.id;

    for (const factId of [firstId, secondId]) {
      board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: "situation", factId });
      board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: argumentId, factId });
    }
    board = applyArgumentBoardCommand(board, {
      type: "move-attached-fact",
      destinationId: argumentId,
      factId: secondId,
      direction: "up",
    });
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: "situation", factId: firstId });

    const preview = projectArgumentPreview(board);

    expect(preview.chain[0]!.facts.map((fact) => fact.id)).toEqual([firstId, secondId]);
    expect(preview.arguments[0]!.facts.map((fact) => fact.id)).toEqual([secondId, firstId]);
    expect(preview.evidenceGroups.map((group) => group.label)).toEqual(["Situation", "Supporting Argument 1"]);
    expect(preview.mermaid).toContain("Fact: First fact");
    expect(preview.mermaid).toContain("Observation: Second fact");
    expect(preview.mermaid).not.toContain("Unused fact");
    expect(preview.mermaid).not.toContain("https://");
    expect(preview.mermaid.match(/First fact/g) ?? []).toHaveLength(2);
  });

  test("keeps attached incomplete facts visible with explicit markers", () => {
    let board = completeFrame(createDefaultBoard());
    board = applyArgumentBoardCommand(board, { type: "create-gathered-fact", destinationId: "complication" });
    const blankId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      destinationId: board.supportingArguments[0]!.id,
      evidenceLink: "not-a-url",
    });
    const invalidId = board.gatheredFacts[1]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: invalidId,
      changes: { text: "A sourced claim" },
    });

    const preview = projectArgumentPreview(board);

    expect(preview.chain[1]!.facts[0]).toMatchObject({
      id: blankId,
      markers: ["[Needs fact text]", "[Needs evidence link or descriptive citation]"],
      sourceReferenceStatus: "missing",
    });
    expect(preview.arguments[0]!.facts[0]).toMatchObject({
      id: invalidId,
      markers: ["[Invalid evidence link]"],
      sourceReferenceStatus: "invalid-link",
    });
    expect(preview.mermaid).toContain("[Needs fact text]");
    expect(preview.mermaid).toContain("[Invalid evidence link]");
  });

  test("numbers writing sources once per canonical fact in reading order", () => {
    let board = { ...completeFrame(createDefaultBoard()), title: "Capacity case" };
    const argumentId = board.supportingArguments[0]!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-supporting-argument",
      argumentId,
      changes: { mode: "evidence-backed" },
    });
    board = addCompleteFact(board, "Demand rose 20%.", "https://example.com/report", "fact");
    const reusedId = board.gatheredFacts[0]!.id;
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: "situation", factId: reusedId });
    board = applyArgumentBoardCommand(board, { type: "attach-fact", destinationId: argumentId, factId: reusedId });
    board = addCompleteFact(board, "Unused research", "https://example.com/unused", "");
    board = applyArgumentBoardCommand(board, {
      type: "create-gathered-fact",
      destinationId: "complication",
      evidenceLink: "not-a-url",
    });
    const incompleteId = board.gatheredFacts.at(-1)!.id;
    board = applyArgumentBoardCommand(board, {
      type: "update-gathered-fact",
      factId: incompleteId,
      changes: { text: "Capacity has not changed.", dataType: "observation" },
    });

    const { writing } = projectArgumentPreview(board);

    expect(writing.title).toBe("Capacity case");
    expect(writing.sections[0]).toMatchObject({ label: "Situation", text: "Demand is rising." });
    expect(writing.sections.flatMap((section) => section.facts.map((fact) => [section.label, fact.citation]))).toEqual([
      ["Situation", 1],
      ["Complication", 2],
      ["Supporting Argument 1", 1],
    ]);
    expect(writing.sections[1]!.facts[0]!.markers).toEqual(["[Invalid evidence link]"]);
    expect(writing.sections.at(-1)!.supportMode).toBe("Evidence-backed");
    expect(writing.sources.map((source) => [source.citation, source.text, source.formattedDataType, source.sourceReferenceStatus])).toEqual(
      [
        [1, "Demand rose 20%.", "Fact", "valid-link"],
        [2, "Capacity has not changed.", "Observation", "invalid-link"],
      ],
    );
    expect(JSON.stringify(writing)).not.toContain("Unused research");
  });
});

function completeFrame(initial: ArgumentBoard): ArgumentBoard {
  let board = initial;
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "situation", text: "Demand is rising." });
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "complication", text: "Capacity is fixed." });
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "question", text: "What should change?" });
  board = applyArgumentBoardCommand(board, { type: "update-scqa", field: "answer", text: "Expand capacity." });
  board = applyArgumentBoardCommand(board, {
    type: "update-supporting-argument",
    argumentId: board.supportingArguments[0]!.id,
    changes: { text: "The gap is material." },
  });
  return board;
}

function addCompleteFact(
  board: ArgumentBoard,
  text: string,
  evidenceLink: string,
  dataType: ArgumentBoard["gatheredFacts"][number]["dataType"],
): ArgumentBoard {
  let updated = applyArgumentBoardCommand(board, { type: "create-gathered-fact", evidenceLink });
  const factId = updated.gatheredFacts.at(-1)!.id;
  updated = applyArgumentBoardCommand(updated, {
    type: "update-gathered-fact",
    factId,
    changes: { text, dataType },
  });
  return updated;
}
