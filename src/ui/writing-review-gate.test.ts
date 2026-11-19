import { describe, expect, test } from "bun:test";
import { createWritingReviewGate } from "./writing-review-gate";

describe("writing review gate", () => {
  test("starts on the workflow stage with undecided exports labeled Draft", () => {
    expect(createWritingReviewGate().view()).toEqual({ panel: "stage", label: undefined, draft: true, waiting: undefined });
  });

  test("an undecided export invites review instead of exporting", () => {
    const gate = createWritingReviewGate();
    expect(gate.send({ type: "request-export", action: "markdown" })).toEqual({});
    expect(gate.view()).toMatchObject({ panel: "invitation", waiting: undefined });
  });

  test("choosing Draft performs the waiting export with the Draft label", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "print" });
    expect(gate.send({ type: "choose-label", label: "draft" })).toEqual({
      perform: { action: "print", draft: true },
      settled: "print",
    });
    expect(gate.view()).toMatchObject({ panel: "stage", label: "draft", draft: true });
  });

  test("Review now returns to the stages and keeps the export waiting, unlabeled, until the author continues", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "text" });
    gate.send({ type: "review-now" });
    expect(gate.view()).toMatchObject({ panel: "stage", label: "reviewed", draft: false, waiting: "text" });
    gate.send({ type: "leave" });
    expect(gate.view().waiting).toBe("text");
    expect(gate.send({ type: "choose-label", label: "reviewed" })).toMatchObject({ perform: { action: "text", draft: false } });
    expect(gate.view().waiting).toBeUndefined();
  });

  test("once a label is chosen, later exports run immediately with that label", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "copy-outline" });
    gate.send({ type: "choose-label", label: "draft" });
    expect(gate.send({ type: "request-export", action: "markdown" })).toEqual({ perform: { action: "markdown", draft: true } });
    gate.send({ type: "toggle-draft-label" });
    expect(gate.send({ type: "request-export", action: "markdown" }).perform).toEqual({ action: "markdown", draft: false });
  });

  test("cancelling settles the waiting export without performing it", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "markdown" });
    expect(gate.send({ type: "cancel-export" })).toEqual({ settled: "markdown" });
    expect(gate.view()).toMatchObject({ panel: "stage", label: undefined });
    expect(gate.send({ type: "choose-label", label: "draft" })).toEqual({});
  });

  test("leaving the invitation abandons its export; reset also forgets the label", () => {
    const gate = createWritingReviewGate();
    gate.send({ type: "request-export", action: "print" });
    gate.send({ type: "leave" });
    expect(gate.view()).toMatchObject({ panel: "stage", label: undefined, waiting: undefined });
    gate.send({ type: "request-export", action: "print" });
    gate.send({ type: "review-now" });
    gate.send({ type: "reset" });
    expect(gate.view()).toEqual({ panel: "stage", label: undefined, draft: true, waiting: undefined });
  });
});
