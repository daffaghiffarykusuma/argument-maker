import { mountArgumentBoardApp } from "./argument-board-browser";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

mountArgumentBoardApp(app);
