import { DEFAULT_APP_STATE, FP_AUTH_TOKEN, FP_CURRENT_PLAYER, FP_PLAYER_STATES } from "@shared/constants";
import { transformPlainAppStateToDomain } from "@shared/transformers";
import { IAppState, IPlainAppState, IPlayer } from "@shared/types";
import { mergician } from "mergician";

interface PlayerGameStates {
    [playerId: string]: IPlainAppState;
}

/**
 * Pure persistence layer over `sessionStorage`. Two responsibilities only:
 *   1. Read/write the per-player plain app state (`fp-player-states`)
 *   2. Read/write the active player id (`fp-current-player`)
 *
 * No game logic, no domain<->plain translation inside the save path. Callers
 * pass plain (`IPlainAppState`) — if they have a domain `GameState`, they
 * call `gameState.toPlain()` first. The `state` getter rehydrates plain →
 * domain on read so existing consumers see no contract change.
 */
export class GameManager {
    private playerGameStates: PlayerGameStates;

    constructor() {
        this.playerGameStates = this.loadAllPlayerStates();
    }

    get state(): IAppState {
        return this.getCurrentPlayerState();
    }

    public saveAppState(state: Partial<IPlainAppState>, _options: { saveWithMerge?: boolean } = {}) {
        const options = { saveWithMerge: true, ..._options };
        const playerId = this.getCurrentPlayerId();
        const existing = this.playerGameStates[playerId] ?? {};

        const next = options.saveWithMerge
            ? (mergician(existing, state) as IPlainAppState)
            : (state as IPlainAppState);

        this.playerGameStates[playerId] = next;
        this.savePlayerStates();
    }

    public switchLocalPlayerAuthToken(playerId: string) {
        document.cookie = `${FP_AUTH_TOKEN}=${playerId}; path=/; SameSite=Lax`;
    }

    public setCurrentPlayer(playerId: string) {
        sessionStorage.setItem(FP_CURRENT_PLAYER, playerId);
    }

    public getAllPlayerIds(): string[] {
        return Object.keys(this.playerGameStates);
    }

    public getPlayer(): IPlayer {
        return this.state.gameState?.players.find((p) => p.id === this.getCurrentPlayerId());
    }

    public getOtherPlayer(): IPlayer {
        return this.state.gameState?.players.find((p) => p.id !== this.getCurrentPlayerId());
    }

    public getCurrentPlayerId(): string {
        const currentPlayerId = sessionStorage.getItem(FP_CURRENT_PLAYER);
        return currentPlayerId ?? "";
    }

    private getCurrentPlayerState(): IAppState {
        const currentPlayerId = this.getCurrentPlayerId();
        if (!currentPlayerId) {
            return transformPlainAppStateToDomain(DEFAULT_APP_STATE);
        }
        return this.loadPlayerState(currentPlayerId);
    }

    private loadPlayerState(playerId: string): IAppState {
        const rawState = this.playerGameStates[playerId] ?? DEFAULT_APP_STATE;
        return transformPlainAppStateToDomain(rawState);
    }

    private loadAllPlayerStates(): PlayerGameStates {
        const stored = sessionStorage.getItem(FP_PLAYER_STATES);
        return stored ? JSON.parse(stored) : {};
    }

    private savePlayerStates() {
        sessionStorage.setItem(FP_PLAYER_STATES, JSON.stringify(this.playerGameStates));
    }

    // only for local
    public clearPlayerStates() {
        sessionStorage.removeItem(FP_PLAYER_STATES);
        this.playerGameStates = {};
    }
}
