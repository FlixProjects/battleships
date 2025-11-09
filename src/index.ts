import { App } from "./models/App";
import { GameManager } from "./models/GameManager";

export const gameManager = new GameManager();
export const app = new App();

app.start()