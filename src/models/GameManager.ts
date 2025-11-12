import { FP_AUTH_TOKEN, FP_CURRENT_PLAYER, FP_PLAYER_STATES, Player } from "../../shared";
import { IAppState } from "../types";

interface PlayerGameStates {
    [playerId: string]: IAppState;
}

export class GameManager {
    private playerGameStates: PlayerGameStates;

    constructor() {
        this.playerGameStates = this.loadAllPlayerStates();
    }

    savePlayerState(playerId: string, state: IAppState) {
        this.playerGameStates[playerId] = state;
        this.saveAllPlayerStates();
    }

    saveAndGetCurrentPlayerState(state: Partial<IAppState>) {
        const playerId = this.getCurrentPlayerId();
        this.playerGameStates[playerId] = { ...this.playerGameStates[playerId], ...state };
        return this.loadPlayerState(playerId);
    }

    getCurrentPlayerState() {
        return this.loadPlayerState(this.getCurrentPlayerId() || "");
    }

    switchLocalPlayerAuthToken(playerId: string) {
        document.cookie = `${FP_AUTH_TOKEN}=${playerId}; path=/; SameSite=Lax`;
    }

    setCurrentPlayer(playerId: string) {
        sessionStorage.setItem(FP_CURRENT_PLAYER, playerId);
    }

    getAllPlayerIds(): string[] {
        return Object.keys(this.playerGameStates);
    }

    getPlayer(): Player {
        const appState = this.getCurrentPlayerState();
        return appState?.gameState?.players.find((p) => p.id === this.getCurrentPlayerId());
    }

    isFirstPlayer() {
        return this.getCurrentPlayerState()?.gameState?.players?.[0].id === this.getCurrentPlayerId();
    }

    private loadPlayerState(playerId: string): IAppState | undefined {
        return this.playerGameStates[playerId];
    }

    private loadAllPlayerStates(): PlayerGameStates {
        const stored = sessionStorage.getItem(FP_PLAYER_STATES);
        return stored ? JSON.parse(stored) : {};
    }

    private saveAllPlayerStates() {
        sessionStorage.setItem(FP_PLAYER_STATES, JSON.stringify(this.playerGameStates));
    }
    private getCurrentPlayerId(): string | null {
        return sessionStorage.getItem(FP_CURRENT_PLAYER);
    }
}
