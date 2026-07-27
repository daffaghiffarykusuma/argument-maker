export type SupportMode = "reasoning" | "evidence-backed";
export type DataType = "" | "fact" | "observation" | "example" | "estimate";
export type FactIncompleteReason = "needs-text" | "needs-link" | "invalid-link";
export type FactDestinationId = "situation" | "complication" | string;

export interface TextSlot {
  id: string;
  text: string;
  touched: boolean;
}

export interface FactTextSlot extends TextSlot {
  factIds: string[];
}

export interface GatheredFact extends TextSlot {
  evidenceLink: string;
  dataType: DataType;
}

export interface SupportingArgument extends FactTextSlot {
  mode: SupportMode;
}

export interface ArgumentBoard {
  schemaVersion: 2;
  appName: "Argument Maker";
  title: string;
  createdAt: string;
  updatedAt: string;
  gatheredFacts: GatheredFact[];
  scqa: {
    situation: FactTextSlot;
    complication: FactTextSlot;
    question: TextSlot;
    answer: TextSlot;
  };
  supportingArguments: SupportingArgument[];
}

export type ArgumentBoardCommand =
  | { type: "update-title"; title: string }
  | { type: "update-scqa"; field: keyof ArgumentBoard["scqa"]; text: string }
  | { type: "update-supporting-argument"; argumentId: string; changes: Partial<Pick<SupportingArgument, "text" | "mode">> }
  | { type: "add-supporting-argument" }
  | { type: "delete-supporting-argument"; argumentId: string }
  | { type: "move-supporting-argument"; argumentId: string; direction: "up" | "down" }
  | { type: "duplicate-supporting-argument"; argumentId: string }
  | { type: "create-gathered-fact"; evidenceLink?: string; destinationId?: FactDestinationId }
  | {
      type: "update-gathered-fact";
      factId: string;
      changes: Partial<Pick<GatheredFact, "text" | "evidenceLink" | "dataType">>;
    }
  | { type: "move-gathered-fact"; factId: string; direction: "up" | "down" }
  | { type: "delete-gathered-fact"; factId: string }
  | { type: "attach-fact"; destinationId: FactDestinationId; factId: string }
  | { type: "detach-fact"; destinationId: FactDestinationId; factId: string }
  | { type: "move-attached-fact"; destinationId: FactDestinationId; factId: string; direction: "up" | "down" };

const DEFAULT_SUPPORTING_ARGUMENT_COUNT = 3;

export function createDefaultBoard(now = new Date()): ArgumentBoard {
  const timestamp = now.toISOString();

  return {
    schemaVersion: 2,
    appName: "Argument Maker",
    title: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    gatheredFacts: [],
    scqa: {
      situation: createFactTextSlot("situation"),
      complication: createFactTextSlot("complication"),
      question: createTextSlot("question"),
      answer: createTextSlot("answer"),
    },
    supportingArguments: Array.from({ length: DEFAULT_SUPPORTING_ARGUMENT_COUNT }, (_, index) =>
      createSupportingArgument(`argument-${index + 1}`),
    ),
  };
}

export function applyArgumentBoardCommand(
  board: ArgumentBoard,
  command: ArgumentBoardCommand,
  now = new Date(),
): ArgumentBoard {
  switch (command.type) {
    case "update-title":
      return touchBoard({ ...board, title: command.title }, now);
    case "update-scqa":
      return updateScqa(board, command.field, command.text, now);
    case "update-supporting-argument":
      return updateSupportingArgument(board, command.argumentId, command.changes, now);
    case "add-supporting-argument":
      return addSupportingArgument(board, now);
    case "delete-supporting-argument":
      return deleteSupportingArgument(board, command.argumentId, now);
    case "move-supporting-argument":
      return moveSupportingArgument(board, command.argumentId, command.direction, now);
    case "duplicate-supporting-argument":
      return duplicateSupportingArgument(board, command.argumentId, now);
    case "create-gathered-fact":
      return createGatheredFact(board, command.evidenceLink ?? "", command.destinationId, now);
    case "update-gathered-fact":
      return updateGatheredFact(board, command.factId, command.changes, now);
    case "move-gathered-fact":
      return moveGatheredFact(board, command.factId, command.direction, now);
    case "delete-gathered-fact":
      return deleteGatheredFact(board, command.factId, now);
    case "attach-fact":
      return attachFact(board, command.destinationId, command.factId, now);
    case "detach-fact":
      return updateDestinationFactIds(
        board,
        command.destinationId,
        (factIds) => removeValue(factIds, command.factId),
        now,
      );
    case "move-attached-fact":
      return updateDestinationFactIds(
        board,
        command.destinationId,
        (factIds) => moveValue(factIds, command.factId, command.direction),
        now,
      );
  }
}

