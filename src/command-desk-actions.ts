import type { IconName } from "./icon-controls";

export interface CommandDeskActionControl {
  action: string;
  label: string;
  icon: IconName;
  danger?: boolean;
  disabled?: boolean;
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
  copyMermaid: { action: "copy-mermaid", label: "Copy Mermaid", icon: "copy" },
} as const satisfies Record<string, CommandDeskActionControl>;
