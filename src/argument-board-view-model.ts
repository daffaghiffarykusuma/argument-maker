import type { ArgumentBoard, DataType, SupportMode } from "./argument-board";
import type { ViewMode } from "./argument-board-session";
import { previewSupportingDataFactLabel, projectArgumentPreview } from "./argument-preview-projection";
import type { ReviewIssue } from "./review";

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
  status: {
    argumentCount: number;
    dataFactCount: number;
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
  const preview = projectArgumentPreview(input.board);

  return {
    board: input.board,
    mode: input.mode,
    toolbar: {
      title: input.board.title,
      canUndo: input.canUndo,
      canRedo: input.canRedo,
    },
    status: {
      argumentCount: input.board.supportingArguments.length,
      dataFactCount: input.board.supportingArguments.reduce((count, argument) => count + argument.data.length, 0),
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
        previewLabel: previewSupportingDataFactLabel(item),
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
      mermaid: preview.mermaid,
      chain: preview.chain,
      arguments: preview.arguments.map((argument) => ({
        label: argument.label,
        text: argument.text,
        data: argument.data.map((item) => ({ label: "Supporting Data or Facts", text: item.label })),
      })),
    },
  };
}
