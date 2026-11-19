/**
 * Owns the optional Reasoning review that sits in front of Writing exports:
 * which panel replaces the workflow stage, which export is waiting, and
 * whether exports carry the Draft label. It has no DOM knowledge, so every
 * transition is unit-testable.
 */
export type WritingAction = "copy-outline" | "markdown" | "text" | "print";
export type WritingPanel = "stage" | "invitation" | "review";
export type WritingLabel = "draft" | "reviewed";

export type WritingGateEvent =
  | { type: "open-review" }
  | { type: "close-review" }
  | { type: "request-export"; action: WritingAction }
  | { type: "review-now" }
  | { type: "choose-label"; label: WritingLabel }
  | { type: "cancel-export" }
  | { type: "toggle-draft-label" }
  | { type: "leave" }
  | { type: "reset" };

export interface WritingGateView {
  panel: WritingPanel;
  /** Set once the author chose Draft or Reviewed; exports then skip the invitation. */
  label?: WritingLabel;
  /** Whether Writing exports, including a browser print, show the Draft label. */
  draft: boolean;
  /** Whether the Reasoning review offers "Continue to export". */
  offerContinue: boolean;
}

export interface WritingGateOutcome {
  /** The author left the workflow stage, so their editing position should be held for the return. */
  leftStage: boolean;
  /** An export the caller should perform now, with its Draft label already decided. */
  perform?: { action: WritingAction; draft: boolean };
  /** The export that was waiting, if this event resolved or cancelled it. */
  settled?: WritingAction;
}

export function createWritingReviewGate() {
  let panel: WritingPanel = "stage";
  let label: WritingLabel | undefined;
  let pending: WritingAction | undefined;

  // An undecided label errs toward Draft: unreviewed writing should not look final.
  const draft = () => label !== "reviewed";

  function view(): WritingGateView {
    return { panel, label, draft: draft(), offerContinue: panel === "review" && pending !== undefined };
  }

  function send(event: WritingGateEvent): WritingGateOutcome {
    const fromStage = panel === "stage";
    const outcome = (extra: Partial<WritingGateOutcome> = {}): WritingGateOutcome => ({
      leftStage: fromStage && panel !== "stage",
      ...extra,
    });

    switch (event.type) {
      case "open-review":
        panel = "review";
        return outcome();
      case "close-review":
      case "leave":
        panel = "stage";
        return outcome();
      case "request-export":
        if (label) return outcome({ perform: { action: event.action, draft: draft() } });
        pending = event.action;
        panel = "invitation";
        return outcome();
      case "review-now":
        label = "reviewed";
        panel = "review";
        return outcome();
      case "choose-label": {
        const action = pending;
        if (!action) return outcome();
        label = event.label;
        pending = undefined;
        panel = "stage";
        return outcome({ perform: { action, draft: draft() }, settled: action });
      }
      case "cancel-export": {
        const action = pending;
        pending = undefined;
        panel = "stage";
        return outcome({ settled: action });
      }
      case "toggle-draft-label":
        label = label === "draft" ? "reviewed" : "draft";
        return outcome();
      case "reset":
        panel = "stage";
        label = undefined;
        pending = undefined;
        return outcome();
    }
  }

  return { view, send };
}

export type WritingReviewGate = ReturnType<typeof createWritingReviewGate>;
