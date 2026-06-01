import { describe, expect, test } from "bun:test";
import { commandDeskActions, decodeCommandDeskAction, togglePreviewAction } from "./command-desk-actions";

describe("Command Desk actions", () => {
  test("keeps command labels and icons behind one interface", () => {
    expect(commandDeskActions.copyOutline).toMatchObject({
      action: "copy-outline",
      label: "Copy Outline",
      icon: "copy",
    });
    expect(commandDeskActions.deleteData).toMatchObject({
      action: "delete-data",
      label: "Delete Supporting Data or Facts",
      icon: "trash",
      danger: true,
    });
    expect(togglePreviewAction(true)).toMatchObject({
      action: "toggle-preview",
      label: "Hide Argument Preview",
      icon: "eyeOff",
      active: true,
    });
  });

  test("decodes event dataset into a typed Command Desk action", () => {
    const node = {
      dataset: {
        action: "move-data",
        argumentId: "argument-1",
        dataId: "argument-1-data-1",
        direction: "up",
      },
    } as unknown as HTMLElement;

    expect(decodeCommandDeskAction(node)).toEqual({
      action: "move-data",
      argumentId: "argument-1",
      dataId: "argument-1-data-1",
      direction: "up",
    });

    expect(decodeCommandDeskAction({ dataset: { action: "unknown" } } as unknown as HTMLElement)).toBeNull();
  });
});
