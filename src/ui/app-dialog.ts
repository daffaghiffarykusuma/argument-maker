import { escapeHtml } from "./html";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * In-page replacement for `window.confirm`. The dialog lives outside the app root so
 * board re-renders cannot remove it, and focus returns to the opener when it closes.
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = openDialog(
      options.title,
      `<p>${escapeHtml(options.message)}</p>`,
      `<button type="button" value="cancel">${escapeHtml(options.cancelLabel ?? "Cancel")}</button>
       <button type="button" value="confirm" class="${options.danger ? "danger" : "primary"}">${escapeHtml(options.confirmLabel)}</button>`,
      (value) => resolve(value === "confirm"),
    );
    // Destructive choices start on Cancel so a stray Enter keeps the board.
    dialog.querySelector<HTMLButtonElement>(`button[value="${options.danger ? "cancel" : "confirm"}"]`)?.focus();
  });
}

/** `keys` joins keys in one combination with "+" and alternatives with "|", e.g. "Ctrl+Shift+Z|Ctrl+Y". */
export function showShortcuts(shortcuts: Array<[keys: string, description: string]>) {
  const combination = (keys: string) => keys.split("+").map((key) => `<kbd>${escapeHtml(key)}</kbd>`).join("+");
  const rows = shortcuts.map(([keys, description]) => `<dt>${keys.split("|").map(combination).join(" <span>or</span> ")}</dt><dd>${escapeHtml(description)}</dd>`).join("");
  const dialog = openDialog("Keyboard shortcuts", `<dl class="shortcut-list">${rows}</dl>`, `<button type="button" value="close" class="primary">Close</button>`, () => {});
  dialog.querySelector<HTMLButtonElement>('button[value="close"]')?.focus();
}

/** True while any modal dialog is open, including the outline panel; page shortcuts and file drops wait. */
export function isModalOpen(): boolean {
  return document.querySelector("dialog[open]") !== null;
}

function openDialog(title: string, body: string, actions: string, onClose: (value: string) => void): HTMLDialogElement {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  const id = `app-dialog-${Math.random().toString(36).slice(2)}`;
  const dialog = document.createElement("dialog");
  dialog.className = "app-dialog";
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  dialog.innerHTML = `<h2 id="${id}-title">${escapeHtml(title)}</h2>${body}<div class="app-dialog-actions">${actions}</div>`;
  let settled = false;
  // Settle in the same task as the choice, so the outcome is applied before the dialog is seen to close.
  const settle = (result: string) => {
    if (settled) return;
    settled = true;
    if (dialog.open) dialog.close();
    dialog.remove();
    // The opener may have been replaced by a render; callers move focus themselves then.
    if (opener?.isConnected && (!document.activeElement || document.activeElement === document.body)) opener.focus();
    onClose(result);
  };
  dialog.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (button) settle(button.value);
  });
  // Escape and other browser-initiated closes count as Cancel.
  dialog.addEventListener("close", () => settle("cancel"));
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}
