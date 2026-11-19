import type { ArgumentBoard } from "../board/argument-board";
import { hasOutlineContent } from "../board/construction-guidance";
import { usedFactCount } from "../board/fact-library";
import { projectArgumentPreview, type ArgumentPreviewFact } from "../board/argument-preview-projection";
import { escapeAttr, escapeHtml } from "./html";
import { renderWritingDocument } from "./writing-view";

type PreviewMode = "diagram" | "outline";
type DiagramRenderer = (id: string, source: string) => Promise<string>;
let nextDiagramId = 0;
let mermaidPromise: Promise<typeof import("mermaid")["default"]> | undefined;

/** Owns one app's preview. Call sync after every replacement of the app's markup. */
export function createArgumentPreview(root: HTMLDivElement, renderDiagram: DiagramRenderer = renderMermaid) {
  let mode: PreviewMode = "diagram";
  let zoom = 1;
  let source = "";
  let generation = 0;
  let disposed = false;
  let diagram: { source: string; svg: Promise<string> } | undefined;
  const observer = new ResizeObserver(sizeDiagram);
  observer.observe(root);

  function sizeDiagram() {
    if (disposed) return;
    const container = root.querySelector<HTMLDivElement>(".mermaid-diagram");
    const svg = container?.querySelector<SVGSVGElement>("svg");
    if (!container || !svg || container.hidden) return;
    const box = svg.viewBox.baseVal;
    if (!box.width || !box.height) return;
    // The canvas grows with the diagram up to its max-height, so fit against that cap rather than the current height.
    const padding = 32;
    const maxHeight = Number.parseFloat(getComputedStyle(container).maxHeight) || container.clientHeight;
    const fit = Math.min(1, (container.clientWidth - padding) / box.width, (maxHeight - padding) / box.height);
    // On a phone, fitting a wide diagram would shrink its labels below reading size; scroll sideways instead.
    const readable = container.clientWidth < 640 ? 0.7 : 0;
    const scale = Math.max(fit, readable) * zoom;
    svg.style.width = `${Math.max(1, box.width * scale)}px`;
    svg.style.height = `${Math.max(1, box.height * scale)}px`;
    const output = root.querySelector(".zoom-status");
    if (output) output.textContent = `${Math.round(zoom * 100)}%`;
  }

  return {
    render(board: ArgumentBoard, copyButton: string): string {
      const projection = projectArgumentPreview(board);
      source = projection.mermaid;
      // Before anything is written or attached the diagram is only the empty frame, with nothing worth copying.
      const empty = !hasOutlineContent(board) && usedFactCount(board) === 0;
      return renderPreviewStage(projection, mode, zoom, empty ? "" : copyButton, empty);
    },
    async sync(): Promise<void> {
      const currentGeneration = ++generation;
      const container = root.querySelector<HTMLDivElement>(".mermaid-diagram");
      if (disposed || !container || container.hidden || mode !== "diagram") return;
      // Retain just the latest source, including pending work across stage changes.
      if (diagram?.source !== source) {
        const requestedSource = source;
        const id = `argument-preview-${++nextDiagramId}`;
        diagram = { source, svg: Promise.resolve().then(() => renderDiagram(id, requestedSource)) };
      }
      const requestedDiagram = diagram;
      try {
        const svg = await requestedDiagram.svg;
        if (currentGeneration === generation && !disposed) {
          container.innerHTML = svg;
          sizeDiagram();
          // A diagram wider than a phone opens on its centred top, where the chain of claims starts.
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        }
      } catch {
        // An older failure must not evict a newer pending or completed diagram.
        if (diagram === requestedDiagram) diagram = undefined;
        if (currentGeneration === generation && !disposed) {
          container.innerHTML =
            '<div class="mermaid-status error">The workflow could not be rendered. Check the Mermaid source below.</div>';
        }
      }
    },
    setMode(nextMode: PreviewMode) {
      mode = nextMode;
    },
    zoom(direction: "in" | "out" | "fit") {
      zoom = direction === "fit" ? 1 : Math.max(0.5, Math.min(6, zoom * (direction === "in" ? 1.25 : 0.8)));
      sizeDiagram();
    },
    dispose() {
      disposed = true;
      generation += 1;
      diagram = undefined;
      observer.disconnect();
    },
  };
}

export type ArgumentPreview = ReturnType<typeof createArgumentPreview>;

async function renderMermaid(id: string, source: string): Promise<string> {
  const mermaid = await loadMermaid();
  return (await mermaid.render(id, source)).svg;
}

