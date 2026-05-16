import { COLOR, COLOR_FILTER, COMPONENT_ID, FP_CURRENT_PLAYER, FP_GAME_CODE, TColor, TILE_GAP_PX, TILE_SIZE_PX } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { FECommand } from "@shared/models/commands/FECommand";
import { ICellLoc } from "@shared/types";
import { game, gameManager } from "..";
import { getGame } from "../apis/get-game";
import { getComponents, updateComponents } from "../components/component-helper";

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

export const getColorFilter = (color: TColor) => {
    switch (color) {
        case COLOR.TEAL:
            return COLOR_FILTER[COLOR.TEAL];
        case COLOR.ORANGE:
            return COLOR_FILTER[COLOR.ORANGE];
        case COLOR.PINK:
            return COLOR_FILTER[COLOR.PINK];
        default:
            return "";
    }
};

export const refresh = async () => {
    try {
        const response = await getGame(getGameCode());

        const { status, currentPlayer } = gameManager.state;

        const newState = {
            loading: false,
            gameState: response?.gameState,
            status,
            currentPlayer,
        };

        gameManager.saveAppState(newState);
        updateComponents();
    } catch (error) {
        updateComponents({ status: GameConfig.AppStatus.Error });
    }
};

export const toDegrees = (radians: number) => {
    return radians * (180 / Math.PI);
};

// returns the middle top-left px of the cell
export const getPxFromCellLocation = (cell: ICellLoc): { top: number; left: number } => {
    const [startX, startY] = cell;
    const startXInPx = startX * (TILE_SIZE_PX + TILE_GAP_PX) + TILE_SIZE_PX / 2;
    const startYInPx = startY * (TILE_SIZE_PX + TILE_GAP_PX) + TILE_SIZE_PX / 2;
    return {
        top: startYInPx,
        left: startXInPx,
    };
};

export const getElementsFromIds = (ids: string[]) => {
    const gameBoardContainer = document.getElementById(COMPONENT_ID.GAME_BOARD_CONTAINER)
    const elements = ids
        .map((id) => {
            return gameBoardContainer.querySelector(`[id="${id}"]`);
        })
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => ({ el, rect: el.getBoundingClientRect() }));

    return elements;
};

export const isWaitingForOtherPlayer = (gameState: { players: { id: string; ready: boolean }[] }) => {
    const playerId = gameManager.getCurrentPlayerId();
    const isWaitingForOtherPlayer = gameState.players.find((p) => p.id === playerId).ready;
    return isWaitingForOtherPlayer;
};

export const queueCommand = async (command: FECommand) => {
    await game.queueCommand(command);
};
