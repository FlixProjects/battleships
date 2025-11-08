export interface Player {
    name: string;
    id: string;
    ready: boolean;
    board: Board;
}

export interface Board {
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
