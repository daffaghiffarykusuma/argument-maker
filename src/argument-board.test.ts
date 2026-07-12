import { describe, expect, test } from "bun:test";
import {
  addSupportingArgument,
  addSupportingDataFact,
  createDefaultBoard,
  deleteSupportingArgument,
  deleteSupportingDataFact,
  duplicateSupportingArgument,
  duplicateSupportingDataFact,
  moveSupportingArgument,
  moveSupportingDataFact,
  updateScqaField,
  updateScqaEvidenceLink,
  updateSupportingArgument,
  updateSupportingDataFact,
} from "./argument-board";

describe("Argument Board", () => {
  test("creates a clean default board with one SCQA frame and empty support slots", () => {
    const board = createDefaultBoard();

    expect(board.schemaVersion).toBe(1);
    expect(board.title).toBe("");
    expect(board.scqa.situation.text).toBe("");
    expect(board.scqa.complication.text).toBe("");
    expect(board.scqa.situation.evidenceLink).toBe("");
    expect(board.scqa.complication.evidenceLink).toBe("");
    expect(board.scqa.question.text).toBe("");
    expect(board.scqa.answer.text).toBe("");
    expect(board.supportingArguments).toHaveLength(3);
    expect(board.supportingArguments.every((argument) => argument.mode === "reasoning")).toBe(true);
    expect(board.supportingArguments.every((argument) => argument.data.length === 3)).toBe(true);
    expect(board.supportingArguments.flatMap((argument) => argument.data).every((item) => item.evidenceLink === "")).toBe(true);
  });

  test("adds evidence links to Situation and Complication without changing their text", () => {
    const board = updateScqaField(createDefaultBoard(), "situation", "Demand is growing.");
    const updated = updateScqaEvidenceLink(board, "situation", "https://example.com/demand");

    expect(updated.scqa.situation.text).toBe("Demand is growing.");
    expect(updated.scqa.situation.evidenceLink).toBe("https://example.com/demand");
    expect(board.scqa.situation.evidenceLink).toBe("");
  });

  test("edits SCQA, Supporting Arguments, and Supporting Data or Facts without mutating the original board", () => {
    const board = createDefaultBoard();
    const withQuestion = updateScqaField(board, "question", "Should we recommend this restaurant?");
    const argumentId = withQuestion.supportingArguments[0]!.id;
    const withArgument = updateSupportingArgument(withQuestion, argumentId, {
      text: "It is practical for group dinners.",
      mode: "evidence-backed",
    });
    const dataId = withArgument.supportingArguments[0]!.data[0]!.id;
    const withData = updateSupportingDataFact(withArgument, argumentId, dataId, {
      text: "The shared platter serves four people.",
      evidenceLink: "https://example.com/menu",
      dataType: "fact",
    });

    expect(board.scqa.question.text).toBe("");
    expect(withData.scqa.question.text).toBe("Should we recommend this restaurant?");
    expect(withData.scqa.question.touched).toBe(true);
    expect(withData.supportingArguments[0]!.text).toBe("It is practical for group dinners.");
    expect(withData.supportingArguments[0]!.mode).toBe("evidence-backed");
    expect(withData.supportingArguments[0]!.data[0]!.text).toBe("The shared platter serves four people.");
    expect(withData.supportingArguments[0]!.data[0]!.evidenceLink).toBe("https://example.com/menu");
    expect(withData.supportingArguments[0]!.data[0]!.dataType).toBe("fact");
    expect(withData.supportingArguments[0]!.data[0]!.touched).toBe(true);
  });

  test("adds, reorders, and duplicates Supporting Argument branches", () => {
    const board = createDefaultBoard();
    const added = addSupportingArgument(board);
    const addedArgument = added.supportingArguments[3]!;
    const named = updateSupportingArgument(added, addedArgument.id, { text: "Service is consistent." });
    const moved = moveSupportingArgument(named, addedArgument.id, "up");
    const duplicated = duplicateSupportingArgument(moved, addedArgument.id);

    expect(added.supportingArguments).toHaveLength(4);
    expect(moved.supportingArguments[2]!.id).toBe(addedArgument.id);
    expect(duplicated.supportingArguments).toHaveLength(5);
    expect(duplicated.supportingArguments[3]!.text).toBe("Service is consistent.");
    expect(duplicated.supportingArguments[3]!.id).not.toBe(addedArgument.id);
    expect(duplicated.supportingArguments[3]!.data).toHaveLength(3);
  });

  test("adds Supporting Data or Facts under a specific Supporting Argument", () => {
    const board = createDefaultBoard();
    const argumentId = board.supportingArguments[0]!.id;
    const updated = addSupportingDataFact(board, argumentId);

    expect(updated.supportingArguments[0]!.data).toHaveLength(4);
    expect(updated.supportingArguments[1]!.data).toHaveLength(3);
  });

  test("keeps newly added IDs unique after delete gaps so controls affect one target", () => {
    let board = createDefaultBoard();
    const secondArgumentId = board.supportingArguments[1]!.id;
    board = deleteSupportingArgument(board, secondArgumentId);
    board = addSupportingArgument(board);

    expect(new Set(board.supportingArguments.map((argument) => argument.id)).size).toBe(board.supportingArguments.length);

    const argumentId = board.supportingArguments[0]!.id;
    const secondDataId = board.supportingArguments[0]!.data[1]!.id;
    board = deleteSupportingDataFact(board, argumentId, secondDataId);
    board = addSupportingDataFact(board, argumentId);

    const dataIds = board.supportingArguments[0]!.data.map((item) => item.id);
    expect(new Set(dataIds).size).toBe(dataIds.length);

    const lastDataId = dataIds.at(-1)!;
    const duplicated = duplicateSupportingDataFact(board, argumentId, lastDataId);
    const deleted = deleteSupportingDataFact(duplicated, argumentId, lastDataId);

    expect(duplicated.supportingArguments[0]!.data).toHaveLength(board.supportingArguments[0]!.data.length + 1);
    expect(deleted.supportingArguments[0]!.data).toHaveLength(duplicated.supportingArguments[0]!.data.length - 1);
  });

  test("reorders, duplicates, and deletes within the structured support hierarchy", () => {
    let board = createDefaultBoard();
    const argumentId = board.supportingArguments[0]!.id;
    const firstDataId = board.supportingArguments[0]!.data[0]!.id;
    const secondDataId = board.supportingArguments[0]!.data[1]!.id;
    board = updateSupportingDataFact(board, argumentId, firstDataId, { text: "First fact" });
    board = updateSupportingDataFact(board, argumentId, secondDataId, { text: "Second fact" });

    const moved = moveSupportingDataFact(board, argumentId, secondDataId, "up");
    const duplicated = duplicateSupportingDataFact(moved, argumentId, secondDataId);
    const deletedData = deleteSupportingDataFact(duplicated, argumentId, firstDataId);
    const deletedArgument = deleteSupportingArgument(deletedData, argumentId);

    expect(moved.supportingArguments[0]!.data[0]!.id).toBe(secondDataId);
    expect(duplicated.supportingArguments[0]!.data[1]!.text).toBe("Second fact");
    expect(duplicated.supportingArguments[0]!.data[1]!.id).not.toBe(secondDataId);
    expect(deletedData.supportingArguments[0]!.data.some((item) => item.id === firstDataId)).toBe(false);
    expect(deletedArgument.supportingArguments.some((argument) => argument.id === argumentId)).toBe(false);
  });
});
