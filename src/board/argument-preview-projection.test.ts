import { describe, expect, test } from "bun:test";
import { applyArgumentBoardCommand, createDefaultBoard, type ArgumentBoard } from "./argument-board";
import { projectArgumentPreview } from "./argument-preview-projection";

describe("Argument Preview projection", () => {
  test("projects attached facts in each destination order and omits unused facts", () => {
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

    const preview = projectArgumentPreview(board);

    expect(preview.chain[0]!.facts.map((fact) => fact.id)).toEqual([firstId, secondId]);
    expect(preview.arguments[0]!.facts.map((fact) => fact.id)).toEqual([secondId, firstId]);
    expect(preview.evidenceGroups.map((group) => group.label)).toEqual(["Situation", "Supporting Argument 1"]);
    expect(preview.mermaid).toContain('Fact: First fact');
    expect(preview.mermaid).toContain('Observation: Second fact');
    expect(preview.mermaid).not.toContain("Unused fact");
    expect(preview.mermaid).not.toContain("https://");
    expect((preview.mermaid.match(/First fact/g) ?? [])).toHaveLength(2);
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
      markers: ["[Needs fact text]", "[Needs evidence link]"],
      evidenceLinkIsValid: false,
    });
    expect(preview.arguments[0]!.facts[0]).toMatchObject({
      id: invalidId,
      markers: ["[Invalid evidence link]"],
      evidenceLinkIsValid: false,
    });
    expect(preview.mermaid).toContain("[Needs fact text]");
    expect(preview.mermaid).toContain("[Invalid evidence link]");
  });

  test("generates the outline from the same ordered evidence projection", () => {
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

    const outline = projectArgumentPreview(board).outline;

    expect(outline).toContain("# Capacity case");
    expect(outline).toContain("Situation: Demand is rising.");
    expect(outline).toContain("- Demand rose 20%.");
    expect(outline).toContain("  Data Type: Fact");
    expect(outline).toContain("  Evidence Link: https://example.com/report");
    expect(outline).toContain("- Capacity has not changed. [Invalid evidence link]");
    expect(outline).toContain("Incomplete Evidence");
    expect(outline).not.toContain("Unused research");
    expect((outline.match(/Demand rose 20%\./g) ?? [])).toHaveLength(2);
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
