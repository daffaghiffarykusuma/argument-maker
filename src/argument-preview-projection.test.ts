import { describe, expect, test } from "bun:test";
import {
  createDefaultBoard,
  updateScqaField,
  updateSupportingArgument,
  updateSupportingDataFact,
} from "./argument-board";
import { projectArgumentPreview } from "./argument-preview-projection";

describe("Argument Preview projection", () => {
  test("concentrates active structure, readiness labels, Mermaid source, and outline data", () => {
    let board = createDefaultBoard();
    board = updateScqaField(board, "situation", "A group needs a dinner venue.");
    board = updateScqaField(board, "complication", "Shared meals need to be good value.");
    board = updateScqaField(board, "question", "Should we recommend it?");
    board = updateScqaField(board, "answer", "Yes, for group dinners.");
    const argumentId = board.supportingArguments[0]!.id;
    board = updateSupportingArgument(board, argumentId, {
      text: "The menu supports sharing.",
      mode: "evidence-backed",
    });
    const dataId = board.supportingArguments[0]!.data[0]!.id;
    board = updateSupportingDataFact(board, argumentId, dataId, {
      text: "A platter serves four people.",
      evidenceLink: "not-a-url",
      dataType: "fact",
    });

    const preview = projectArgumentPreview(board);

    expect(preview.chain.map((item) => item.label)).toEqual(["Situation", "Complication", "Question", "Answer"]);
    expect(preview.arguments).toHaveLength(1);
    expect(preview.arguments[0]!.label).toBe("Supporting Argument 1");
    expect(preview.arguments[0]!.supportMode).toBe("Evidence-backed");
    expect(preview.arguments[0]!.data[0]).toMatchObject({
      label: "A platter serves four people. [invalid evidence link]",
      formattedDataType: "Fact",
      evidenceState: "invalid-link",
    });
    expect(preview.mermaid).toContain("flowchart TD");
    expect(preview.mermaid).toContain("The menu supports sharing.");
    expect(preview.mermaid).not.toContain("argument_2");
  });
});
