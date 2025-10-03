import { createGame } from "./apis/create-game";
import { joinGame } from "./apis/join-game";

const statusEl = document.getElementById("status") as HTMLDivElement;
const gameAreaEl = document.getElementById("gameArea") as HTMLDivElement;

const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;

let gameCode: string | null = null;
let playerId: string | null = null;

const createBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
createBtn.addEventListener("click", createGame);

const joinBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
joinBtn.addEventListener("click", () => {
  joinGame(joinCodeInput.value);
});
