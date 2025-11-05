export interface Player {
    name: string;
    id: string;
    ready: boolean;
    board: Board;
}

export interface Board {
    playerId: string;
    grid: Grid;
}

export type Grid = Array<Hull[]>; // grid[x][y]

export type Cell = [number, number];

export interface Hull {
    shipId: number;
    location: Cell;
    hits: number;
}

export interface Ship {
    hullLocations: Hull[];
}

export interface GameState {
    code: string;
    players: Player[];
}

export interface GetGameRequest {
    gameCode: string;
    gameState?: GameState;
}

export interface JoinGameRequest {
    gameCode: string;
    gameState?: GameState;
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

export const AppStatus = {
    Initialising: "Initialising",
    WaitingForPlayers: "WaitingForPlayers",
} as const;

type TAppStatus = (typeof AppStatus)[keyof typeof AppStatus];

export interface IAppState {
    status: TAppStatus;
    loading: boolean;
    gameState: Partial<GameState>;
}
