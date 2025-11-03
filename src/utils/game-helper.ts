import { createGame } from "../apis/create-game";
import { getGame } from "../apis/get-game";
import { joinGame } from "../apis/join-game";
import { addPlayer } from "../components/add-player";
import { enableGameCodeCopy } from "../components/enable-game-code-copy";
import { appConfig } from "../config/app-config";
import { FP_GAME_CODE, FP_GAME_STATE, FP_USER_ID } from "../constants";
import { GameState } from "../types";
import { getCookie } from "./cookie-helper";

interface ICheckGameResult {
    gameState?: GameState;
}

// client functions

export const checkIfAlreadyInGame = async (): Promise<ICheckGameResult> => {
    const gameCode = sessionStorage.getItem(FP_GAME_CODE);

    if (!gameCode) {
        return {};
    }

    try {
        const game = await getGame(gameCode);
        console.log("Existing game found:", game);
        return {
            gameState: game?.gameState,
        };
    } catch (error) {
        if (error.code === 404) {
            console.log("Game not found or expired.");
            sessionStorage.removeItem(FP_GAME_CODE);
        }

        if (error.code === 403) {
            console.log("Game is full.");
            sessionStorage.removeItem(FP_GAME_CODE);
        }

        return {};
    }
};

export const checkIfNameIsFilled = () => {
    const playerNameInput = document.getElementById("playerName") as HTMLInputElement;

    return !!playerNameInput.innerText;
};

export const initialiseExistingGame = async () => {
    const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
    const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
    const gameCodeEl = document.getElementById("gameCode") as HTMLSpanElement;

    const playerNameInput = document.getElementById("playerName") as HTMLInputElement;

    const res = await checkIfAlreadyInGame();

    const { gameState } = res;
    
    if (gameState) {
        gameCodeEl.innerText = gameState.code;
        createGameBtn.disabled = true;
        joinGameBtn.disabled = true;

        playerNameInput.innerText = getCookie(FP_USER_ID);
        addPlayer(gameState.players[0]?.id);
        addPlayer(gameState.players[1]?.id);
    } else {
        createGameBtn.disabled = false;
        joinGameBtn.disabled = false;
    }
};

export const initialiseCreateGameButton = () => {
    const isLocal = appConfig.deployEnv === "local";
    const createGameBtn = document.getElementById("createGameBtn") as HTMLButtonElement;
    const gameCodeEl = document.getElementById("gameCode") as HTMLSpanElement;

    createGameBtn.addEventListener("click", async () => {
        const response = await createGame();

        if (!response) {
            return;
        }

        const gameCode = response?.gameCode;
        if (isLocal) {
            sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(response?.gameState));
        }
        sessionStorage.setItem(FP_GAME_CODE, gameCode);

        gameCodeEl.innerText = gameCode || "error";

        if (gameCode) {
            addPlayer(response?.playerId);
            enableGameCodeCopy();
        }
    });
};

export const initialiseJoinGameButton = () => {
    const isLocal = appConfig.deployEnv === "local";

    const joinGameBtn = document.getElementById("joinGameBtn") as HTMLButtonElement;
    const joinCodeInput = document.getElementById("joinCode") as HTMLInputElement;

    joinGameBtn.addEventListener("click", async () => {
        const response = await joinGame(joinCodeInput.value);
        if (isLocal) {
            sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(response?.gameState));
        }
        addPlayer(response?.playerId);
    });
};