function renderPreviewStage(
  preview: ReturnType<typeof projectArgumentPreview>,
  mode: PreviewMode,
  zoom: number,
  copyButton: string,
  empty: boolean,
): string {
  return `
    <section class="review-section preview-view" aria-labelledby="review-read-heading">
      <h3 id="review-read-heading">Your argument</h3>
      <div class="stage-intro">
        <div class="preview-tools" aria-label="Preview tools">
          <button type="button" id="preview-mode-diagram" data-action="preview-mode" data-mode="diagram" aria-pressed="${mode === "diagram"}">Diagram</button>
          <button type="button" id="preview-mode-outline" data-action="preview-mode" data-mode="outline" aria-pressed="${mode === "outline"}">Readable outline</button>
        </div>
        ${renderZoomTools(mode, zoom)}
        ${copyButton}
      </div>
      ${
        empty
          ? '<div class="starting-guidance"><p>Nothing written yet. This is the shape your argument will take.</p><button type="button" data-action="stage" data-stage="construct">Start writing</button></div>'
          : '<p class="verification-note">Link format checked; source quality and factual accuracy are not verified.</p>'
      }
      <div class="outline-preview" ${mode === "outline" ? "" : "hidden"}>${renderWritingDocument(preview.writing)}</div>
      <div class="mermaid-diagram" ${mode === "diagram" ? "" : "hidden"} role="img" aria-label="Rendered Argument Board workflow">
        <div class="mermaid-status">Rendering workflow...</div>
      </div>
      <p class="diagram-hint" ${mode === "diagram" ? "" : "hidden"}>Zoom for detail, or use Readable outline for the full argument and citations.</p>
      <section class="evidence-list" ${mode === "diagram" ? "" : "hidden"} aria-labelledby="evidence-list-heading">
        <h3 id="evidence-list-heading">Evidence by destination</h3>
        ${
          preview.evidenceGroups.length === 0
            ? "<p>No facts are attached to the argument.</p>"
            : preview.evidenceGroups.map(renderEvidenceGroup).join("")
        }
      </section>
      <details class="mermaid-source" data-disclosure="mermaid-source">
        <summary>Mermaid source</summary>
        <pre class="mermaid-box">${escapeHtml(preview.mermaid)}</pre>
      </details>
    </section>
  `;
}

function renderEvidenceGroup(group: ReturnType<typeof projectArgumentPreview>["evidenceGroups"][number]): string {
  return `
    <section class="evidence-group">
      <h4>${escapeHtml(group.label)}</h4>
      <ol>
        ${group.facts
          .map(
            (fact) => `
              <li>
                <span>${escapeHtml(fact.label)}</span>
                ${renderEvidenceSource(fact)}
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  `;
}

function renderEvidenceSource(fact: ArgumentPreviewFact): string {
  const citation = fact.descriptiveCitation?.trim() ? `<span>Descriptive citation: ${escapeHtml(fact.descriptiveCitation)}</span>` : "";
  if (fact.sourceReferenceStatus === "valid-link") {
    return `${citation}<a href="${escapeAttr(fact.evidenceLink)}" target="_blank" rel="noreferrer" aria-label="Open evidence source for ${escapeAttr(fact.text || "fact needing text")}">Open evidence source</a>`;
  }
  if (fact.sourceReferenceStatus === "invalid-link") return `${citation}<span class="invalid-source">Evidence link is invalid</span>`;
  return fact.sourceReferenceStatus === "citation-only"
    ? citation
    : '<span class="invalid-source">Evidence link or descriptive citation is missing</span>';
}

function renderZoomTools(mode: PreviewMode, zoom: number): string {
  return `<div class="zoom-tools" role="group" aria-label="Diagram zoom" ${mode === "diagram" ? "" : "hidden"}><button type="button" data-action="zoom" data-zoom="out" aria-label="Zoom out">−</button><output class="zoom-status" aria-live="polite">${Math.round(zoom * 100)}%</output><button type="button" data-action="zoom" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-action="zoom" data-zoom="fit">Fit to view</button></div>`;
}

function loadMermaid() {
  // biome-ignore lint/suspicious/noAssignInExpressions: memoize the single lazy Mermaid import.
  return (mermaidPromise ??= import("mermaid")
    .then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        // Wider labels keep each claim to a few lines, so the chart stays legible at Fit.
        flowchart: { wrappingWidth: 300, nodeSpacing: 36, rankSpacing: 44, padding: 14 },
        themeVariables: {
          background: "#0b120f",
          primaryColor: "#1a2621",
          primaryTextColor: "#ebe5d5",
          darkMode: true,
          textColor: "#ebe5d5",
          primaryBorderColor: "#3c4f46",
          lineColor: "#6f8279",
          secondaryColor: "#141e1a",
          tertiaryColor: "#141e1a",
          fontFamily: '"Schibsted Grotesk Variable", "Segoe UI", system-ui, sans-serif',
          fontSize: "15px",
        },
      });
      return mermaid;
    })
    .catch((error) => {
      mermaidPromise = undefined;
      throw error;
    }));
}
