import { GameState, IAction, IResult } from "../../../shared";
import { ActionResolver } from "./ActionResolver";

interface ActionHandlerResult {
    results: IResult[];
    newGameState: GameState;
}

export const handleActions = (playerId: string, gameState: GameState, actions: IAction[]): ActionHandlerResult => {
    if (isOtherPlayerReady(playerId, gameState)) {
        return resolveActions(playerId, gameState, actions);
    }

    return saveActions(playerId, gameState, actions);
};

const resolveActions = (thisPlayer: string, gameState: GameState, actions: IAction[]) => {
    const newState = { ...gameState };

    const otherPlayer = newState.players.find((p) => p.id !== thisPlayer);
    const otherPlayerActions = otherPlayer?.pendingActions ?? [];

    const { results, gameState: newGameState } = new ActionResolver(actions, otherPlayerActions, newState).resolve();

    newGameState.players.forEach((p) => {
        p.ready = false;
    });

    return { results, newGameState };
};

const saveActions = (thisPlayer: string, gameState: GameState, actions: IAction[]): ActionHandlerResult => {
    const newState = { ...gameState };
    const player = newState.players.find((p) => p.id === thisPlayer);

    if (!player) {
        return { results: [], newGameState: newState };
    }

    if (player && !player.pendingActions) {
        player.pendingActions = [];
    }

    player.pendingActions = actions;
    player.ready = true;
    
    return { results: [], newGameState: newState };
};

const isOtherPlayerReady = (thisPlayer: string, gameState: GameState) => {
    const otherPlayer = gameState.players.find((p) => p.id !== thisPlayer);

    return !!(otherPlayer?.pendingActions && otherPlayer?.pendingActions.length > 0);
};

export const removeActions = (gameState: GameState) => {
    const newState = { ...gameState };
    newState.players.forEach((p) => {
        p.pendingActions = [];
    });
    return newState;
};
