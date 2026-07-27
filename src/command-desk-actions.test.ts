import { describe, expect, test } from "bun:test";
import { commandDeskActions } from "./command-desk-actions";

describe("Command Desk actions", () => {
  test("keeps shared rail and Supporting Argument controls behind one interface", () => {
    expect(commandDeskActions.copyOutline).toMatchObject({
      action: "copy-outline",
      label: "Copy Outline",
      icon: "copy",
    });
    expect(commandDeskActions.deleteArgument).toMatchObject({
      action: "delete-argument",
      label: "Delete Supporting Argument",
      icon: "trash",
      danger: true,
    });
  });
});
