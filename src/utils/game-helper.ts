import { gameManager } from "..";
import { FP_CURRENT_PLAYER, FP_GAME_CODE, ICellLoc } from "../../shared";
import { getGame } from "../apis/get-game";
import { BaseComponent } from "../components/BaseComponent";
import { getComponents, updateComponents } from "../components/component-helper";
import { ShipIcon } from "../components/ships/ShipIcon";
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

export const locationToKey = (location: ICellLoc) => {
    return `${location[0]},${location[1]}`;
};

export const keyToLocation = (key: string): ICellLoc => {
    return key.split(",").map((x) => parseInt(x)) as ICellLoc;
};

export const renderShipIcon = (parentComponent: BaseComponent, shipId: string) => {
    const shipIcon = new ShipIcon({ shipId });
    parentComponent.addChild(shipIcon);
    parentComponent.ref.appendChild(shipIcon.build());
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
