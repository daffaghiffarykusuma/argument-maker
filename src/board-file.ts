import type { ArgumentBoard } from "./argument-board";
import { createExportFile, parseExportFile, type ExportFile, type ExportFileImportResult } from "./export-file-contract";

export type ExportedBoardFile = ExportFile;
export type ImportBoardFileResult = ExportFileImportResult;

export function exportBoardFile(board: ArgumentBoard): ExportedBoardFile {
  return createExportFile(board);
}

export function importBoardFile(contents: string): ImportBoardFileResult {
  return parseExportFile(contents);
}
