import {
  factCompleteness,
  readFactAttachments,
  type ArgumentBoard,
  type DataType,
  type FactDestinationId,
  type GatheredFact,
} from "../board/argument-board";
import type { ArgumentBoardSession } from "../board/argument-board-session";
import {
  attachmentAvailability,
  attachmentCandidates,
  describeFact,
  filterFacts,
  incompleteGuidance,
  type FactFilter,
} from "../board/fact-library";
import { escapeAttr, escapeHtml, safeDomId } from "./html";

type Editor = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Disclosures = ReadonlyMap<string, boolean>;
type EditorKind = "library" | "attached";
type FactState = ReturnType<typeof factState>;
// The ids a fact editor gives its controls, after the editor's prefix.
const editorIdSuffixes = new Set([
  "type",
  "text",
  "link",
  "citation",
  "citation-label",
  "source-help",
  "sourceTitle",
  "sourceDate",
  "quotation",
]);
interface FactSearch {
  query: string;
  filter: FactFilter;
}

/** Keeps fact fields, their shared editors and filtered cards in sync without replacing the active editor. */
export function createGatheredFactEditing(root: HTMLDivElement, session: ArgumentBoardSession, disclosures: Map<string, boolean>) {
  const search: FactSearch = { query: "", filter: "all" };
  const untouchedFacts = new Set<string>();

  function reconcile(board: ArgumentBoard, preserveEditor = true) {
    const library = root.querySelector(".fact-library");
    if (!library) return;
    const facts = filterFacts(board, search.query, search.filter);
    if (board.gatheredFacts.length) {
      const cards = new Map([...library.querySelectorAll<HTMLElement>(".fact-card")].map((card) => [card.dataset.factId!, card]));
      const activeCard = preserveEditor ? document.activeElement?.closest<HTMLElement>(".fact-card") : null;
      const matchingIds = new Set(facts.map((fact) => fact.id));
      // A nonmatching card remains until focus leaves it, including Tab between its fields.
      const visible = board.gatheredFacts.filter((fact) => matchingIds.has(fact.id) || (activeCard && cards.get(fact.id) === activeCard));
      const visibleIds = new Set(visible.map((fact) => fact.id));
      for (const [id, card] of cards) {
        if (visibleIds.has(id)) continue;
        for (const details of card.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")) {
          disclosures.set(details.dataset.disclosure!, details.open);
        }
        card.remove();
      }
      let previous: HTMLElement | undefined;
      for (const fact of visible) {
        let card = cards.get(fact.id);
        if (!card) {
          const template = document.createElement("template");
          template.innerHTML = renderFactCard(board, fact, disclosures, untouchedFacts.has(fact.id));
          card = template.content.firstElementChild as HTMLElement;
          for (const details of card.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")) {
            details.open = disclosures.get(details.dataset.disclosure!) ?? details.open;
          }
          library.insertBefore(card, previous ? previous.nextSibling : library.firstChild);
        }
        previous = card;
      }
      library.querySelector(".fact-no-results")?.remove();
      if (!library.querySelector(".fact-card"))
        library.innerHTML = '<p class="fact-no-results">No matching facts. Change the search or filter.</p>';
    }
    const status = root.querySelector("#fact-results");
    if (status) status.textContent = `${facts.length} of ${board.gatheredFacts.length} facts`;
  }

  function refreshFact(fact: GatheredFact) {
    const state = factState(fact, untouchedFacts.has(fact.id));
    const feedbackHtml = renderFactFeedback(state);
    // Browsers index classes but not attribute values: select by class, then match the fact here.
    for (const container of root.querySelectorAll<HTMLElement>(".fact-card, .attached-fact")) {
      if (container.dataset.factId !== fact.id) continue;
      container.classList.toggle("incomplete", state.incomplete);
      const status = container.querySelector(".fact-status");
      if (status && status.textContent !== state.status) status.textContent = state.status;
      const summary = container.querySelector(".fact-summary");
      if (summary) summary.innerHTML = renderFactSummary(fact);
      const feedback = container.querySelector(".fact-feedback");
      if (feedback && feedback.innerHTML !== feedbackHtml) feedback.innerHTML = feedbackHtml;
      // Every editor of a fact sits in one of its cards or attached copies.
      for (const editor of container.querySelectorAll<Editor>("input[data-fact-id], textarea[data-fact-id], select[data-fact-id]")) {
        if (editor === document.activeElement) continue;
        const field = factField(editor);
        if (field && editor.value !== (fact[field] ?? "")) editor.value = fact[field] ?? "";
      }
    }
    const board = session.snapshot().board;
    for (const count of root.querySelectorAll<HTMLElement>(".destination-facts > summary > .attached-count")) {
      const html = renderAttachedCount(board, count.closest<HTMLElement>(".destination-facts")!.dataset.destinationId!);
      if (count.outerHTML !== html) count.outerHTML = html;
    }
    for (const picker of root.querySelectorAll<HTMLDetailsElement>(".attachment-picker")) {
      if (picker.open) refreshPicker(board, picker);
      const guidance = picker.closest(".destination-facts")?.querySelector(".attachment-guidance");
      const html = renderAttachmentGuidance(attachmentAvailability(board, picker.dataset.destinationId!));
      if (guidance && guidance.innerHTML !== html) guidance.innerHTML = html;
    }
  }

  /** Add a closed editor's fields from the current board, keeping its Source details where the author left them. */
  function openEditor(editor: HTMLDetailsElement) {
    const kind = editor.dataset.lazy as EditorKind | undefined;
    const factId = editor.closest<HTMLElement>(".fact-card, .attached-fact")?.dataset.factId;
    const fact = session.snapshot().board.gatheredFacts.find(({ id }) => id === factId);
    if (!kind || !fact) return;
    delete editor.dataset.lazy;
    editor.insertAdjacentHTML(
      "beforeend",
      renderEditorFields(kind, fact, editor.dataset.prefix!, factState(fact, untouchedFacts.has(fact.id))),
    );
    for (const details of editor.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")) {
      details.open = disclosures.get(details.dataset.disclosure!) ?? details.open;
    }
  }

  function refreshPicker(board: ArgumentBoard, picker: HTMLElement) {
    const query = picker.querySelector<HTMLInputElement>("input")?.value ?? "";
    picker.querySelector(".attachment-results")!.innerHTML = renderAttachmentResults(board, picker.dataset.destinationId!, query);
  }

  return {
    renderLibrary(board: ArgumentBoard) {
      return renderGatherStage(board, search, untouchedFacts, disclosures);
    },
    renderAttachments(board: ArgumentBoard, destinationId: FactDestinationId) {
      return renderDestinationFacts(board, destinationId, untouchedFacts, disclosures);
    },
    beginFact(factId: string) {
      untouchedFacts.add(factId);
    },
    finishInteraction(target: Editor) {
      const factId = target.dataset.factId;
      if (!factField(target) || !factId || !untouchedFacts.delete(factId)) return;
      const fact = session.snapshot().board.gatheredFacts.find((fact) => fact.id === factId);
      if (fact) refreshFact(fact);
    },
    edit(target: Editor): boolean {
      const field = factField(target);
      const factId = target.dataset.factId;
      if (!field || !factId) return false;
      untouchedFacts.delete(factId);
      const board = session.dispatch(
        { type: "update-gathered-fact", factId, changes: { [field]: target.value } },
        target instanceof HTMLSelectElement ? undefined : target.id,
      );
      const fact = board.gatheredFacts.find((fact) => fact.id === factId);
      if (fact) refreshFact(fact);
      reconcile(board);
      return true;
    },
    filter(target: Editor): boolean {
      if (target.dataset.action === "attachment-search") {
        refreshPicker(session.snapshot().board, target.closest<HTMLElement>(".attachment-picker")!);
        return true;
      }
      if (target.dataset.action === "fact-search" && target instanceof HTMLInputElement) search.query = target.value;
      else if (target.dataset.action === "fact-filter" && target instanceof HTMLSelectElement) search.filter = target.value as FactFilter;
      else return false;
      reconcile(session.snapshot().board, false);
      return true;
    },
    reconcile() {
      reconcile(session.snapshot().board);
    },
    /** Give a closed editor its fields as it opens. */
    openEditor(editor: HTMLDetailsElement) {
      if (editor.dataset.lazy) openEditor(editor);
    },
    /** Find a control by id, first adding the fields of the closed editor that would hold it. */
    reveal(id: string): HTMLElement | null {
      for (const editor of root.querySelectorAll<HTMLDetailsElement>(".fact-editor[data-lazy]")) {
        const prefix = editor.dataset.prefix!;
        if (id.startsWith(`${prefix}-`) && editorIdSuffixes.has(id.slice(prefix.length + 1))) {
          openEditor(editor);
          return document.getElementById(id);
        }
      }
      return null;
    },
    /** Fill a picker as it opens; closed pickers stay empty so a board with many facts and destinations keeps a small DOM. */
    openPicker(picker: HTMLDetailsElement) {
      refreshPicker(session.snapshot().board, picker);
    },
    resetSearch() {
      search.query = "";
      search.filter = "all";
    },
  };
}