export function factCompleteness(fact: Pick<GatheredFact, "text" | "evidenceLink">): FactIncompleteReason[] {
  const reasons: FactIncompleteReason[] = [];

  if (!fact.text.trim()) {
    reasons.push("needs-text");
  }

  if (!fact.evidenceLink.trim()) {
    reasons.push("needs-link");
  } else if (!isValidEvidenceLink(fact.evidenceLink)) {
    reasons.push("invalid-link");
  }

  return reasons;
}

export function isGatheredFactComplete(fact: Pick<GatheredFact, "text" | "evidenceLink">): boolean {
  return factCompleteness(fact).length === 0;
}

export function isValidEvidenceLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getDestinationFactIds(board: ArgumentBoard, destinationId: FactDestinationId): string[] | undefined {
  if (destinationId === "situation" || destinationId === "complication") {
    return board.scqa[destinationId].factIds;
  }

  return board.supportingArguments.find((argument) => argument.id === destinationId)?.factIds;
}

export function destinationLabel(board: ArgumentBoard, destinationId: FactDestinationId): string {
  if (destinationId === "situation") {
    return "Situation";
  }

  if (destinationId === "complication") {
    return "Complication";
  }

  const index = board.supportingArguments.findIndex((argument) => argument.id === destinationId);
  return index < 0 ? destinationId : `Supporting Argument ${index + 1}`;
}

export function factUsageLabels(board: ArgumentBoard, factId: string): string[] {
  const destinationIds: FactDestinationId[] = ["situation", "complication", ...board.supportingArguments.map(({ id }) => id)];

  return destinationIds
    .filter((destinationId) => getDestinationFactIds(board, destinationId)?.includes(factId))
    .map((destinationId) => destinationLabel(board, destinationId));
}

function createTextSlot(id: string): TextSlot {
  return { id, text: "", touched: false };
}

function createFactTextSlot(id: string): FactTextSlot {
  return { ...createTextSlot(id), factIds: [] };
}

function createSupportingArgument(id: string): SupportingArgument {
  return { ...createFactTextSlot(id), mode: "reasoning" };
}

function createGatheredFactWithId(id: string, evidenceLink: string): GatheredFact {
  return {
    ...createTextSlot(id),
    touched: true,
    evidenceLink,
    dataType: "",
  };
}

function updateScqa(
  board: ArgumentBoard,
  field: keyof ArgumentBoard["scqa"],
  text: string,
  now: Date,
): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      scqa: {
        ...board.scqa,
        [field]: { ...board.scqa[field], text, touched: true },
      },
    },
    now,
  );
}

function updateSupportingArgument(
  board: ArgumentBoard,
  argumentId: string,
  changes: Partial<Pick<SupportingArgument, "text" | "mode">>,
  now: Date,
): ArgumentBoard {
  let changed = false;
  const supportingArguments = board.supportingArguments.map((argument) => {
    if (argument.id !== argumentId) {
      return argument;
    }

    changed = true;
    return {
      ...argument,
      ...changes,
      touched: changes.text === undefined ? argument.touched : true,
    };
  });

  return changed ? touchBoard({ ...board, supportingArguments }, now) : board;
}

