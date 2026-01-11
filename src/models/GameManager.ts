import {
    Board,
    DEFAULT_APP_STATE,
    FP_AUTH_TOKEN,
    FP_CURRENT_PLAYER,
    FP_PLAYER_STATES,
    GameStateManager,
    IGameState,
    IPlayer,
} from "../../shared";
import { ActionResolver } from "../../shared/utils/action-handler/ActionResolver";
import { IAppState } from "../types";

interface PlayerGameStates {
    [playerId: string]: IAppState;
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

    public saveCurrentPlayerState(state: Partial<IAppState>) {
        const playerId = this.getCurrentPlayerId();
        return this.savePlayerState(playerId, state);
    }

    public saveCurrentPlayerStateV2(state: Partial<IAppState>) {
        const playerId = this.getCurrentPlayerId();
        const { gameState } = state;

        if (!this.state.gameState) return;

        const newGameState = this.resolveLocalActions(gameState);

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
            thisPlayer = gsm.getPlayer(playerId);
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

    // TODO: refactor if possible
    public updatePlayers(players: Array<Partial<IPlayer>>) {
        const thisPlayer = this.getPlayer();
        const otherPlayer = this.getOtherPlayer();

        const newThisPlayerIndex = players.findIndex((p) => p.id === thisPlayer.id);
        const newOtherPlayerIndex = players.findIndex((p) => p.id === otherPlayer.id);

        const newThisPlayerState = { ...thisPlayer, ...players[newThisPlayerIndex] };
        const newOtherPlayerState = { ...otherPlayer, ...players[newOtherPlayerIndex] };

        const playerAppState = this.getCurrentPlayerState();

        playerAppState.gameState.players = playerAppState.gameState.players.map((p) => {
            if (p.id === thisPlayer.id) {
                return newThisPlayerState;
            }
            if (p.id === otherPlayer.id) {
                return newOtherPlayerState;
            }
            return p;
        });

        this.saveCurrentPlayerState(playerAppState);
    }

    public getCurrentPlayerId(): string | null {
        return sessionStorage.getItem(FP_CURRENT_PLAYER);
    }

    private savePlayerState(playerId: string, state: Partial<IAppState>) {
        this.playerGameStates[playerId] = { ...this.playerGameStates[playerId], ...state };
        this.savePlayerStates();
        return this.playerGameStates[playerId];
    }

    private getCurrentPlayerState() {
        const currentPlayerId = this.getCurrentPlayerId();
        if (!currentPlayerId) {
            return DEFAULT_APP_STATE;
        }
        return this.loadPlayerState(currentPlayerId);
    }

    private loadPlayerState(playerId: string): IAppState | undefined {
        return this.playerGameStates[playerId] ?? DEFAULT_APP_STATE;
    }

    private loadAllPlayerStates(): PlayerGameStates {
        const stored = sessionStorage.getItem(FP_PLAYER_STATES);
        return stored ? JSON.parse(stored) : {};
    }

    private savePlayerStates() {
        sessionStorage.setItem(FP_PLAYER_STATES, JSON.stringify(this.playerGameStates));
    }
}
