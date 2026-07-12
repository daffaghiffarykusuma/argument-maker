import { describe, expect, test } from "bun:test";
import {
  createDefaultBoard,
  updateScqaEvidenceLink,
  updateScqaField,
  updateSupportingArgument,
  updateSupportingDataFact,
} from "./argument-board";
import { reviewBoard } from "./review";

describe("Argument Board review", () => {
  test("reports structural readiness issues without scoring truth or persuasiveness", () => {
    const board = createDefaultBoard();
    const issues = reviewBoard(board);

    expect(issues.map((issue) => issue.code)).toEqual([
      "missing-situation",
      "missing-complication",
      "missing-question",
      "missing-answer",
      "missing-supporting-argument",
    ]);
    expect(issues.every((issue) => !issue.message.toLowerCase().includes("persuasive"))).toBe(true);
    expect(issues.every((issue) => !issue.message.toLowerCase().includes("true"))).toBe(true);
  });

  test("requires data and valid evidence links only for evidence-backed support", () => {
    let board = createDefaultBoard();
    board = updateScqaField(board, "situation", "A group is choosing a dinner place.");
    board = updateScqaField(board, "complication", "The place needs to work for shared meals.");
    board = updateScqaField(board, "question", "Is this restaurant worth recommending?");
    board = updateScqaField(board, "answer", "Yes, for group dinners.");

    const argumentId = board.supportingArguments[0]!.id;
    board = updateSupportingArgument(board, argumentId, {
      text: "It offers practical shared meal options.",
      mode: "evidence-backed",
    });

    expect(reviewBoard(board).map((issue) => issue.code)).toContain("needs-data");

    const dataId = board.supportingArguments[0]!.data[0]!.id;
    board = updateSupportingDataFact(board, argumentId, dataId, {
      text: "The menu includes a shared platter.",
      evidenceLink: "not-a-url",
      dataType: "fact",
    });

    expect(reviewBoard(board).map((issue) => issue.code)).toContain("invalid-evidence-link");

    board = updateSupportingDataFact(board, argumentId, dataId, {
      evidenceLink: "https://example.com/menu",
    });

    expect(reviewBoard(board)).toEqual([]);
  });

  test("flags invalid optional evidence links on Situation and Complication", () => {
    const board = updateScqaEvidenceLink(createDefaultBoard(), "complication", "not-a-url");

    expect(reviewBoard(board)).toContainEqual({
      code: "invalid-evidence-link",
      message: "Use a valid http:// or https:// evidence link.",
      targetId: "complication",
    });
  });
});