export type GatheredFactEditing = ReturnType<typeof createGatheredFactEditing>;

function factField(
  editor: Editor,
): "text" | "evidenceLink" | "dataType" | "descriptiveCitation" | "sourceTitle" | "sourceDate" | "quotation" | undefined {
  switch (editor.dataset.action) {
    case "fact-text":
      return "text";
    case "fact-link":
      return "evidenceLink";
    case "fact-citation":
      return "descriptiveCitation";
    case "fact-data-type":
      return "dataType";
    case "source-detail": {
      const field = editor.dataset.field;
      if (field === "sourceTitle" || field === "sourceDate" || field === "quotation") return field;
    }
  }
}

/** The one rule for how a fact's completeness shows on its card, its attached copies and their partial refreshes. */
function factState(fact: GatheredFact, untouched: boolean) {
  const reasons = factCompleteness(fact);
  return {
    untouched,
    incomplete: reasons.length > 0 && !untouched,
    status: untouched ? "Draft" : reasons.length ? "Incomplete" : "Complete",
    guidance: untouched ? [] : reasons.map(incompleteGuidance),
  };
}

function renderFactFeedback(state: ReturnType<typeof factState>): string {
  if (state.untouched) return '<p class="fact-writing-prompt">Write a finding and identify its source when you are ready.</p>';
  return state.guidance.length
    ? `<ul class="field-guidance">${state.guidance.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>`
    : "";
}

