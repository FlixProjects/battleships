import { GameState } from "./models/GameState";
import { IAppState, IGameState, IPlainAppState, IPlainGameState } from "./types/types";


export const transformGameStateToPlain = (gameState: IGameState): IPlainGameState => {
    return gameState instanceof GameState ? gameState.toPlain() : new GameState(gameState).toPlain();
};

export const transformPlainGameStateToDomain = (plain: IPlainGameState): IGameState => {
    return GameState.toDomain(plain);
};

export const transformAppStateToPlain = (appState: IAppState): IPlainAppState => {
    return {
        ...appState,
        gameState: transformGameStateToPlain(appState.gameState),
    };
};

export const transformPlainAppStateToDomain = (appState: Partial<IPlainAppState>): IAppState => {
    const { gameState } = appState;
    return {
        status: appState.status,
        loading: appState.loading,
        currentPlayer: appState.currentPlayer,
        ...(gameState ? { gameState: transformPlainGameStateToDomain(gameState) } : {}),
    } as IAppState;
};
