import { expect, test } from "bun:test";
import { createArgumentBoardSession } from "./argument-board-session";
import { attachmentAvailability, attachmentCandidates, describeFact, factDeletionImpact, usedFactCount } from "./fact-library";
import { hasOutlineContent, narrativeGuidance, suggestStartingStep } from "./construction-guidance";

function sessionWithFacts() {
  const session = createArgumentBoardSession();
  session.dispatch({ type: "create-gathered-fact" });
  session.dispatch({
    type: "update-gathered-fact",
    factId: "fact-1",
    changes: { text: "Complete finding", evidenceLink: "https://example.com/a" },
  });
  session.dispatch({ type: "create-gathered-fact" });
  session.dispatch({ type: "update-gathered-fact", factId: "fact-2", changes: { text: "Unsourced finding" } });
  return session;
}

test("an empty library explains how to start from a destination", () => {
  const board = createArgumentBoardSession().snapshot().board;
  expect(attachmentAvailability(board, "situation")).toMatchObject({
    available: [],
    unfinished: undefined,
    message: "No facts gathered yet. Create a fact here to start gathering evidence.",
  });
  expect(attachmentCandidates(board, "situation", "")).toEqual([]);
});

test("availability points at the unfinished fact while a complete one can still attach", () => {
  const board = sessionWithFacts().snapshot().board;
  const state = attachmentAvailability(board, "situation");
  expect(state.available.map(({ id }) => id)).toEqual(["fact-1"]);
  expect(state.unfinished?.id).toBe("fact-2");
  expect(state.message).toBe("Finish an incomplete fact to attach it.");
});

test("availability reports when every complete fact is already attached", () => {
  const session = sessionWithFacts();
  session.dispatch({ type: "attach-fact", destinationId: "situation", factId: "fact-1" });
  expect(attachmentAvailability(session.snapshot().board, "situation").message).toBe(
    "All complete facts are already attached here. Finish an incomplete fact to attach it.",
  );
  session.dispatch({ type: "update-gathered-fact", factId: "fact-2", changes: { evidenceLink: "https://example.com/b" } });
  session.dispatch({ type: "attach-fact", destinationId: "situation", factId: "fact-2" });
  expect(attachmentAvailability(session.snapshot().board, "situation")).toMatchObject({
    unfinished: undefined,
    message: "All complete facts are already attached here.",
  });
});

test("picker candidates agree with what the destination can actually attach", () => {
  const session = sessionWithFacts();
  session.dispatch({ type: "create-gathered-fact" });
  session.dispatch({
    type: "update-gathered-fact",
    factId: "fact-3",
    changes: { text: "Another sourced finding", descriptiveCitation: "Interview" },
  });
  session.dispatch({ type: "attach-fact", destinationId: "situation", factId: "fact-3" });
  const board = session.snapshot().board;
  const candidates = attachmentCandidates(board, "situation", "");
  expect(candidates.map(({ fact, status }) => [fact.id, status])).toEqual([
    ["fact-1", "available"],
    ["fact-2", "incomplete"],
    ["fact-3", "attached"],
  ]);
  const available = candidates.filter(({ status }) => status === "available").map(({ fact }) => fact.id);
  expect(available).toEqual(attachmentAvailability(board, "situation").available.map(({ id }) => id));
  expect(candidates[1]!.guidance).toEqual(["Add an evidence link or descriptive citation."]);
  expect(attachmentCandidates(board, "situation", "interview").map(({ fact }) => fact.id)).toEqual(["fact-3"]);
});

test("describing a fact numbers it and lists every placement", () => {
  const session = sessionWithFacts();
  const argumentId = session.snapshot().board.supportingArguments[0]!.id;
  session.dispatch({ type: "attach-fact", destinationId: "situation", factId: "fact-1" });
  session.dispatch({ type: "attach-fact", destinationId: argumentId, factId: "fact-1" });
  const board = session.snapshot().board;
  expect(describeFact(board, board.gatheredFacts[0]!)).toEqual({
    number: 1,
    usage: ["Situation", "Supporting Argument 1"],
    incomplete: [],
    guidance: [],
  });
  expect(usedFactCount(board)).toBe(1);
});

test("deleting a fact reports its placements and the neighbour that takes focus", () => {
  const session = sessionWithFacts();
  session.dispatch({ type: "attach-fact", destinationId: "situation", factId: "fact-1" });
  const board = session.snapshot().board;
  expect(factDeletionImpact(board, "fact-1")).toEqual({ usage: ["Situation"], nextFocusFactId: "fact-2" });
  expect(factDeletionImpact(board, "fact-2")).toEqual({ usage: [], nextFocusFactId: "fact-1" });
  expect(factDeletionImpact(board, "missing")).toBeUndefined();
});

test("starting guidance moves from framing to gathering, reasoning and preview", () => {
  const session = createArgumentBoardSession();
  expect(suggestStartingStep(session.snapshot().board)).toBe("frame");
  expect(hasOutlineContent(session.snapshot().board)).toBe(false);
  session.dispatch({ type: "update-scqa", field: "question", text: "What should change?" });
  expect(suggestStartingStep(session.snapshot().board)).toBe("gather");
  expect(hasOutlineContent(session.snapshot().board)).toBe(true);
  session.dispatch({ type: "create-gathered-fact" });
  expect(suggestStartingStep(session.snapshot().board)).toBe("reason");
  const argumentId = session.snapshot().board.supportingArguments[0]!.id;
  session.dispatch({ type: "update-supporting-argument", argumentId, changes: { text: "Because" } });
  expect(suggestStartingStep(session.snapshot().board)).toBe("preview");
});

test("narrative guidance appears only for a visited, empty field", () => {
  const session = createArgumentBoardSession();
  expect(narrativeGuidance(session.snapshot().board, "answer")).toBe("");
  session.dispatch({ type: "update-scqa", field: "answer", text: "Draft" });
  session.dispatch({ type: "update-scqa", field: "answer", text: "" });
  expect(narrativeGuidance(session.snapshot().board, "answer")).toBe("Add a tentative claim or main answer when you are ready.");
});
