import { createExampleBoard } from "../../src/board/example-board";
import { createArgumentPreview } from "../../src/ui/argument-preview";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Preview lifecycle: ${message}`);
}

function fixture() {
  const root = document.createElement("div");
  root.style.width = "800px";
  document.body.append(root);
  const requests: { id: string; source: string; resolve(): void; reject(): void }[] = [];
  const preview = createArgumentPreview(root, (id, source) => new Promise<string>((resolve, reject) => {
    requests.push({
      id, source,
      resolve: () => resolve(`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" viewBox="0 0 1000 500"><text>${id}</text></svg>`),
      reject: () => reject(new Error("Controlled render failure")),
    });
  }));
  const board = createExampleBoard();
  return {
    root, requests, preview, board,
    show() {
      root.innerHTML = preview.render(board, "");
      root.querySelector<HTMLElement>(".mermaid-diagram")!.style.cssText = "width:100%;height:300px;min-height:0;padding:0;border:0";
      return preview.sync();
    },
    hide() { root.innerHTML = "<p>Another stage</p>"; return preview.sync(); },
    svgId: () => root.querySelector("svg")?.id,
    close() { preview.dispose(); root.remove(); },
  };
}

/** Runs in Chromium through the same preview interface used by the app. */
export async function verifyPreviewLifecycle() {
  const pending = fixture();
  try {
    const first = pending.show();
    await pending.hide();
    pending.preview.setMode("outline");
    await pending.show();
    check(pending.requests.length === 1, "outline must not start diagram work");
    pending.preview.setMode("diagram");
    const returned = pending.show();
    await Promise.resolve();
    check(pending.requests.length === 1, "repeated visits must share pending work");
    pending.requests[0]!.resolve();
    await Promise.all([first, returned]);
    check(pending.svgId() === pending.requests[0]!.id, "pending result must reach the current target");
    pending.preview.zoom("in");
    const width = pending.root.querySelector<SVGSVGElement>("svg")!.style.width;
    await pending.hide();
    await pending.show();
    check(pending.requests.length === 1, "completed diagram must remain cached across stages");
    check(pending.root.querySelector(".zoom-status")!.textContent === "125% of fit", "zoom must persist on cached insertion");
    check(pending.root.querySelector<SVGSVGElement>("svg")!.style.width === width, "cached diagram must be sized again");
    pending.root.style.width = "240px";
    for (let frame = 0; frame < 60 && pending.root.querySelector<SVGSVGElement>("svg")!.style.width === width; frame++) {
      await new Promise(requestAnimationFrame);
    }
    check(parseFloat(pending.root.querySelector<SVGSVGElement>("svg")!.style.width) < parseFloat(width), "resize must refit the diagram");
    for (let i = 0; i < 30; i++) pending.preview.zoom("in");
    check(pending.root.querySelector(".zoom-status")!.textContent === "600% of fit", "zoom must stop at its upper limit");
    for (let i = 0; i < 30; i++) pending.preview.zoom("out");
    check(pending.root.querySelector(".zoom-status")!.textContent === "50% of fit", "zoom must stop at its lower limit");
    pending.preview.zoom("fit");
    check(pending.root.querySelector(".zoom-status")!.textContent === "Fit", "fit must reset zoom");
  } finally { pending.close(); }

  for (const olderFails of [false, true]) {
    const race = fixture();
    try {
      const older = race.show();
      await Promise.resolve();
      race.board.scqa.answer.text = "A newer answer.";
      const newer = race.show();
      await Promise.resolve();
      check(race.requests.length === 2 && race.requests[0]!.source !== race.requests[1]!.source, "changed source must start a new render");
      race.requests[1]!.resolve();
      await newer;
      if (olderFails) race.requests[0]!.reject(); else race.requests[0]!.resolve();
      await older;
      check(race.svgId() === race.requests[1]!.id, "older completion must not replace the newer diagram");
      await race.show();
      check(race.requests.length === 2, "older completion must not evict the newer cache");
      race.board.scqa.answer.text = createExampleBoard().scqa.answer.text;
      const originalSource = race.show();
      await Promise.resolve();
      check(Number(race.requests.length) === 3, "cache must retain only the latest source");
      race.requests[2]!.resolve();
      await originalSource;
    } finally { race.close(); }
  }

  const retry = fixture();
  try {
    const failed = retry.show();
    await Promise.resolve();
    retry.requests[0]!.reject();
    await failed;
    check(retry.root.querySelector(".mermaid-status.error"), "current failure must show recovery guidance");
    check(retry.requests.length === 1, "failure must not automatically retry");
    await retry.hide();
    const retried = retry.show();
    await Promise.resolve();
    check(Number(retry.requests.length) === 2, "next visit must retry a failed render");
    retry.requests[1]!.resolve();
    await retried;
    await retry.show();
    check(retry.svgId() === retry.requests[1]!.id && Number(retry.requests.length) === 2, "successful retry must be cached");
  } finally { retry.close(); }

  const absent = fixture();
  try {
    const work = absent.show();
    const detachedTarget = absent.root.querySelector(".mermaid-diagram")!;
    await absent.hide();
    absent.requests[0]!.resolve();
    await work;
    check(!detachedTarget.querySelector("svg") && !absent.svgId(), "leaving preview must invalidate its insertion target");
    await absent.show();
    check(absent.svgId() === absent.requests[0]!.id && absent.requests.length === 1, "result completed while away must remain reusable");
  } finally { absent.close(); }

  const left = fixture();
  const right = fixture();
  try {
    const first = left.show();
    const second = right.show();
    await Promise.resolve();
    check(left.requests[0]!.id !== right.requests[0]!.id, "Mermaid IDs must be unique across app instances");
    right.requests[0]!.resolve();
    await second;
    left.requests[0]!.resolve();
    await first;
    check(left.svgId() && right.svgId(), "another app must not invalidate a pending preview");
    left.board.scqa.answer.text = "Pending when disposed.";
    const disposed = left.show();
    await Promise.resolve();
    left.preview.dispose();
    left.requests[1]!.resolve();
    await disposed;
    check(!left.svgId(), "disposed preview must not insert a pending result");
  } finally { left.close(); right.close(); }

  return "pending reuse, stale success/failure, retry, navigation, zoom/resize, independent instances and disposal";
}
