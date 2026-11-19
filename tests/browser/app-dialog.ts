import type { Page } from "playwright";

/** Answer the app's in-page confirmation dialog, which replaced window.confirm. */
export async function answerAppDialog(page: Page, choice: "confirm" | "cancel") {
  const dialog = page.locator("dialog.app-dialog[open]");
  await dialog.waitFor();
  await dialog.locator(`button[value="${choice}"]`).click();
  await dialog.waitFor({ state: "detached" });
}

export function notice(page: Page) {
  return page.getByRole("status", { name: "Notifications", exact: true });
}
