export type IconName = "copy" | "download" | "upload" | "undo" | "redo" | "trash" | "up" | "down" | "eye" | "eyeOff";

export interface IconButtonOptions {
  action: string;
  label: string;
  icon: IconName;
  attrs?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export function renderIconButton(options: IconButtonOptions): string {
  const classes = ["icon-button", options.active ? "active" : "", options.danger ? "danger" : ""].filter(Boolean).join(" ");
  return `
    <button
      type="button"
      class="${classes}"
      data-action="${options.action}"
      aria-label="${escapeAttr(options.label)}"
      title="${escapeAttr(options.label)}"
      data-tooltip="${escapeAttr(options.label)}"
      ${options.attrs ?? ""}
      ${options.disabled ? "disabled" : ""}
    >
      ${renderIcon(options.icon)}
    </button>
  `;
}

export function renderIcon(icon: IconName): string {
  const paths: Record<IconName, string> = {
    copy: '<rect x="8" y="8" width="10" height="10" rx="1.5"></rect><path d="M6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>',
    download: '<path d="M12 3v10"></path><path d="m8 9 4 4 4-4"></path><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path>',
    upload: '<path d="M12 21V11"></path><path d="m8 15 4-4 4 4"></path><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"></path>',
    undo: '<path d="M9 14 4 9l5-5"></path><path d="M4 9h10a6 6 0 0 1 0 12h-2"></path>',
    redo: '<path d="m15 14 5-5-5-5"></path><path d="M20 9H10a6 6 0 0 0 0 12h2"></path>',
    trash: '<path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v5"></path><path d="M14 11v5"></path>',
    up: '<path d="m6 15 6-6 6 6"></path>',
    down: '<path d="m6 9 6 6 6-6"></path>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>',
    eyeOff: '<path d="m3 3 18 18"></path><path d="M10.6 10.6A3 3 0 0 0 13.4 13.4"></path><path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.9 17.9 0 0 1-3.1 4.1"></path><path d="M6.6 6.6C3.7 8.3 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4.1-.8"></path>',
  };

  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[icon]}</svg>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