function renderGatherStage(board: ArgumentBoard, view: FactSearch, untouchedFacts: ReadonlySet<string>, disclosures: Disclosures): string {
  return `
    <section id="stage-panel-gather" class="workflow-stage" role="tabpanel" aria-labelledby="stage-tab-gather">
      <h2 id="stage-heading-gather" class="stage-title" tabindex="-1">Gather Facts</h2>
      <div class="stage-intro">
        <p class="verification-note">Link format checked; source quality and factual accuracy are not verified.</p>
        <button id="add-fact" type="button" data-action="add-fact">+ Add fact</button>
      </div>
      ${renderLibraryTools(board, view)}
      <div class="fact-library">
        ${
          board.gatheredFacts.length === 0
            ? `<div class="empty-state"><div class="empty-slip" aria-hidden="true"><p>A finding you can point to.</p><small>Its source: a link, a book passage, an interview</small></div><h3>No facts yet</h3><p>Add a finding and its source, or open a worked example to see how a finished board fits together.</p><button type="button" data-action="load-example">Worked example</button></div>`
            : filterFacts(board, view.query, view.filter).length
              ? filterFacts(board, view.query, view.filter)
                  .map((fact) => renderFactCard(board, fact, disclosures, untouchedFacts.has(fact.id)))
                  .join("")
              : '<p class="fact-no-results">No matching facts. Change the search or filter.</p>'
        }
      </div>
    </section>
  `;
}

function renderFactCard(board: ArgumentBoard, fact: GatheredFact, disclosures: Disclosures, untouched = false): string {
  const { number, usage } = describeFact(board, fact);
  const state = factState(fact, untouched);
  const prefix = `fact-${safeDomId(fact.id)}`;

  return `
    <article class="fact-card ${state.incomplete ? "incomplete" : ""}" data-fact-id="${escapeAttr(fact.id)}">
      <div class="fact-card-heading">
        <div>
          <span class="term">Gathered Fact ${number}</span>
          <strong class="fact-status" role="status">${state.status}</strong>
        </div>
        <div class="usage-block">
          <strong>${usage.length === 0 ? "Not used yet" : "Used in"}</strong>
          ${usage.map((label) => `<span class="usage-badge">${escapeHtml(label)}</span>`).join("")}
        </div>
      </div>
      <div class="fact-summary">${renderFactSummary(fact)}</div>
      ${renderFactEditor("library", fact, prefix, state, disclosures.get(`editor-${prefix}`) ?? untouched)}
      <div class="text-actions" aria-label="Gathered Fact ${number} controls">
        ${renderMoveButtons(`data-action="move-library-fact" data-fact-id="${escapeAttr(fact.id)}"`, number - 1, board.gatheredFacts.length)}
        <button type="button" data-action="another-fact-source" data-fact-id="${escapeAttr(fact.id)}">Another fact from this source</button>
        ${usage.length > 1 ? '<span class="shared-warning">Edits update every use</span>' : ""}
        <button type="button" class="danger" data-action="delete-fact" data-fact-id="${escapeAttr(fact.id)}">Delete fact</button>
      </div>
    </article>
  `;
}

