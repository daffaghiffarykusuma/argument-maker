/**
 * Owns the optional review that sits in front of Writing exports: whether the
 * invitation covers the workflow stage, which export is waiting, and whether
 * exports carry the Draft label. Review itself is an ordinary workflow tab; this
 * gate only remembers that an export waits for the author to finish reviewing.
 * It has no DOM knowledge, so every transition is unit-testable.
 */
export type WritingAction = "copy-outline" | "markdown" | "text" | "print";
export type WritingPanel = "stage" | "invitation";
export type WritingLabel = "draft" | "reviewed";

export type WritingGateEvent =
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
  /** The export waiting for the author to finish reviewing; Review offers "Continue to export" for it. */
  waiting?: WritingAction;
}

export interface WritingGateOutcome {
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
    return { panel, label, draft: draft(), waiting: panel === "stage" ? pending : undefined };
  }

  function send(event: WritingGateEvent): WritingGateOutcome {
    switch (event.type) {
      case "request-export":
        if (label) return { perform: { action: event.action, draft: draft() } };
        pending = event.action;
        panel = "invitation";
        return {};
      case "review-now":
        label = "reviewed";
        panel = "stage";
        return {};
      case "choose-label": {
        const action = pending;
        if (!action) return {};
        label = event.label;
        pending = undefined;
        panel = "stage";
        return { perform: { action, draft: draft() }, settled: action };
      }
      case "cancel-export": {
        const action = pending;
        pending = undefined;
        panel = "stage";
        return { settled: action };
      }
      case "toggle-draft-label":
        label = label === "draft" ? "reviewed" : "draft";
        return {};
      case "leave":
        // Walking away from the invitation abandons its export; an export waiting on review stays available.
        if (panel === "invitation") pending = undefined;
        panel = "stage";
        return {};
      case "reset":
        panel = "stage";
        label = undefined;
        pending = undefined;
        return {};
    }
  }

  return { view, send };
}

export type WritingReviewGate = ReturnType<typeof createWritingReviewGate>;
