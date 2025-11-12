import { App } from "./models/App";
import { GameEngine } from "./models/GameEngine";
import { GameManager } from "./models/GameManager";

export const gameManager = new GameManager();
export const gameEngine = new GameEngine();
export const app = new App();

app.start()