function renderFactSummary(fact: GatheredFact): string {
  const source = [fact.sourceTitle, fact.descriptiveCitation, fact.evidenceLink].filter((value) => value?.trim()).join(" · ");
  const empty = !fact.text.trim() && !source ? " is-empty" : "";
  return `<p class="fact-finding${empty}">${escapeHtml(fact.text.trim() || "No finding yet")}</p><p class="fact-source"><strong>Source reference</strong> ${escapeHtml(source || "No source yet")}</p>`;
}

function renderDestinationFacts(
  board: ArgumentBoard,
  destinationId: FactDestinationId,
  untouchedFacts: ReadonlySet<string>,
  disclosures: Disclosures,
): string {
  const { attachedFacts: facts, label } = readFactAttachments(board, destinationId);
  const availability = attachmentAvailability(board, destinationId);
  const guidanceId = `attachment-guidance-${safeDomId(destinationId)}`;
  const research = board.gatheredFacts.length > 0;

  return `
    <details class="destination-facts" data-disclosure="destination-${escapeAttr(destinationId)}" data-destination-id="${escapeAttr(destinationId)}" aria-label="Facts supporting ${escapeAttr(label)}"><summary>Supporting Facts ${renderAttachedCount(board, destinationId)}</summary>
      <div class="destination-heading">
        <div>
          <strong>Supporting Facts</strong>
          <span>${facts.length} attached</span>
        </div>
        <div class="fact-picker">
          <details class="attachment-picker" data-destination-id="${escapeAttr(destinationId)}" ${research ? "" : "hidden"}>
            <summary id="attachment-picker-${safeDomId(destinationId)}">Choose Gathered Facts</summary>
            <p>Attach to ${escapeHtml(label)}</p>
            <label>Search facts to attach<input type="search" data-action="attachment-search" placeholder="Finding, source, date, or quotation"></label>
            <div class="attachment-results"></div>
            <button type="button" data-action="close-fact-picker">Close picker</button>
          </details>
          <button type="button" data-action="create-fact-here" data-destination-id="${escapeAttr(destinationId)}">Create new fact here</button>
        </div>
      </div>
      <div id="${guidanceId}" class="attachment-guidance" role="status" aria-live="polite">${renderAttachmentGuidance(availability)}</div>
      <div class="attached-list">
        ${
          facts.length === 0
            ? research
              ? `<p class="empty-attachment">No facts attached.</p>`
              : ""
            : facts
                .map((fact, index) =>
                  renderAttachedFact(board, destinationId, fact, index, facts.length, disclosures, untouchedFacts.has(fact.id)),
                )
                .join("")
        }
      </div>
    </details>
  `;
}

/** The count on a destination's disclosure. An Evidence-backed reason without a complete fact says so where the author works, not only in the checks. */
function renderAttachedCount(board: ArgumentBoard, destinationId: FactDestinationId): string {
  const { attachedFacts: facts } = readFactAttachments(board, destinationId);
  const needsEvidence =
    board.supportingArguments.find((argument) => argument.id === destinationId)?.mode === "evidence-backed" &&
    !facts.some((fact) => factCompleteness(fact).length === 0);
  if (needsEvidence)
    return `<span class="attached-count needs-fact">${facts.length ? `${facts.length} attached, none complete` : "Needs a complete fact"}</span>`;
  return `<span class="attached-count${facts.length ? "" : " is-empty"}">${facts.length} attached</span>`;
}

