import { GameManager } from "./models/GameManager";
import { initialiseExistingGame } from "./utils/game-helper";

const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;

createGameBtn.disabled = true;
joinGameBtn.disabled = true;

export const gameManager = new GameManager();

initialiseExistingGame();

