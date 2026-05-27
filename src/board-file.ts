import type { ArgumentBoard } from "./argument-board";

export interface ExportedBoardFile {
  name: string;
  mimeType: "application/json";
  contents: string;
}

export type ImportBoardFileResult =
  | {
      ok: true;
      board: ArgumentBoard;
    }
  | {
      ok: false;
      message: string;
    };

export function exportBoardFile(board: ArgumentBoard): ExportedBoardFile {
  return {
    name: `${slugify(board.title || "untitled-argument")}.argument.json`,
    mimeType: "application/json",
    contents: `${JSON.stringify(board, null, 2)}\n`,
  };
}

export function importBoardFile(contents: string): ImportBoardFileResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    return {
      ok: false,
      message: "This is not a readable Argument Board file.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      message: "This Argument Board file is missing required data.",
    };
  }

  if (parsed["schemaVersion"] !== 1 || parsed["appName"] !== "Argument Maker") {
    return {
      ok: false,
      message: "Unsupported Argument Board file version.",
    };
  }

  if (!hasBoardShape(parsed)) {
    return {
      ok: false,
      message: "This Argument Board file is missing required data.",
    };
  }

  return {
    ok: true,
    board: parsed,
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
    isRecord(value["scqa"]) &&
    Array.isArray(value["supportingArguments"])
  );
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

  return slug || "untitled-argument";
}
