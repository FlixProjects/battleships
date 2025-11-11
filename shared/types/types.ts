export interface Player {
    name: string;
    id: string;
    ready: boolean;
    board: Board;
    ships: IShip[];
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

export interface IShip {
    id: string;
    name: string;
    hullLocations?: Hull[];
    dimensions: [number, number];
    deployed: boolean;
}

export interface GameState {
    code: string;
    players: Player[];
}
