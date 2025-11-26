import { IGameState, IAction, IResult } from "../../shared";

export interface GetGameRequest {
    gameCode: string;
    gameState?: IGameState; // for local
}

export interface JoinGameRequest {
    gameCode: string;
    playerName: string;
    gameState?: IGameState; // for local
}

export interface SubmitActionRequest {
    gameCode: string;
    actions: IAction[]; // TODO: replace with IPlayerAction[];
    gameState?: IGameState; // for local
}

export interface CreateGameRequest {
    playerName: string;
}

export interface GenericResponse {
    gameState: IGameState;
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

export interface SubmitActionResponse extends GenericResponse {
    results: IResult[];
}
