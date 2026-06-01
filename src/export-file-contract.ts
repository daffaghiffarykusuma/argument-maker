import type { ArgumentBoard, DataType, SupportMode } from "./argument-board";

export const exportFileContract = {
  appName: "Argument Maker",
  currentSchemaVersion: 1,
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
  | {
      ok: true;
      board: ArgumentBoard;
    }
  | {
      ok: false;
      message: string;
    };

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

  return normalizeExportFile(parsed);
}

export function createExportFileName(title: string): string {
  return `${slugify(title || exportFileContract.defaultTitle)}${exportFileContract.extension}`;
}

function normalizeExportFile(value: unknown): ExportFileImportResult {
  if (!isRecord(value)) {
    return reject("This Argument Board file is missing required data.");
  }

  const migrated = migrateExportFile(value);

  if (!migrated.ok) {
    return migrated;
  }

  if (!hasBoardShape(migrated.board)) {
    return reject("This Argument Board file is missing required data.");
  }

  return {
    ok: true,
    board: migrated.board,
  };
}

function migrateExportFile(value: Record<string, unknown>): ExportFileImportResult {
  if (value["schemaVersion"] !== exportFileContract.currentSchemaVersion || value["appName"] !== exportFileContract.appName) {
    return reject("Unsupported Argument Board file version.");
  }

  return {
    ok: true,
    board: value as unknown as ArgumentBoard,
  };
}

function hasBoardShape(value: unknown): value is ArgumentBoard {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["title"] === "string" &&
    typeof value["createdAt"] === "string" &&
    typeof value["updatedAt"] === "string" &&
    hasScqaShape(value["scqa"]) &&
    Array.isArray(value["supportingArguments"]) &&
    value["supportingArguments"].every(hasSupportingArgumentShape)
  );
}

function hasScqaShape(value: unknown): value is ArgumentBoard["scqa"] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasTextSlotShape(value["situation"]) &&
    hasTextSlotShape(value["complication"]) &&
    hasTextSlotShape(value["question"]) &&
    hasTextSlotShape(value["answer"])
  );
}

function hasSupportingArgumentShape(value: unknown): value is ArgumentBoard["supportingArguments"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const mode = value["mode"];
  const data = value["data"];

  return hasTextSlotShape(value) && isSupportMode(mode) && Array.isArray(data) && data.every(hasSupportingDataFactShape);
}

function hasSupportingDataFactShape(value: unknown): value is ArgumentBoard["supportingArguments"][number]["data"][number] {
  if (!isRecord(value)) {
    return false;
  }

  const record: Record<string, unknown> = value;

  if (!hasTextSlotShape(record)) {
    return false;
  }

  return typeof value["evidenceLink"] === "string" && isDataType(value["dataType"]);
}

function hasTextSlotShape(value: unknown): value is { id: string; text: string; touched: boolean } {
  return isRecord(value) && typeof value["id"] === "string" && typeof value["text"] === "string" && typeof value["touched"] === "boolean";
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
  return {
    ok: false,
    message,
  };
}
