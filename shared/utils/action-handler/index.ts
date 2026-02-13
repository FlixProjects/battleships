import { IGameState, IPlayerAction, IResult } from "../..";
import { ActionResolver } from "./ActionResolver";

interface ActionHandlerResult {
    results: IResult[];
    newGameState: IGameState;
    obscuredGameState?: IGameState;
}

export const handleActions = (
    playerId: string,
    gameState: IGameState,
    actions: IPlayerAction[],
): ActionHandlerResult => {
    const { newGameState } = saveActions(playerId, gameState, actions);

    if (isOtherPlayerReady(playerId, gameState)) {
        return resolveActions(playerId, newGameState);
    }

    const { obscuredGameState } = new ActionResolver(playerId, newGameState).resolveVisibility();

    return { results: [], newGameState, obscuredGameState };
};

const resolveActions = (thisPlayer: string, gameState: IGameState): ActionHandlerResult => {
    const newState = { ...gameState };
    // TODO: validate command points

    const { results, gameState: newGameState, obscuredGameState } = new ActionResolver(thisPlayer, newState).resolve();

    return {
        results,
        newGameState: refreshPlayers(newGameState),
        obscuredGameState: refreshPlayers(obscuredGameState),
    };
};

const saveActions = (thisPlayer: string, gameState: IGameState, actions: IPlayerAction[]): ActionHandlerResult => {
    const newState = { ...gameState };
    const player = newState.players.find((p) => p.id === thisPlayer);
    // TODO: validate command points
    // TODO: use GSM instead of mutating the object
    if (!player) {
        return { results: [], newGameState: newState };
    }

    if (player && !player.pendingActions) {
        player.pendingActions = [];
    }

    newState.actions.push(...actions);
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

    newState.currentRound++;

    return newState;
};

const isOtherPlayerReady = (thisPlayer: string, gameState: IGameState) => {
    const otherPlayer = gameState.players.find((p) => p.id !== thisPlayer);

    return !!otherPlayer?.ready;
};

export const removeActions = (gameState: IGameState) => {
    const newState = { ...gameState };
    newState.players.forEach((p) => {
        p.pendingActions = [];
    });
    return newState;
};
