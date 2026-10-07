import {
  factCompleteness,
  factUsageLabels,
  isGatheredFactComplete,
  readFactAttachments,
  type ArgumentBoard,
  type DataType,
  type FactDestinationId,
  type GatheredFact,
} from "../board/argument-board";
import type { ArgumentBoardSession } from "../board/argument-board-session";
import { filterFacts, type FactFilter } from "../board/fact-library";
import { escapeAttr, escapeHtml, safeDomId } from "./html";

type Editor = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
interface FactSearch { query: string; filter: FactFilter }

/** Keeps fact fields, their shared editors and filtered cards in sync without replacing the active editor. */
export function createGatheredFactEditing(root: HTMLDivElement, session: ArgumentBoardSession, disclosures: Map<string, boolean>) {
  const search: FactSearch = { query: "", filter: "all" };

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
          template.innerHTML = renderFactCard(board, fact, board.gatheredFacts.indexOf(fact));
          card = template.content.firstElementChild as HTMLElement;
          for (const details of card.querySelectorAll<HTMLDetailsElement>("details[data-disclosure]")) {
            details.open = disclosures.get(details.dataset.disclosure!) ?? false;
          }
          library.insertBefore(card, previous ? previous.nextSibling : library.firstChild);
        }
        previous = card;
      }
      library.querySelector(".fact-no-results")?.remove();
      if (!library.querySelector(".fact-card")) library.innerHTML = '<p class="fact-no-results">No matching facts. Change the search or filter.</p>';
    }
    const status = root.querySelector("#fact-results");
    if (status) status.textContent = `${facts.length} of ${board.gatheredFacts.length} facts`;
  }

  function refreshFact(fact: GatheredFact) {
    const id = CSS.escape(fact.id);
    const incomplete = factCompleteness(fact);
    const card = root.querySelector<HTMLElement>(`.fact-card[data-fact-id="${id}"]`);
    if (card) {
      card.classList.toggle("incomplete", incomplete.length > 0);
      card.querySelector(".fact-status")!.textContent = incomplete.length ? "Incomplete" : "Complete";
      let guidance = card.querySelector<HTMLUListElement>(".field-guidance");
      if (!incomplete.length) guidance?.remove();
      else {
        if (!guidance) {
          guidance = document.createElement("ul");
          guidance.className = "field-guidance";
          card.querySelector(".text-actions")!.before(guidance);
        }
        guidance.innerHTML = incomplete.map((reason) => `<li>${escapeHtml(incompleteGuidance(reason))}</li>`).join("");
      }
    } else {
      for (const attachment of root.querySelectorAll(`.attached-fact[data-fact-id="${id}"]`)) {
        attachment.classList.toggle("incomplete", incomplete.length > 0);
      }
    }
    const editors = card
      ? card.querySelectorAll<Editor>("input, textarea, select")
      : root.querySelectorAll<Editor>(`input[data-fact-id="${id}"], textarea[data-fact-id="${id}"], select[data-fact-id="${id}"]`);
    for (const editor of editors) {
      if (editor === document.activeElement) continue;
      const field = factField(editor);
      if (field && editor.value !== (fact[field] ?? "")) editor.value = fact[field] ?? "";
    }
  }

  return {
    renderLibrary(board: ArgumentBoard) { return renderGatherStage(board, search); },
    renderAttachments: renderDestinationFacts,
    edit(target: Editor): boolean {
      const field = factField(target);
      const factId = target.dataset.factId;
      if (!field || !factId) return false;
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
      if (target.dataset.action === "fact-search" && target instanceof HTMLInputElement) search.query = target.value;
      else if (target.dataset.action === "fact-filter" && target instanceof HTMLSelectElement) search.filter = target.value as FactFilter;
      else return false;
      reconcile(session.snapshot().board, false);
      return true;
    },
    reconcile() { reconcile(session.snapshot().board); },
    resetSearch() { search.query = ""; search.filter = "all"; },
  };
}

export type GatheredFactEditing = ReturnType<typeof createGatheredFactEditing>;

function factField(editor: Editor): "text" | "evidenceLink" | "dataType" | "descriptiveCitation" | "sourceTitle" | "sourceDate" | "quotation" | undefined {
  switch (editor.dataset.action) {
    case "fact-text": return "text";
    case "fact-link": return "evidenceLink";
    case "fact-citation": return "descriptiveCitation";
    case "fact-data-type": return "dataType";
    case "source-detail": {
      const field = editor.dataset.field;
      if (field === "sourceTitle" || field === "sourceDate" || field === "quotation") return field;
    }
  }
}