function renderAttachmentResults(board: ArgumentBoard, destinationId: FactDestinationId, query: string) {
  if (!board.gatheredFacts.length) return '<p role="status">No facts gathered yet. Create a fact here to start gathering evidence.</p>';
  const candidates = attachmentCandidates(board, destinationId, query);
  if (!candidates.length)
    return '<p role="status">No matching facts. Try another finding or source.</p><button type="button" data-action="clear-attachment-search">Clear search</button>';
  return `<p role="status">${candidates.length} matching fact${candidates.length === 1 ? "" : "s"}</p>${candidates
    .map(
      ({ fact, number, usage, status, guidance }) => `<article class="attachment-result" aria-label="Gathered Fact ${number}">
      ${renderFactSummary(fact)}
      <p class="pick-meta"><span class="pick-status pick-${status}">${{ attached: "Already attached here", incomplete: "Incomplete", available: "Available to attach" }[status]}</span> ${escapeHtml(usage.length ? `Used in ${usage.join(", ")}` : "Unused")}</p>
      ${guidance.length ? `<p>${guidance.map(escapeHtml).join(" ")}</p>` : ""}
      ${status === "attached" ? `<button type="button" data-action="show-attached-fact" data-fact-id="${escapeAttr(fact.id)}">View attached fact</button>` : status === "incomplete" ? `<button type="button" data-action="open-fact" data-fact-id="${escapeAttr(fact.id)}">Complete this fact</button>` : `<button type="button" data-action="attach-fact" data-fact-id="${escapeAttr(fact.id)}" data-destination-id="${escapeAttr(destinationId)}">Attach fact</button>`}
    </article>`,
    )
    .join("")}`;
}

function renderAttachmentGuidance(state: ReturnType<typeof attachmentAvailability>) {
  return `<p>${state.message}</p>${state.unfinished ? `<button type="button" data-action="open-fact" data-fact-id="${escapeAttr(state.unfinished.id)}">Complete a gathered fact</button>` : ""}`;
}

function renderAttachedFact(
  board: ArgumentBoard,
  destinationId: FactDestinationId,
  fact: GatheredFact,
  index: number,
  count: number,
  disclosures: Disclosures,
  untouched = false,
): string {
  const { usage } = describeFact(board, fact);
  const state = factState(fact, untouched);
  const prefix = `attached-${safeDomId(destinationId)}-${safeDomId(fact.id)}`;

  return `
    <article class="attached-fact ${state.incomplete ? "incomplete" : ""}" data-fact-id="${escapeAttr(fact.id)}">
      <div class="attached-fact-heading">
        <strong>Fact ${index + 1}</strong>
        <span>Used in ${usage.length} place${usage.length === 1 ? "" : "s"}. Changes update all uses</span>
      </div>
      <div class="fact-summary">${renderFactSummary(fact)}</div>
      ${renderFactEditor("attached", fact, prefix, state, disclosures.get(`editor-${prefix}`) ?? untouched)}
      <div class="text-actions">
        <button type="button" data-action="open-fact" data-fact-id="${escapeAttr(fact.id)}">Open in Gathered Facts</button>
        ${renderMoveButtons(`data-action="move-attached-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}"`, index, count)}
        <button type="button" data-action="detach-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}">Remove from here</button>
      </div>
    </article>
  `;
}

/**
 * A fact's editor. Closed, it is only its summary: a large library holds hundreds of closed editors, and their
 * fields would dominate every render. Its fields are added when it first opens and then kept.
 */
function renderFactEditor(kind: EditorKind, fact: GatheredFact, prefix: string, state: FactState, open: boolean): string {
  return `<details class="fact-editor" data-disclosure="editor-${prefix}" ${open ? "open" : `data-lazy="${kind}" data-prefix="${prefix}"`}>
      <summary>Edit fact</summary>${open ? renderEditorFields(kind, fact, prefix, state) : ""}
      </details>`;
}

