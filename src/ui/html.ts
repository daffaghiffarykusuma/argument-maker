export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

export function safeDomId(value: string): string {
  return Array.from(value, (character) => character.codePointAt(0)!.toString(16)).join("-");
}

/** Whether the author is typing in a text field, when regions above it should hold still. */
export function isTyping(): boolean {
  return document.activeElement?.matches('textarea, input:not([type="checkbox"], [type="radio"], [type="file"])') ?? false;
}
