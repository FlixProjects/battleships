import { createGame } from "./apis/create-game";
import { joinGame } from "./apis/join-game";

const statusEl = document.getElementById("status") as HTMLDivElement;
const gameAreaEl = document.getElementById("gameArea") as HTMLDivElement;

const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;

let playerId: string | null = null;

const createBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
createBtn.addEventListener("click", async () => {
    const response = await createGame();
    gameCode.innerText = response?.code || "error";
});

const joinBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
const gameCode = document.getElementById("gameCode") as HTMLSpanElement;

joinBtn.addEventListener("click", async () => {
    const response = await joinGame(joinCodeInput.value);
});
