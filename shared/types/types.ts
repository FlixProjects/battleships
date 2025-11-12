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

export type Grid = Array<IHull[]>; // grid[x][y]

export type ICell = [number, number];

export interface IHull {
    shipId: number;
    location: ICell;
    hits: number;
}

export interface IShip {
    id: string;
    refNo: string;
    name: string;
    hullLocations?: IHull[];
    dimensions: [number, number];
    deployed: boolean;
}

export interface GameState {
    code: string;
    players: Player[];
}

export const ActionTypes = {
    DEPLOY: "deploy",
    ATTACK: "attack",
    SELECT_FLEET: "select_fleet",
    MOVE: "move",
} as const;

export type TActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];
