import {
    Board,
    DEFAULT_APP_STATE,
    FP_AUTH_TOKEN,
    FP_CURRENT_PLAYER,
    FP_PLAYER_STATES,
    GameState,
    Player,
} from "../../shared";
import { ActionResolver } from "../../shared/utils/action-handler/ActionResolver";
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

    public saveCurrentPlayerStateV2(state: Partial<IAppState>) {
        const playerId = this.getCurrentPlayerId();
        let newGameState: GameState;
        const { gameState } = state;

        const playerIndex = gameState.players.findIndex((p) => p.id === playerId);
        const newStatePlayer = gameState.players[playerIndex];

        if (this.state?.gameState && newStatePlayer?.pendingActions.length > 0) {
            // After submitting action first, we resolve the pendingActions locally
            // The gameState in S3 should remain unresolved

            const resolver = new ActionResolver(newStatePlayer.pendingActions, [], gameState);
            const { gameState: tempGameState } = resolver.resolve();
            // FIXME: there should not be game logic in the save state function
            tempGameState.players.forEach((p) => {
                if (p.id === playerId && p.ready) {
                    p.commandPoints = 0;
                }
            });

            newGameState = { ...this.state.gameState, ...tempGameState };
        } else {
            newGameState = gameState;
        }

        return this.savePlayerState(playerId, { ...state, gameState: newGameState });
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

    public getOtherPlayer(): Player {
        return this.state.gameState?.players.find((p) => p.id !== this.getCurrentPlayerId());
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

    // TODO: refactor if possible
    public updatePlayers(players: Array<Partial<Player>>) {
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
