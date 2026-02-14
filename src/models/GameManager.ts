import { mergician } from "mergician";
import {
    DEFAULT_APP_STATE,
    FP_AUTH_TOKEN,
    FP_CURRENT_PLAYER,
    FP_PLAYER_STATES,
    GameStateManager,
    IAppState,
    IGameState,
    IPlainAppState,
    IPlayer,
} from "../../shared";
import { transformAppStateToPlain, transformPlainAppStateToDomain } from "../../shared/transformers";
import { ActionResolver } from "../../shared/utils/action-handler/ActionResolver";
interface PlayerGameStates {
    [playerId: string]: IPlainAppState;
}

/**
 * In charge of managing save/load of state to sessionStorage
 * we should always fetch base state from here
 * but use GameStateManager to modify values before saving via GameManager
 */
export class GameManager {
    private playerGameStates: PlayerGameStates;

    constructor() {
        this.playerGameStates = this.loadAllPlayerStates();
    }

    get state(): IAppState {
        return this.getCurrentPlayerState();
    }

    get isFirstPlayer() {
        return this.getCurrentPlayerState()?.gameState?.players?.[0].id === this.getCurrentPlayerId();
    }

    get firstPlayerId() {
        return this.getCurrentPlayerState()?.gameState?.players?.[0].id;
    }

    public savePlainAppState(state: Partial<IPlainAppState>, _options: { saveWithMerge?: boolean } = {}) {
        const DEFAULT_OPTIONS = { saveWithMerge: true };
        const options = { ...DEFAULT_OPTIONS, ..._options };
        const playerId = this.getCurrentPlayerId();
        const currentPlayerAppState = this.playerGameStates[playerId] ?? {};

        const newAppState = options.saveWithMerge
            ? (mergician(currentPlayerAppState, state) as IPlainAppState)
            : (state as IPlainAppState);
        this.playerGameStates[playerId] = newAppState;
        this.savePlayerStates();
    }

    public saveCurrentPlayerStateV2(
        state: Partial<IAppState>,
        _options: { skipResolve?: boolean; saveWithMerge?: boolean } = {},
    ) {
        const DEFAULT_OPTIONS = { skipResolve: false, saveWithMerge: true };
        const options = { ...DEFAULT_OPTIONS, ..._options };

        const playerId = this.getCurrentPlayerId();
        const { gameState } = state;

        if (!this.state.gameState) return;

        const newGameState = options?.skipResolve ? gameState : this.resolveLocalActions(gameState);

        return this.savePlayerState(playerId, { ...state, gameState: newGameState });
    }

    private resolveLocalActions(_gameState: IGameState): IGameState {
        const playerId = this.getCurrentPlayerId();
        const gsm = new GameStateManager(_gameState);
        let thisPlayer = gsm.gameState.getPlayer(playerId);

        if (thisPlayer.ready) {
            // After submitting action first, we resolve the pendingActions locally
            // The gameState in S3 should remain unresolved

            const resolver = new ActionResolver(playerId, gsm.gameState);
            const { gameState: resolvedGameState } = resolver.resolve();
            // FIXME: there should not be game logic in the save state function
            gsm.setGameState(resolvedGameState);
        }
        return gsm.gameState;
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

    public getCurrentPlayerId(): string | null {
        return sessionStorage.getItem(FP_CURRENT_PLAYER);
    }

    private getCurrentPlayerState() {
        const currentPlayerId = this.getCurrentPlayerId();
        if (!currentPlayerId) {
            return DEFAULT_APP_STATE;
        }
        return this.loadPlayerState(currentPlayerId);
    }

    private loadPlayerState(playerId: string): IAppState | undefined {
        const rawState = this.playerGameStates[playerId] ?? transformAppStateToPlain(DEFAULT_APP_STATE);
        const domain = transformPlainAppStateToDomain(rawState);
        return domain;
    }

    private loadAllPlayerStates(): PlayerGameStates {
        const stored = sessionStorage.getItem(FP_PLAYER_STATES);
        return stored ? JSON.parse(stored) : {};
    }

    private savePlayerState(playerId: string, state: Partial<IAppState>, _options: { saveWithMerge?: boolean } = {}) {
        const DEFAULT_OPTIONS = { saveWithMerge: true };
        const options = { ...DEFAULT_OPTIONS, ..._options };

        const linkedAppState = transformPlainAppStateToDomain(this.playerGameStates[playerId]);
        const mergedAppState = options.saveWithMerge
            ? (mergician(linkedAppState, state) as IAppState)
            : (state as IAppState);

        const delinkedAppState = transformAppStateToPlain(mergedAppState);

        this.playerGameStates[playerId] = delinkedAppState;
        this.savePlayerStates();
    }

    private savePlayerStates() {
        sessionStorage.setItem(FP_PLAYER_STATES, JSON.stringify(this.playerGameStates));
    }
}
