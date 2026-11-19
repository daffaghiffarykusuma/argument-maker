import { describe, expect, test } from "bun:test";
import { createWritingReviewGate } from "./writing-review-gate";

describe("writing review gate", () => {
  test("starts on the workflow stage with undecided exports labeled Draft", () => {
    expect(createWritingReviewGate().view()).toEqual({ panel: "stage", label: undefined, draft: true, offerContinue: false });
  });

  test("an undecided export invites review instead of exporting", () => {
    const gate = createWritingReviewGate();
    const outcome = gate.send({ type: "request-export", action: "markdown" });
    expect(outcome).toEqual({ leftStage: true });
    expect(gate.view().panel).toBe("invitation");
  });

  test("choosing Draft performs the waiting export with the Draft label", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "print" });
    expect(gate.send({ type: "choose-label", label: "draft" })).toEqual({
      leftStage: false,
      perform: { action: "print", draft: true },
      settled: "print",
    });
    expect(gate.view()).toMatchObject({ panel: "stage", label: "draft", draft: true });
  });

  test("Review now opens the review and offers to continue the waiting export unlabeled", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "text" });
    gate.send({ type: "review-now" });
    expect(gate.view()).toMatchObject({ panel: "review", label: "reviewed", draft: false, offerContinue: true });
    expect(gate.send({ type: "choose-label", label: "reviewed" })).toMatchObject({ perform: { action: "text", draft: false } });
    expect(gate.view().offerContinue).toBe(false);
  });

  test("once a label is chosen, later exports run immediately with that label", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "copy-outline" });
    gate.send({ type: "choose-label", label: "draft" });
    expect(gate.send({ type: "request-export", action: "markdown" })).toEqual({
      leftStage: false,
      perform: { action: "markdown", draft: true },
    });
    gate.send({ type: "toggle-draft-label" });
    expect(gate.send({ type: "request-export", action: "markdown" }).perform).toEqual({ action: "markdown", draft: false });
  });

  test("cancelling settles the waiting export without performing it", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "markdown" });
    expect(gate.send({ type: "cancel-export" })).toEqual({ leftStage: false, settled: "markdown" });
    expect(gate.view()).toMatchObject({ panel: "stage", label: undefined });
    expect(gate.send({ type: "choose-label", label: "draft" })).toEqual({ leftStage: false });
  });

  test("only leaving the workflow stage asks the caller to hold the editing position", () => {
    const gate = createWritingReviewGate();
    expect(gate.send({ type: "open-review" }).leftStage).toBe(true);
    expect(gate.send({ type: "request-export", action: "print" }).leftStage).toBe(false);
    expect(gate.send({ type: "open-review" }).leftStage).toBe(false);
    expect(gate.view().offerContinue).toBe(true);
  });

  test("leaving and reset return to the stage; reset also forgets the label and waiting export", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "print" });
    gate.send({ type: "review-now" });
    gate.send({ type: "leave" });
    expect(gate.view()).toMatchObject({ panel: "stage", label: "reviewed" });
    gate.send({ type: "reset" });
    expect(gate.view()).toEqual({ panel: "stage", label: undefined, draft: true, offerContinue: false });
    gate.send({ type: "open-review" });
    expect(gate.view().offerContinue).toBe(false);
  });
});
