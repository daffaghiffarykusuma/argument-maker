import type { ArgumentBoard, DataType, SupportMode } from "./argument-board";

export const exportFileContract = {
  appName: "Argument Maker",
  currentSchemaVersion: 2,
  extension: ".argument.json",
  mimeType: "application/json",
  defaultTitle: "untitled-argument",
} as const;

export interface ExportFile {
  name: string;
  mimeType: typeof exportFileContract.mimeType;
  contents: string;
}

export type ExportFileImportResult =
  | { ok: true; board: ArgumentBoard }
  | { ok: false; message: string };

export function createExportFile(board: ArgumentBoard): ExportFile {
  return {
    name: createExportFileName(board.title),
    mimeType: exportFileContract.mimeType,
    contents: `${JSON.stringify(board, null, 2)}\n`,
  };
}

export function parseExportFile(contents: string): ExportFileImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    return reject("This is not a readable Argument Board file.");
  }

  if (!isRecord(parsed)) {
    return reject("This Argument Board file is missing required data.");
  }

  if (parsed["schemaVersion"] !== exportFileContract.currentSchemaVersion || parsed["appName"] !== exportFileContract.appName) {
    return reject("Unsupported Argument Board file version.");
  }

  return hasBoardShape(parsed)
    ? { ok: true, board: parsed }
    : reject("This Argument Board file is missing required data.");
}

export function createExportFileName(title: string): string {
  return `${slugify(title || exportFileContract.defaultTitle)}${exportFileContract.extension}`;
}

function hasBoardShape(value: Record<string, unknown>): value is Record<string, unknown> & ArgumentBoard {
  if (
    typeof value["title"] !== "string" ||
    typeof value["createdAt"] !== "string" ||
    typeof value["updatedAt"] !== "string" ||
    !Array.isArray(value["gatheredFacts"]) ||
    !value["gatheredFacts"].every(hasGatheredFactShape) ||
    !hasScqaShape(value["scqa"]) ||
    !Array.isArray(value["supportingArguments"]) ||
    !value["supportingArguments"].every(hasSupportingArgumentShape)
  ) {
    return false;
  }

  const factIds = value["gatheredFacts"].map((fact) => fact.id);
  const argumentIds = value["supportingArguments"].map((argument) => argument.id);
  const allIds = [
    value["scqa"].situation.id,
    value["scqa"].complication.id,
    value["scqa"].question.id,
    value["scqa"].answer.id,
    ...factIds,
    ...argumentIds,
  ];

  if (new Set(allIds).size !== allIds.length) {
    return false;
  }

  const knownFactIds = new Set(factIds);
  const destinations = [
    value["scqa"].situation.factIds,
    value["scqa"].complication.factIds,
    ...value["supportingArguments"].map((argument) => argument.factIds),
  ];

  return destinations.every(
    (ids) => new Set(ids).size === ids.length && ids.every((id) => knownFactIds.has(id)),
  );
}

function hasScqaShape(value: unknown): value is ArgumentBoard["scqa"] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasFactTextSlotShape(value["situation"]) &&
    value["situation"].id === "situation" &&
    hasFactTextSlotShape(value["complication"]) &&
    value["complication"].id === "complication" &&
    hasTextSlotShape(value["question"]) &&
    value["question"].id === "question" &&
    hasTextSlotShape(value["answer"]) &&
    value["answer"].id === "answer"
  );
}

function hasGatheredFactShape(value: unknown): value is ArgumentBoard["gatheredFacts"][number] {
  return (
    hasTextSlotShape(value) &&
    typeof value["evidenceLink"] === "string" &&
    isDataType(value["dataType"])
  );
}

function hasSupportingArgumentShape(value: unknown): value is ArgumentBoard["supportingArguments"][number] {
  if (!hasFactTextSlotShape(value)) {
    return false;
  }

  return isSupportMode((value as unknown as Record<string, unknown>)["mode"]);
}

function hasFactTextSlotShape(value: unknown): value is { id: string; text: string; touched: boolean; factIds: string[] } {
  return hasTextSlotShape(value) && Array.isArray(value["factIds"]) && value["factIds"].every((id) => typeof id === "string");
}

function hasTextSlotShape(value: unknown): value is Record<string, unknown> & { id: string; text: string; touched: boolean } {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    value["id"].trim().length > 0 &&
    typeof value["text"] === "string" &&
    typeof value["touched"] === "boolean"
  );
}

function isSupportMode(value: unknown): value is SupportMode {
  return value === "reasoning" || value === "evidence-backed";
}

function isDataType(value: unknown): value is DataType {
  return value === "" || value === "fact" || value === "observation" || value === "example" || value === "estimate";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || exportFileContract.defaultTitle;
}

function reject(message: string): ExportFileImportResult {
  return { ok: false, message };
}
