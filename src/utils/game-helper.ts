import { gameManager } from "..";
import { FP_AUTH_TOKEN, FP_GAME_CODE, GameState } from "../../shared";
import { getGame } from "../apis/get-game";
import { getComponents, updateComponents } from "../components/component-helper";
import { AppStatus } from "../types";
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
        // FIXME: Get Game needs to have playerId, 
        // how would I know which player I am?
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

export const initialiseExistingGame = async () => {
    const res = await checkIfAlreadyInGame();

    const { gameState } = res;

    if (gameState) {
        gameManager.setCurrentPlayer(getCookie(FP_AUTH_TOKEN))
        
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