function addSupportingArgument(board: ArgumentBoard, now: Date): ArgumentBoard {
  const id = makeIndexedId("argument", allBoardIds(board));
  return touchBoard({ ...board, supportingArguments: [...board.supportingArguments, createSupportingArgument(id)] }, now);
}

function deleteSupportingArgument(board: ArgumentBoard, argumentId: string, now: Date): ArgumentBoard {
  const supportingArguments = removeById(board.supportingArguments, argumentId);
  return supportingArguments === board.supportingArguments ? board : touchBoard({ ...board, supportingArguments }, now);
}

function moveSupportingArgument(
  board: ArgumentBoard,
  argumentId: string,
  direction: "up" | "down",
  now: Date,
): ArgumentBoard {
  const supportingArguments = moveById(board.supportingArguments, argumentId, direction);
  return supportingArguments === board.supportingArguments ? board : touchBoard({ ...board, supportingArguments }, now);
}

function duplicateSupportingArgument(board: ArgumentBoard, argumentId: string, now: Date): ArgumentBoard {
  const supportingArguments = duplicateById(board.supportingArguments, argumentId, (argument, id) => ({
    ...argument,
    id,
    factIds: [...argument.factIds],
  }), allBoardIds(board));

  return supportingArguments === board.supportingArguments ? board : touchBoard({ ...board, supportingArguments }, now);
}

function createGatheredFact(
  board: ArgumentBoard,
  evidenceLink: string,
  destinationId: FactDestinationId | undefined,
  now: Date,
): ArgumentBoard {
  const id = makeIndexedId("fact", allBoardIds(board));
  let nextBoard = {
    ...board,
    gatheredFacts: [...board.gatheredFacts, createGatheredFactWithId(id, evidenceLink)],
  };

  if (destinationId !== undefined) {
    nextBoard = updateDestinationFactIdsUntouched(nextBoard, destinationId, (factIds) => [...factIds, id]);
  }

  return touchBoard(nextBoard, now);
}

function updateGatheredFact(
  board: ArgumentBoard,
  factId: string,
  changes: Partial<Pick<GatheredFact, "text" | "evidenceLink" | "dataType">>,
  now: Date,
): ArgumentBoard {
  let changed = false;
  const gatheredFacts = board.gatheredFacts.map((fact) => {
    if (fact.id !== factId) {
      return fact;
    }

    changed = true;
    return { ...fact, ...changes, touched: true };
  });

  return changed ? touchBoard({ ...board, gatheredFacts }, now) : board;
}

function moveGatheredFact(board: ArgumentBoard, factId: string, direction: "up" | "down", now: Date): ArgumentBoard {
  const gatheredFacts = moveById(board.gatheredFacts, factId, direction);
  return gatheredFacts === board.gatheredFacts ? board : touchBoard({ ...board, gatheredFacts }, now);
}

function deleteGatheredFact(board: ArgumentBoard, factId: string, now: Date): ArgumentBoard {
  const gatheredFacts = removeById(board.gatheredFacts, factId);
  if (gatheredFacts === board.gatheredFacts) {
    return board;
  }

  const supportingArguments = board.supportingArguments.map((argument) => ({
    ...argument,
    factIds: argument.factIds.filter((id) => id !== factId),
  }));

  return touchBoard(
    {
      ...board,
      gatheredFacts,
      scqa: {
        ...board.scqa,
        situation: { ...board.scqa.situation, factIds: board.scqa.situation.factIds.filter((id) => id !== factId) },
        complication: {
          ...board.scqa.complication,
          factIds: board.scqa.complication.factIds.filter((id) => id !== factId),
        },
      },
      supportingArguments,
    },
    now,
  );
}

