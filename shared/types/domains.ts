import { IAction, IResult, IPlainGameState } from "@shared/types";
import { JWK } from "jose";

export interface GetGameRequest {
    gameCode: string;
    gameState?: IPlainGameState; // for local
}

export interface JoinGameRequest {
    gameCode: string;
    playerName: string;
    gameState?: IPlainGameState; // for local
}

export interface SubmitActionRequest {
    gameCode: string;
    actions: IAction[]; // TODO: replace with IPlayerAction[];
    gameState?: IPlainGameState; // for local
}

export interface CreateGameRequest {
    playerName: string;
}

export interface SignedRequest {
    publicJwk: JWK;
}

export interface AuthRequest extends SignedRequest {
    username: string;
    password: string;
}

export interface SignUpRequest extends AuthRequest {}

export interface SignInRequest extends AuthRequest {}

export interface GenericResponse {
    gameState: IPlainGameState;
    gameStateForLocal?: IPlainGameState;
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
