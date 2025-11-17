import { Board, DEFAULT_APP_STATE, FP_AUTH_TOKEN, FP_CURRENT_PLAYER, FP_PLAYER_STATES, Player } from "../../shared";
import { IAppState } from "../types";

interface PlayerGameStates {
    [playerId: string]: IAppState;
}

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

    public switchLocalPlayerAuthToken(playerId: string) {
        document.cookie = `${FP_AUTH_TOKEN}=${playerId}; path=/; SameSite=Lax`;
    }

    public setCurrentPlayer(playerId: string) {
        sessionStorage.setItem(FP_CURRENT_PLAYER, playerId);
    }

    public getAllPlayerIds(): string[] {
        return Object.keys(this.playerGameStates);
    }

    public getPlayer(): Player {
        return this.state.gameState?.players.find((p) => p.id === this.getCurrentPlayerId());
    }

    public updatePlayer(playerState: Partial<Player>) {
        const player = this.getPlayer();
        const newPlayerState = { ...player, ...playerState };
        const playerAppState = this.getCurrentPlayerState();

        playerAppState.gameState.players = playerAppState.gameState.players.map((p) => {
            if (p.id === player.id) {
                return newPlayerState;
            }
            return p;
        });

        this.saveCurrentPlayerState(playerAppState);
    }

    public updateBoard(boardState: Partial<Board>) {
        const playerAppState = this.getCurrentPlayerState();
        const board = playerAppState.gameState.board;
        const newBoardState = { ...board, ...boardState };

        playerAppState.gameState.board = newBoardState;

        this.saveCurrentPlayerState(playerAppState);
    }

    private getCurrentPlayerId(): string | null {
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