function renderEditorFields(kind: EditorKind, fact: GatheredFact, prefix: string, state: FactState): string {
  const library = kind === "library";
  return `
      <div class="${library ? "fact-fields" : "attached-fields"}">
        ${renderDataTypeField(fact, `${prefix}-type`)}
        <label for="${prefix}-text">
          <span>Fact text</span>
          <textarea id="${prefix}-text" data-action="fact-text" data-fact-id="${escapeAttr(fact.id)}" ${library ? 'rows="3" placeholder="Write one fact, observation, example, or estimate..."' : 'rows="2"'}>${escapeHtml(fact.text)}</textarea>
        </label>
        <label for="${prefix}-link">
          <span>Evidence Link</span>
          <input id="${prefix}-link" data-action="fact-link" data-fact-id="${escapeAttr(fact.id)}" type="url" value="${escapeAttr(fact.evidenceLink)}" ${library ? 'placeholder="https://example.com/source" ' : ""}/>
        </label>
        ${renderCitationField(fact, prefix)}
      </div>
      ${renderSourceDetails(fact, prefix)}
      <div class="fact-feedback" aria-live="polite">${renderFactFeedback(state)}</div>`;
}

/** Reorder controls that only appear when there is something to reorder, and never offer a move past either end. */
function renderMoveButtons(attrs: string, index: number, count: number): string {
  if (count < 2) return "";
  return `<button type="button" ${attrs} data-direction="up" ${index === 0 ? "disabled" : ""}>Move up</button>
        <button type="button" ${attrs} data-direction="down" ${index === count - 1 ? "disabled" : ""}>Move down</button>`;
}

function renderDataTypeField(fact: GatheredFact, id: string): string {
  return `
    <label for="${id}">
      <span>Data Type <small>(optional)</small></span>
      <select id="${id}" data-action="fact-data-type" data-fact-id="${escapeAttr(fact.id)}">
        ${renderDataTypeOption("", "Unspecified", fact.dataType)}
        ${renderDataTypeOption("fact", "Fact", fact.dataType)}
        ${renderDataTypeOption("observation", "Observation", fact.dataType)}
        ${renderDataTypeOption("example", "Example", fact.dataType)}
        ${renderDataTypeOption("estimate", "Estimate", fact.dataType)}
      </select>
    </label>
  `;
}

function renderDataTypeOption(value: DataType, label: string, selected: DataType): string {
  return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
}

function renderLibraryTools(board: ArgumentBoard, view: FactSearch): string {
  return `<div class="library-tools"><label>Search facts<input id="fact-search" type="search" data-action="fact-search" value="${escapeAttr(view.query)}" placeholder="Text, source, date, or quotation"></label>
    <label>Show<select id="fact-filter" data-action="fact-filter">${(["all", "unused", "incomplete"] as const).map((filter) => `<option value="${filter}" ${view.filter === filter ? "selected" : ""}>${filter === "all" ? "All facts" : filter === "unused" ? "Unused facts" : "Incomplete facts"}</option>`).join("")}</select></label></div>
    <p id="fact-results" role="status">${filterFacts(board, view.query, view.filter).length} of ${board.gatheredFacts.length} facts</p>`;
}

function renderSourceDetails(fact: GatheredFact, prefix: string): string {
  return `<details class="source-details" data-disclosure="source-${escapeAttr(fact.id)}"><summary>Source details</summary><div class="source-fields">
    ${(
      [
        ["sourceTitle", "Source title"],
        ["sourceDate", "Source date"],
        ["quotation", "Quotation"],
      ] as const
    )
      .map(
        ([field, label]) =>
          `<label for="${prefix}-${field}">${label}${field === "quotation" ? `<textarea id="${prefix}-${field}" data-action="source-detail" data-field="${field}" data-fact-id="${escapeAttr(fact.id)}" rows="2">${escapeHtml(fact[field] ?? "")}</textarea>` : `<input id="${prefix}-${field}" type="text" data-action="source-detail" data-field="${field}" data-fact-id="${escapeAttr(fact.id)}" value="${escapeAttr(fact[field] ?? "")}" ${field === "sourceDate" ? 'placeholder="Publication date, if known"' : ""}>`}</label>`,
      )
      .join("")}
  </div></details>`;
}

function renderCitationField(fact: GatheredFact, prefix: string): string {
  return `<label class="citation-field" for="${prefix}-citation"><span id="${prefix}-citation-label">Descriptive citation</span>
    <textarea id="${prefix}-citation" data-action="fact-citation" data-fact-id="${escapeAttr(fact.id)}" rows="2" aria-labelledby="${prefix}-citation-label" aria-describedby="${prefix}-source-help" placeholder="Book and passage, interview notes, or observation record">${escapeHtml(fact.descriptiveCitation ?? "")}</textarea>
    <small id="${prefix}-source-help">Provide an Evidence Link, a descriptive citation, or both.</small>
  </label>`;
}