function attachFact(board: ArgumentBoard, destinationId: FactDestinationId, factId: string, now: Date): ArgumentBoard {
  const fact = board.gatheredFacts.find(({ id }) => id === factId);
  if (!fact || !isGatheredFactComplete(fact)) {
    return board;
  }

  return updateDestinationFactIds(
    board,
    destinationId,
    (factIds) => (factIds.includes(factId) ? factIds : [...factIds, factId]),
    now,
  );
}

function updateDestinationFactIds(
  board: ArgumentBoard,
  destinationId: FactDestinationId,
  update: (factIds: string[]) => string[],
  now: Date,
): ArgumentBoard {
  const nextBoard = updateDestinationFactIdsUntouched(board, destinationId, update);
  return nextBoard === board ? board : touchBoard(nextBoard, now);
}

function updateDestinationFactIdsUntouched(
  board: ArgumentBoard,
  destinationId: FactDestinationId,
  update: (factIds: string[]) => string[],
): ArgumentBoard {
  if (destinationId === "situation" || destinationId === "complication") {
    const slot = board.scqa[destinationId];
    const factIds = update(slot.factIds);
    return factIds === slot.factIds
      ? board
      : {
          ...board,
          scqa: {
            ...board.scqa,
            [destinationId]: { ...slot, factIds },
          },
        };
  }

  let changed = false;
  const supportingArguments = board.supportingArguments.map((argument) => {
    if (argument.id !== destinationId) {
      return argument;
    }

    const factIds = update(argument.factIds);
    changed = factIds !== argument.factIds;
    return changed ? { ...argument, factIds } : argument;
  });

  return changed ? { ...board, supportingArguments } : board;
}

function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  const nextItems = items.filter((item) => item.id !== id);
  return nextItems.length === items.length ? items : nextItems;
}

function moveById<T extends { id: string }>(items: T[], id: string, direction: "up" | "down"): T[] {
  const currentIndex = items.findIndex((item) => item.id === id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  [nextItems[currentIndex], nextItems[targetIndex]] = [nextItems[targetIndex]!, nextItems[currentIndex]!];
  return nextItems;
}

function removeValue(items: string[], value: string): string[] {
  const nextItems = items.filter((item) => item !== value);
  return nextItems.length === items.length ? items : nextItems;
}

function moveValue(items: string[], value: string, direction: "up" | "down"): string[] {
  const currentIndex = items.indexOf(value);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  [nextItems[currentIndex], nextItems[targetIndex]] = [nextItems[targetIndex]!, nextItems[currentIndex]!];
  return nextItems;
}

function duplicateById<T extends { id: string }>(
  items: T[],
  id: string,
  copy: (item: T, id: string) => T,
  reservedIds = items.map((item) => item.id),
): T[] {
  const currentIndex = items.findIndex((item) => item.id === id);
  if (currentIndex < 0) {
    return items;
  }

  const original = items[currentIndex]!;
  const nextItems = [...items];
  nextItems.splice(currentIndex + 1, 0, copy(original, makeCopyId(original.id, reservedIds)));
  return nextItems;
}

function allBoardIds(board: ArgumentBoard): string[] {
  return [
    board.scqa.situation.id,
    board.scqa.complication.id,
    board.scqa.question.id,
    board.scqa.answer.id,
    ...board.gatheredFacts.map((fact) => fact.id),
    ...board.supportingArguments.map((argument) => argument.id),
  ];
}

function makeCopyId(baseId: string, existingIds: string[]): string {
  let index = 1;
  let candidate = `${baseId}-copy`;

  while (existingIds.includes(candidate)) {
    index += 1;
    candidate = `${baseId}-copy-${index}`;
  }

  return candidate;
}

function makeIndexedId(prefix: string, existingIds: string[]): string {
  const existing = new Set(existingIds);
  let index = 1;

  while (existing.has(`${prefix}-${index}`)) {
    index += 1;
  }

  return `${prefix}-${index}`;
}

function touchBoard(board: ArgumentBoard, now: Date): ArgumentBoard {
  return { ...board, updatedAt: now.toISOString() };
}
