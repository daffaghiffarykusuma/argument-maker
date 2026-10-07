import type { ArgumentBoard } from "../board/argument-board";
import { projectArgumentPreview, type ArgumentPreviewFact } from "../board/argument-preview-projection";
import { projectWritingDocument } from "../board/writing-export";
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
    const scale = Math.min(1, (container.clientWidth - 32) / box.width, (container.clientHeight - 32) / box.height) * zoom;
    svg.style.width = `${Math.max(1, box.width * scale)}px`;
    svg.style.height = `${Math.max(1, box.height * scale)}px`;
    const output = root.querySelector(".zoom-status");
    if (output) output.textContent = zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}% of fit`;
  }

  return {
    render(board: ArgumentBoard, copyButton: string): string {
      const projection = projectArgumentPreview(board);
      source = projection.mermaid;
      return renderPreviewStage(projection, board, mode, copyButton);
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
        }
      } catch {
        // An older failure must not evict a newer pending or completed diagram.
        if (diagram === requestedDiagram) diagram = undefined;
        if (currentGeneration === generation && !disposed) {
          container.innerHTML = '<div class="mermaid-status error">The workflow could not be rendered. Check the Mermaid source below.</div>';
        }
      }
    },
    setMode(nextMode: PreviewMode) { mode = nextMode; },
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

function renderPreviewStage(preview: ReturnType<typeof projectArgumentPreview>, board: ArgumentBoard, mode: PreviewMode, copyButton: string): string {
  return `
    <section id="stage-panel-preview" class="workflow-stage preview-view" role="tabpanel" aria-labelledby="stage-tab-preview">
      <div class="section-heading">
        <div>
          <h2 id="stage-heading-preview" tabindex="-1">Argument Preview</h2>
        </div>
        ${copyButton}
      </div>
      <p class="verification-note">Link format checked; source quality and factual accuracy are not verified.</p>
      ${renderPreviewTools(board, mode)}
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
  const citation = fact.descriptiveCitation?.trim()
    ? `<span>Descriptive citation: ${escapeHtml(fact.descriptiveCitation)}</span>` : "";
  if (fact.sourceReferenceStatus === "valid-link") {
    return `${citation}<a href="${escapeAttr(fact.evidenceLink)}" target="_blank" rel="noreferrer" aria-label="Open evidence source for ${escapeAttr(fact.text || "fact needing text")}">Open evidence source</a>`;
  }
  if (fact.sourceReferenceStatus === "invalid-link") return `${citation}<span class="invalid-source">Evidence link is invalid</span>`;
  return fact.sourceReferenceStatus === "citation-only" ? citation : '<span class="invalid-source">Evidence link or descriptive citation is missing</span>';
}

function renderPreviewTools(board: ArgumentBoard, mode: PreviewMode): string {
  return `<div class="preview-tools" aria-label="Preview tools">
    <button type="button" data-action="preview-mode" data-mode="diagram" aria-pressed="${mode === "diagram"}">Diagram</button>
    <button type="button" data-action="preview-mode" data-mode="outline" aria-pressed="${mode === "outline"}">Readable outline</button>
    <button type="button" data-action="download-writing" data-format="markdown">Download Markdown</button>
    <button type="button" data-action="download-writing" data-format="text">Download text</button>
    <button type="button" data-action="print">Print / Save PDF</button></div>
    <div class="outline-preview" ${mode === "outline" ? "" : "hidden"}>${renderWritingDocument(projectWritingDocument(board))}</div>
    <div class="zoom-tools" ${mode === "diagram" ? "" : "hidden"}><button type="button" data-action="zoom" data-zoom="out" aria-label="Zoom out">−</button><output class="zoom-status" aria-live="polite">Fit</output><button type="button" data-action="zoom" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-action="zoom" data-zoom="fit">Fit to view</button></div>`;
}

function loadMermaid() {
  return (mermaidPromise ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        background: "#111111",
        primaryColor: "#242424",
        primaryTextColor: "#ededed",
        darkMode: true,
        textColor: "#ededed",
        primaryBorderColor: "#616161",
        lineColor: "#a0a0a0",
        secondaryColor: "#1c1c1c",
        tertiaryColor: "#151515",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
    });
    return mermaid;
  }).catch((error) => {
    mermaidPromise = undefined;
    throw error;
  }));
}

