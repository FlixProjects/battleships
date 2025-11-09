import { createGame } from "../apis/create-game";
import { getGame } from "../apis/get-game";
import { joinGame } from "../apis/join-game";
import { getComponents, updateComponents } from "../components/component-helper";
import { PlayerNameInput } from "../components/PlayerNameInput";
import { appConfig } from "../config/app-config";
import { FP_GAME_CODE, FP_GAME_STATE, FP_USER_ID } from "../constants";
import { GameState, Player, FP_AUTH_TOKEN } from "../../shared";
import { getCookie } from "./cookie-helper";
import { AppStatus } from "../types";
import { gameManager } from "..";

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
    const playerNameInput = getComponents().input.playerName;
    return !!playerNameInput.value;
};

export const setCurrentPlayerName = (players: Player[]) => {
    const playerNameInput = getComponents().input.playerName;

    const playerName = players.find((p) => p.id === getCookie(FP_USER_ID))?.name;

    playerNameInput.setValue(playerName ?? "");
};

export const initialiseExistingGame = async () => {
    const res = await checkIfAlreadyInGame();

    const { gameState } = res;

    if (gameState) {
        setCurrentPlayerName(gameState.players);
        const newState = gameManager.saveAndGetCurrentPlayerState({
            status: AppStatus.Initialised,
            loading: false,
            gameState,
        });
        updateComponents(newState);
    } else {
        updateComponents({
            status: AppStatus.NewGame,
            loading: false,
        });
    }
};

export const initialiseCreateGameButton = () => {
    const createGameBtn = getComponents().button.createGame;
    const playerNameInput = new PlayerNameInput();

    createGameBtn.addEventListener("click", async () => {
        if (!checkIfNameIsFilled()) {
            return playerNameInput.shakeForAwhile();
        }

        try {
            const response = await createGame(playerNameInput.value);

            if (!response) {
                return;
            }

            const newState = {
                status: AppStatus.Initialised,
                loading: false,
                gameState: response?.gameState!,
            };

            const playerId = getCookie(FP_AUTH_TOKEN);
            if (playerId) {
                gameManager.savePlayerState(playerId, newState);
            }

            updateComponents(newState);
        } catch (error) {
            updateComponents({ status: AppStatus.Error });
        }
    });
};

export const initialiseJoinGameButton = () => {
    const isLocal = appConfig.deployEnv === "local";

    const joinGameBtn = getComponents().button.joinGame;
    const joinCodeInput = getComponents().input.joinCode;

    const playerNameInput = getComponents().input.playerName;

    joinGameBtn.addEventListener("click", async () => {
        if (!checkIfNameIsFilled()) {
            return playerNameInput.shakeForAwhile();
        }
        try {
            const response = await joinGame(joinCodeInput.value, playerNameInput.value);
            if (isLocal) {
                sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(response?.gameState));
            }

            const newState = { status: AppStatus.Initialised, loading: false, gameState: response?.gameState! };

            const playerId = getCookie(FP_AUTH_TOKEN);
            if (playerId) {
                gameManager.savePlayerState(playerId, newState);
            }

            updateComponents(newState);
        } catch (error) {
            updateComponents({ status: AppStatus.Error });
        }
    });
};

export const refresh = async () => {
    try {
        const gameCode = sessionStorage.getItem(FP_GAME_CODE);
        const response = await getGame(gameCode);
        const newState = gameManager.saveAndGetCurrentPlayerState({
            loading: false,
            gameState: response?.gameState,
        });
        updateComponents(newState);
    } catch (error) {
        updateComponents({ status: AppStatus.Error });
    }
};
