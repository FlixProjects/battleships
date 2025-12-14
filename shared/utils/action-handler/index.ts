import { IGameState, IPlayerAction, IResult } from "../..";
import { ActionResolver } from "./ActionResolver";

interface ActionHandlerResult {
    results: IResult[];
    newGameState: IGameState;
}

export const handleActions = (
    playerId: string,
    gameState: IGameState,
    actions: IPlayerAction[],
): ActionHandlerResult => {
    if (isOtherPlayerReady(playerId, gameState)) {
        const { newGameState } = saveActions(playerId, gameState, actions);

        return resolveActions(playerId, newGameState);
    }

    return saveActions(playerId, gameState, actions);
};

const resolveActions = (thisPlayer: string, gameState: IGameState) => {
    const newState = { ...gameState };
    // TODO: validate command points

    const { results, gameState: newGameState } = new ActionResolver(thisPlayer, newState).resolve();

    return { results, newGameState: refreshPlayers(newGameState) };
};

const saveActions = (thisPlayer: string, gameState: IGameState, actions: IPlayerAction[]): ActionHandlerResult => {
    const newState = { ...gameState };
    const player = newState.players.find((p) => p.id === thisPlayer);
    // TODO: validate command points
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

const refreshPlayers = (gameState: IGameState) => {
    const newState = { ...gameState };
    newState.players.forEach((p) => {
        p.ready = false;
        p.commandPoints = p.maxCommandPoints;
        p.pendingActions = [];
        p.ships.forEach((s) => {
            s.remainingAttacks = s.attackCountMax;
            s.remainingMovement = s.movementRange;
        });
    });

    return newState;
};

const isOtherPlayerReady = (thisPlayer: string, gameState: IGameState) => {
    const otherPlayer = gameState.players.find((p) => p.id !== thisPlayer);

    return !!(otherPlayer?.pendingActions && otherPlayer?.pendingActions.length > 0);
};

export const removeActions = (gameState: IGameState) => {
    const newState = { ...gameState };
    newState.players.forEach((p) => {
        p.pendingActions = [];
    });
    return newState;
};
