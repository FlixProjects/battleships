import { gameManager } from "..";
import { FP_CURRENT_PLAYER, FP_GAME_CODE, GameState } from "../../shared";
import { getGame } from "../apis/get-game";
import { getComponents, updateComponents } from "../components/component-helper";
import { AppStatus } from "../types";

// client functions

export const getGameCode = () => {
    return sessionStorage.getItem(FP_GAME_CODE);
};

export const setGameCode = (gameCode: string) => {
    return sessionStorage.setItem(FP_GAME_CODE, gameCode);
};

export const removeGameCode = () => {
    return sessionStorage.removeItem(FP_GAME_CODE);
};

export const setCurrentPlayer = (playerId: string) => {
    return sessionStorage.setItem(FP_CURRENT_PLAYER, playerId);
};

export const checkIfNameIsFilled = () => {
    const playerNameInput = getComponents().input.playerName;
    return !!playerNameInput.value;
};

export const refresh = async () => {
    try {
        const response = await getGame(getGameCode());
        gameManager.saveCurrentPlayerState({
            loading: false,
            gameState: response?.gameState,
        });
        updateComponents();
    } catch (error) {
        updateComponents({ status: AppStatus.Error });
    }
};