function renderGatherStage(board: ArgumentBoard, view: FactSearch): string {
  return `
    <section id="stage-panel-gather" class="workflow-stage" role="tabpanel" aria-labelledby="stage-tab-gather">
      <div class="section-heading">
        <div>
          <h2 id="stage-heading-gather" tabindex="-1">Gather Facts</h2>
        </div>
        <button id="add-fact" type="button" data-action="add-fact">+ Add fact</button>
      </div>
      <p class="verification-note">Link format checked; source quality and factual accuracy are not verified.</p>
      ${renderLibraryTools(board, view)}
      <div class="fact-library">
        ${
          board.gatheredFacts.length === 0
            ? `<div class="empty-state"><div class="paper-stack" aria-hidden="true"><div class="paper-back"></div><div class="paper-front"><span>FIELD NOTE / 001</span><i></i><i></i><i></i></div><span class="paper-seal">&#10035;</span></div><h3>No facts yet</h3><p>Add a finding and its source to get started.</p><button type="button" data-action="add-fact">Create your first fact <span aria-hidden="true">&#8599;</span></button></div>`
            : filterFacts(board, view.query, view.filter).length ? filterFacts(board, view.query, view.filter).map((fact) => renderFactCard(board, fact, board.gatheredFacts.indexOf(fact))).join("") : '<p class="fact-no-results">No matching facts. Change the search or filter.</p>'
        }
      </div>
    </section>
  `;
}

function renderFactCard(board: ArgumentBoard, fact: GatheredFact, index: number): string {
  const usage = factUsageLabels(board, fact.id);
  const incomplete = factCompleteness(fact);
  const prefix = `fact-${safeDomId(fact.id)}`;

  return `
    <article class="fact-card ${incomplete.length ? "incomplete" : ""}" data-fact-id="${escapeAttr(fact.id)}">
      <div class="fact-card-heading">
        <div>
          <span class="term">Gathered Fact ${index + 1}</span>
          <strong class="fact-status">${incomplete.length ? "Incomplete" : "Complete"}</strong>
        </div>
        <div class="usage-block">
          <strong>${usage.length === 0 ? "Unused" : `Used in ${usage.length} place${usage.length === 1 ? "" : "s"}`}</strong>
          ${usage.map((label) => `<span class="usage-badge">${escapeHtml(label)}</span>`).join("")}
        </div>
      </div>
      ${usage.length === 0 ? "" : `<p class="shared-warning">Used in ${usage.length} place${usage.length === 1 ? "" : "s"}. Changes update all uses.</p>`}
      <div class="fact-fields">
        ${renderDataTypeField(fact, `${prefix}-type`)}
        <label for="${prefix}-text">
          <span>Fact text</span>
          <textarea id="${prefix}-text" data-action="fact-text" data-fact-id="${escapeAttr(fact.id)}" rows="3" placeholder="Write one fact, observation, example, or estimate...">${escapeHtml(fact.text)}</textarea>
        </label>
        <label for="${prefix}-link">
          <span>Evidence Link</span>
          <input id="${prefix}-link" data-action="fact-link" data-fact-id="${escapeAttr(fact.id)}" type="url" value="${escapeAttr(fact.evidenceLink)}" placeholder="https://example.com/source" />
        </label>
        ${renderCitationField(fact, prefix)}
      </div>
      ${renderSourceDetails(fact, prefix)}
      ${
        incomplete.length === 0
          ? ""
          : `<ul class="field-guidance">${incomplete
              .map((reason) => `<li>${escapeHtml(incompleteGuidance(reason))}</li>`)
              .join("")}</ul>`
      }
      <div class="text-actions" aria-label="Gathered Fact ${index + 1} controls">
        <button type="button" data-action="move-library-fact" data-fact-id="${escapeAttr(fact.id)}" data-direction="up">Move up</button>
        <button type="button" data-action="move-library-fact" data-fact-id="${escapeAttr(fact.id)}" data-direction="down">Move down</button>
        <button type="button" data-action="another-fact-source" data-fact-id="${escapeAttr(fact.id)}">Another fact from this source</button>
        <button type="button" class="danger" data-action="delete-fact" data-fact-id="${escapeAttr(fact.id)}">Delete fact</button>
      </div>
    </article>
  `;
}


function renderDestinationFacts(board: ArgumentBoard, destinationId: FactDestinationId): string {
  const { attachedFacts: facts, attachableFacts: available, label } = readFactAttachments(board, destinationId);

  return `
    <details class="destination-facts" data-disclosure="destination-${escapeAttr(destinationId)}" aria-label="Facts supporting ${escapeAttr(label)}"><summary>Supporting Facts <span>${facts.length} attached</span></summary>
      <div class="destination-heading">
        <div>
          <strong>Supporting Facts</strong>
          <span>${facts.length} attached</span>
        </div>
        <div class="fact-picker">
          <label>
            <span class="sr-only">Choose Gathered Facts for ${escapeHtml(label)}</span>
            <select data-action="attach-fact" data-destination-id="${escapeAttr(destinationId)}" ${available.length === 0 ? "disabled" : ""}>
              <option value="">${available.length === 0 ? "No complete facts available" : "Choose Gathered Facts…"}</option>
              ${available.map((fact) => `<option value="${escapeAttr(fact.id)}">${escapeHtml(fact.text)}</option>`).join("")}
            </select>
          </label>
          <button type="button" data-action="create-fact-here" data-destination-id="${escapeAttr(destinationId)}">Create new fact here</button>
        </div>
      </div>
      <div class="attached-list">
        ${
          facts.length === 0
            ? `<p class="empty-attachment">No facts attached.</p>`
            : facts.map((fact, index) => renderAttachedFact(board, destinationId, fact, index)).join("")
        }
      </div>
    </details>
  `;
}

function renderAttachedFact(
  board: ArgumentBoard,
  destinationId: FactDestinationId,
  fact: GatheredFact,
  index: number,
): string {
  const usage = factUsageLabels(board, fact.id);
  const prefix = `attached-${safeDomId(destinationId)}-${safeDomId(fact.id)}`;

  return `
    <article class="attached-fact ${isGatheredFactComplete(fact) ? "" : "incomplete"}" data-fact-id="${escapeAttr(fact.id)}">
      <div class="attached-fact-heading">
        <strong>Fact ${index + 1}</strong>
        <span>Used in ${usage.length} place${usage.length === 1 ? "" : "s"}. Changes update all uses</span>
      </div>
      <div class="attached-fields">
        ${renderDataTypeField(fact, `${prefix}-type`)}
        <label for="${prefix}-text">
          <span>Fact text</span>
          <textarea id="${prefix}-text" data-action="fact-text" data-fact-id="${escapeAttr(fact.id)}" rows="2">${escapeHtml(fact.text)}</textarea>
        </label>
        <label for="${prefix}-link">
          <span>Evidence Link</span>
          <input id="${prefix}-link" data-action="fact-link" data-fact-id="${escapeAttr(fact.id)}" type="url" value="${escapeAttr(fact.evidenceLink)}" />
        </label>
        ${renderCitationField(fact, prefix)}
      </div>
      <div class="text-actions">
        <button type="button" data-action="focus-attached-fact" data-focus-id="${prefix}-text">Edit fact</button>
        <button type="button" data-action="open-fact" data-fact-id="${escapeAttr(fact.id)}">Open in Gathered Facts</button>
        <button type="button" data-action="move-attached-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}" data-direction="up">Move up</button>
        <button type="button" data-action="move-attached-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}" data-direction="down">Move down</button>
        <button type="button" data-action="detach-fact" data-destination-id="${escapeAttr(destinationId)}" data-fact-id="${escapeAttr(fact.id)}">Remove from here</button>
      </div>
    </article>
  `;
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


function incompleteGuidance(reason: ReturnType<typeof factCompleteness>[number]): string {
  const messages = {
    "needs-text": "Add fact text.",
    "needs-link": "Add an evidence link or descriptive citation.",
    "invalid-link": "Use a valid http:// or https:// evidence link.",
  };
  return messages[reason];
}



function renderLibraryTools(board: ArgumentBoard, view: FactSearch): string {
  return `<div class="library-tools"><label>Search facts<input id="fact-search" type="search" data-action="fact-search" value="${escapeAttr(view.query)}" placeholder="Text, source, date, or quotation"></label>
    <label>Show<select id="fact-filter" data-action="fact-filter">${(["all", "unused", "incomplete"] as const).map((filter) => `<option value="${filter}" ${view.filter === filter ? "selected" : ""}>${filter === "all" ? "All facts" : filter === "unused" ? "Unused facts" : "Incomplete facts"}</option>`).join("")}</select></label>
    <button type="button" data-action="load-example">Worked example</button></div>
    <p id="fact-results" role="status">${filterFacts(board, view.query, view.filter).length} of ${board.gatheredFacts.length} facts</p>`;
}

function renderSourceDetails(fact: GatheredFact, prefix: string): string {
  return `<details class="source-details" data-disclosure="source-${escapeAttr(fact.id)}"><summary>Source details</summary><div class="source-fields">
    ${([['sourceTitle', 'Source title'], ['sourceDate', 'Source date'], ['quotation', 'Quotation']] as const).map(([field, label]) => `<label for="${prefix}-${field}">${label}${field === "quotation" ? `<textarea id="${prefix}-${field}" data-action="source-detail" data-field="${field}" data-fact-id="${escapeAttr(fact.id)}" rows="2">${escapeHtml(fact[field] ?? "")}</textarea>` : `<input id="${prefix}-${field}" type="text" data-action="source-detail" data-field="${field}" data-fact-id="${escapeAttr(fact.id)}" value="${escapeAttr(fact[field] ?? "")}" ${field === "sourceDate" ? 'placeholder="Publication date, if known"' : ""}>`}</label>`).join("")}
  </div></details>`;
}

function renderCitationField(fact: GatheredFact, prefix: string): string {
  return `<label class="citation-field" for="${prefix}-citation"><span id="${prefix}-citation-label">Descriptive citation</span>
    <textarea id="${prefix}-citation" data-action="fact-citation" data-fact-id="${escapeAttr(fact.id)}" rows="2" aria-labelledby="${prefix}-citation-label" aria-describedby="${prefix}-source-help" placeholder="Book and passage, interview notes, or observation record">${escapeHtml(fact.descriptiveCitation ?? "")}</textarea>
    <small id="${prefix}-source-help">Provide an Evidence Link, a descriptive citation, or both.</small>
  </label>`;
}
