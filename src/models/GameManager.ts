import { FP_AUTH_TOKEN, FP_CURRENT_PLAYER, FP_PLAYER_STATES } from "../../shared";
import { IAppState } from "../types";

interface PlayerGameStates {
    [playerId: string]: IAppState;
}

export class GameManager {
    private playerGameStates: PlayerGameStates;

    constructor() {
        this.playerGameStates = this.loadAllPlayerStates();
    }

    private loadAllPlayerStates(): PlayerGameStates {
        const stored = sessionStorage.getItem(FP_PLAYER_STATES);
        return stored ? JSON.parse(stored) : {};
    }

    private saveAllPlayerStates() {
        sessionStorage.setItem(FP_PLAYER_STATES, JSON.stringify(this.playerGameStates));
    }

    savePlayerState(playerId: string, state: IAppState) {
        this.playerGameStates[playerId] = state;
        this.saveAllPlayerStates();
    }

    loadPlayerState(playerId: string): IAppState | undefined {
        return this.playerGameStates[playerId];
    }

    saveAndGetCurrentPlayerState(state: Partial<IAppState>) {
        const playerId = this.getCurrentPlayerId();
        this.playerGameStates[playerId] = { ...this.playerGameStates[playerId], ...state };
        return this.loadPlayerState(playerId);
    }

    getCurrentPlayerState() {
        return this.loadPlayerState(this.getCurrentPlayerId() || "");
    }

    switchToPlayer(playerId: string) {
        const state = this.loadPlayerState(playerId);
        if (!state) return;

        sessionStorage.setItem(FP_CURRENT_PLAYER, playerId);
        document.cookie = `${FP_AUTH_TOKEN}=${playerId}; path=/; SameSite=Lax`;

        if (state.gameState?.code) {
            sessionStorage.setItem("fp-game-code", state.gameState.code);
        }
    }

    getCurrentPlayerId(): string | null {
        return sessionStorage.getItem(FP_CURRENT_PLAYER);
    }

    getAllPlayerIds(): string[] {
        return Object.keys(this.playerGameStates);
    }
}
