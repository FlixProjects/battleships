import { createGame } from "./apis/create-game";
import { joinGame } from "./apis/join-game";
import { addPlayer } from "./components/add-player";
import { appConfig } from "./config/app-config";
import { FP_GAME_STATE } from "./constants";

const token = ""; // FIXME: get from cookies

const statusEl = document.getElementById("status") as HTMLDivElement;
const gameAreaEl = document.getElementById("gameArea") as HTMLDivElement;

const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;

let playerId: string | null = null;

const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;

createGameBtn.addEventListener("click", async () => {
    const response = await createGame(token);

    if (appConfig.deployEnv === "local") {
        sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(response.gameState));
    }

    gameCode.innerText = response?.code || "error";
    addPlayer(response?.playerId);
});

const joinBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
const gameCode = document.getElementById("gameCode") as HTMLSpanElement;

joinBtn.addEventListener("click", async () => {
    const response = await joinGame(joinCodeInput.value);

    addPlayer(response?.playerId);
});

if (appConfig.deployEnv === "local") {
    const switchPlayerButtonContainer = document.createElement("div");

    const switchPlayerButton = document.createElement("button");

    switchPlayerButton.id = "switchPlayerBtn";
    switchPlayerButton.innerText = "Switch Player";
    switchPlayerButton.className = "btn secondary";

    switchPlayerButtonContainer.appendChild(switchPlayerButton);

    document.getElementById("controls").appendChild(switchPlayerButtonContainer);
}
