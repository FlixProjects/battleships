import { IPlainGameState, IGameState, IPlainAppState, IAppState } from "@shared/index";
import { FEGameState } from "../models/fe-entities/FEGameState";

export const transformPlainGameStateToDomain = (plain: IPlainGameState): IGameState => {
    return FEGameState.toDomain(plain);
};

export const transformPlainAppStateToFEDomain = (appState: Partial<IPlainAppState>): IAppState => {
    const { gameState } = appState;
    return {
        status: appState.status,
        loading: appState.loading,
        currentPlayer: appState.currentPlayer,
        ...(gameState ? { gameState: transformPlainGameStateToDomain(gameState) } : {}),
    } as IAppState;
};
