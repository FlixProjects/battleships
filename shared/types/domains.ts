import { GameState } from "../../shared";

export interface GetGameRequest {
    gameCode: string;
    gameState?: GameState;
}

export interface JoinGameRequest {
    gameCode: string;
    playerName: string;
    gameState?: GameState;
}

export interface CreateGameRequest {
    playerName: string;
}

export interface GetGameResponse {
    gameState: GameState;
}

export interface CreateGameResponse extends GetGameResponse {
    playerId: string;
    gameCode: string;
}

export interface JoinGameResponse extends GetGameResponse {
    playerId: string;
    gameCode: string;
}
