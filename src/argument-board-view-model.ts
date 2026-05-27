import type { ArgumentBoard, DataType, SupportMode, SupportingArgument, SupportingDataFact } from "./argument-board";
import type { ViewMode } from "./argument-board-session";
import { generateMermaidPreview } from "./output";
import { isValidEvidenceLink, type ReviewIssue } from "./review";

export interface ArgumentBoardViewModelInput {
  board: ArgumentBoard;
  mode: ViewMode;
  canUndo: boolean;
  canRedo: boolean;
  issues: ReviewIssue[];
}

export interface ArgumentBoardViewModel {
  board: ArgumentBoard;
  mode: ViewMode;
  toolbar: {
    title: string;
    canUndo: boolean;
    canRedo: boolean;
  };
  scqa: Array<{
    field: keyof ArgumentBoard["scqa"];
    label: string;
    term: string;
    value: string;
  }>;
  supportingArguments: SupportingArgumentView[];
  checklist: {
    count: number;
    messages: string[];
    summary: string;
  };
  preview: {
    mermaid: string;
    chain: Array<{ label: string; text: string }>;
    arguments: Array<{
      label: string;
      text: string;
      data: Array<{ label: string; text: string }>;
    }>;
  };
}

export interface SupportingArgumentView {
  id: string;
  label: string;
  term: string;
  text: string;
  mode: SupportMode;
  data: SupportingDataFactView[];
}

export interface SupportingDataFactView {
  id: string;
  text: string;
  evidenceLink: string;
  dataType: DataType;
  previewLabel: string;
}

export function createArgumentBoardViewModel(input: ArgumentBoardViewModelInput): ArgumentBoardViewModel {
  const activeArguments = input.board.supportingArguments.filter((argument) => hasText(argument.text) || argument.touched);

  return {
    board: input.board,
    mode: input.mode,
    toolbar: {
      title: input.board.title,
      canUndo: input.canUndo,
      canRedo: input.canRedo,
    },
    scqa: [
      { field: "situation", label: "What is happening?", term: "Situation", value: input.board.scqa.situation.text },
      {
        field: "complication",
        label: "What changed or makes this matter?",
        term: "Complication",
        value: input.board.scqa.complication.text,
      },
      {
        field: "question",
        label: "What question must this answer?",
        term: "Question",
        value: input.board.scqa.question.text,
      },
      { field: "answer", label: "What is your main answer?", term: "Answer", value: input.board.scqa.answer.text },
    ],
    supportingArguments: input.board.supportingArguments.map((argument, index) => ({
      id: argument.id,
      label: "Why should someone believe this?",
      term: `Supporting Argument ${index + 1}`,
      text: argument.text,
      mode: argument.mode,
      data: argument.data.map((item) => ({
        id: item.id,
        text: item.text,
        evidenceLink: item.evidenceLink,
        dataType: item.dataType,
        previewLabel: previewDataLabel(item.text, item.evidenceLink),
      })),
    })),
    checklist: {
      count: input.issues.length,
      messages: input.issues.map((issue) => issue.message),
      summary:
        input.issues.length === 0
          ? "Ready to preview, copy, or download."
          : `${input.issues.length} item${input.issues.length === 1 ? "" : "s"} need attention.`,
    },
    preview: {
      mermaid: generateMermaidPreview(input.board),
      chain: [
        { label: "Situation", text: input.board.scqa.situation.text },
        { label: "Complication", text: input.board.scqa.complication.text },
        { label: "Question", text: input.board.scqa.question.text },
        { label: "Answer", text: input.board.scqa.answer.text },
      ],
      arguments: activeArguments.map((argument, index) => ({
        label: `Supporting Argument ${index + 1}`,
        text: previewArgumentLabel(argument),
        data: argument.data
          .filter((item) => hasText(item.text) || item.touched)
          .map((item) => ({ label: "Supporting Data or Facts", text: previewDataLabel(item.text, item.evidenceLink) })),
      })),
    },
  };
}

function previewArgumentLabel(argument: SupportingArgument): string {
  if (argument.mode === "evidence-backed" && hasText(argument.text) && !argument.data.some((item) => hasText(item.text))) {
    return `${argument.text} [needs data]`;
  }

  return argument.text;
}

function previewDataLabel(text: string, evidenceLink: string): string {
  if (!hasText(text)) {
    return "[empty]";
  }

  if (!hasText(evidenceLink)) {
    return `${text} [needs evidence link]`;
  }

  if (!isValidEvidenceLink(evidenceLink)) {
    return `${text} [invalid evidence link]`;
  }

  return text;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}
