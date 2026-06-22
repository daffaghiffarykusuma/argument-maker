import type { IconName } from "./icon-controls";

const actionIds = [
  "copy-outline",
  "download",
  "upload",
  "toggle-preview",
  "undo",
  "redo",
  "clear",
  "add-argument",
  "add-data",
  "move-argument",
  "duplicate-argument",
  "delete-argument",
  "move-data",
  "duplicate-data",
  "delete-data",
  "copy-mermaid",
] as const;

export type CommandDeskActionId = (typeof actionIds)[number];

export type CommandDeskDirection = "up" | "down";

export interface CommandDeskActionControl {
  action: CommandDeskActionId;
  label: string;
  icon: IconName;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export interface DecodedCommandDeskAction {
  action: CommandDeskActionId;
  argumentId?: string;
  dataId?: string;
  direction?: CommandDeskDirection;
}

export const commandDeskActions = {
  copyOutline: { action: "copy-outline", label: "Copy Outline", icon: "copy" },
  download: { action: "download", label: "Download Board", icon: "download" },
  upload: { action: "upload", label: "Upload Board", icon: "upload" },
  undo: { action: "undo", label: "Undo", icon: "undo" },
  redo: { action: "redo", label: "Redo", icon: "redo" },
  clear: { action: "clear", label: "Clear Board", icon: "trash", danger: true },
  moveArgumentUp: { action: "move-argument", label: "Move Supporting Argument Up", icon: "up" },
  moveArgumentDown: { action: "move-argument", label: "Move Supporting Argument Down", icon: "down" },
  duplicateArgument: { action: "duplicate-argument", label: "Duplicate Supporting Argument", icon: "copy" },
  deleteArgument: { action: "delete-argument", label: "Delete Supporting Argument", icon: "trash", danger: true },
  moveDataUp: { action: "move-data", label: "Move Supporting Data or Facts Up", icon: "up" },
  moveDataDown: { action: "move-data", label: "Move Supporting Data or Facts Down", icon: "down" },
  duplicateData: { action: "duplicate-data", label: "Duplicate Supporting Data or Facts", icon: "copy" },
  deleteData: { action: "delete-data", label: "Delete Supporting Data or Facts", icon: "trash", danger: true },
  copyMermaid: { action: "copy-mermaid", label: "Copy Mermaid", icon: "copy" },
} as const satisfies Record<string, CommandDeskActionControl>;

const actionIdSet = new Set<string>(actionIds);

export function togglePreviewAction(isPreviewVisible: boolean): CommandDeskActionControl {
  return {
    action: "toggle-preview",
    label: isPreviewVisible ? "Hide Argument Preview" : "Show Argument Preview",
    icon: isPreviewVisible ? "eyeOff" : "eye",
    active: isPreviewVisible,
  };
}

export function decodeCommandDeskAction(target: HTMLElement): DecodedCommandDeskAction | null {
  const action = target.dataset.action;

  if (!isCommandDeskActionId(action)) {
    return null;
  }

  return {
    action,
    argumentId: target.dataset.argumentId,
    dataId: target.dataset.dataId,
    direction: decodeDirection(target.dataset.direction),
  };
}

function isCommandDeskActionId(value: string | undefined): value is CommandDeskActionId {
  return value !== undefined && actionIdSet.has(value);
}

function decodeDirection(value: string | undefined): CommandDeskDirection | undefined {
  return value === "up" || value === "down" ? value : undefined;
}
