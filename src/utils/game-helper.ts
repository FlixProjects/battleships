import { gameManager } from "..";
import {
    COLOR,
    COLOR_FILTER,
    FP_CURRENT_PLAYER,
    FP_GAME_CODE,
    ICellLoc,
    TColor,
    TILE_GAP_PX,
    TILE_SIZE_PX
} from "../../shared";
import { getGame } from "../apis/get-game";
import { BaseComponent } from "../components/BaseComponent";
import { getComponents, updateComponents } from "../components/component-helper";
import { ShipIcon } from "../components/ships/ShipIcon";
import { animationManager } from "../models/AnimationManager";
import { MoveShipAnimation } from "../models/animations";
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

export const renderShipIcon = (parentComponent: BaseComponent, shipId: string, refNo: string, isFirstPlayer = true) => {
    const invert = isFirstPlayer;
    const color = isFirstPlayer ? COLOR.TEAL : COLOR.ORANGE;

    const shipIcon = new ShipIcon({ shipId, invert, color, refNo });
    parentComponent.addChild(shipIcon);
    parentComponent.ref.appendChild(shipIcon.build());
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
        const newState = {
            loading: false,
            gameState: response?.gameState,
        };
        gameManager.saveCurrentPlayerStateV2(newState);
        updateComponents();
    } catch (error) {
        updateComponents({ status: AppStatus.Error });
    }
};

export const queueMoveShipAnimation = (
    shipId: string,
    fromLocation: [number, number],
    toLocation: [number, number],
) => {
    animationManager.enqueue(new MoveShipAnimation({ id: shipId, fromCell: fromLocation, toCell: toLocation }));
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
