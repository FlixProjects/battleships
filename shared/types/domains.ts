import { GameState, IAction, IResult } from "../../shared";

export interface GetGameRequest {
    gameCode: string;
    gameState?: GameState; // for local
}

export interface JoinGameRequest {
    gameCode: string;
    playerName: string;
    gameState?: GameState; // for local
}

export interface SubmitActionRequest {
    gameCode: string;
    actions: IAction[];
    gameState?: GameState; // for local
}

export interface CreateGameRequest {
    playerName: string;
}

export interface GenericResponse {
    gameState: GameState;
}

export interface GetGameResponse extends GenericResponse {}

export interface CreateGameResponse extends GetGameResponse {
    playerId: string;
    gameCode: string;
}

export interface JoinGameResponse extends GetGameResponse {
    playerId: string;
    gameCode: string;
}

export interface SubmitActionResponse extends GenericResponse{
    results: IResult[];
}
