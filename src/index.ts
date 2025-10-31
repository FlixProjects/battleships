import { createGame } from "./apis/create-game";
import { joinGame } from "./apis/join-game";
import { addPlayer } from "./components/add-player";
import { enableGameCodeCopy } from "./components/enable-game-code-copy";
import { appConfig } from "./config/app-config";
import { FP_GAME_CODE, FP_GAME_STATE } from "./constants";
import { checkIfAlreadyInGame } from "./utils/game-helper";

const token = ""; // FIXME: get from cookies
const isLocal = appConfig.deployEnv === "local";

const statusEl = document.getElementById("status") as HTMLDivElement;
const gameAreaEl = document.getElementById("gameArea") as HTMLDivElement;
const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
const gameCodeEl = document.getElementById("gameCode") as HTMLSpanElement;
const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;

createGameBtn.disabled = true;
joinGameBtn.disabled = true;

let playerId: string | null = null;

checkIfAlreadyInGame().then((res) => {
    const { gameState } = res;
    if (gameState) {
        gameCodeEl.innerText = gameState.code;
        createGameBtn.disabled = true;
        joinGameBtn.disabled = true;

        // TODO: create helper to render game state
        addPlayer(gameState.players[0]?.id);
        addPlayer(gameState.players[1]?.id);
    } else {
        createGameBtn.disabled = false;
        joinGameBtn.disabled = false;
    }
});

createGameBtn.addEventListener("click", async () => {
    const response = await createGame(token);
    const gameCode = response?.gameCode;
    if (isLocal) {
        sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(response.gameState));
    }
    sessionStorage.setItem(FP_GAME_CODE, gameCode);

    gameCodeEl.innerText = gameCode || "error";

    if (gameCode) {
        addPlayer(response?.playerId);
        enableGameCodeCopy();
    }
});

joinGameBtn.addEventListener("click", async () => {
    const response = await joinGame(joinCodeInput.value);
    if (isLocal) {
        sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(response.gameState));
    }
    addPlayer(response?.playerId);
});

if (isLocal) {
    const switchPlayerButtonContainer = document.createElement("div");

    const switchPlayerButton = document.createElement("button");

    switchPlayerButton.id = "switchPlayerBtn";
    switchPlayerButton.innerText = "Switch Player";
    switchPlayerButton.className = "btn secondary";

    switchPlayerButtonContainer.appendChild(switchPlayerButton);

    document.getElementById("controls").appendChild(switchPlayerButtonContainer);
}
