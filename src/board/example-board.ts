import { createDefaultBoard, type ArgumentBoard } from "./argument-board";

export function createExampleBoard(): ArgumentBoard {
  const board = createDefaultBoard();
  board.title = "Worked example: keyboard-friendly tabs";
  board.scqa.situation = { ...board.scqa.situation, text: "Our editor has three workflow tabs.", touched: true };
  board.scqa.complication = { ...board.scqa.complication, text: "People using a keyboard need a predictable way to move between them.", touched: true, factIds: ["fact-1"] };
  board.scqa.question = { ...board.scqa.question, text: "How should keyboard navigation work?", touched: true };
  board.scqa.answer = { ...board.scqa.answer, text: "Use the standard tab keyboard pattern and preserve focus during editing.", touched: true };
  board.gatheredFacts = [{
    id: "fact-1", text: "The W3C tabs pattern describes Left and Right Arrow navigation for horizontal tabs.",
    evidenceLink: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/", dataType: "fact", touched: true,
    sourceTitle: "W3C WAI: Tabs pattern", sourceDate: "", quotation: "",
  }];
  board.supportingArguments = [{
    ...board.supportingArguments[0]!, text: "Standard controls give keyboard users a familiar navigation pattern.", touched: true,
    mode: "evidence-backed", factIds: ["fact-1"],
    connection: "Arrow navigation lets users reach another workflow stage without stepping through every control.",
    assumptions: "Users may navigate the editor with a keyboard.",
    objection: "A pattern alone does not prove that the whole editor is usable.",
    weakensClaim: "Usability checks show that focus is lost or navigation remains confusing.",
  }];
  return board;
}
