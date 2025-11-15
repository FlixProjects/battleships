export interface Player {
    name: string;
    id: string;
    ready: boolean;
    ships: IShip[];
}

export interface Board {
    grid: Grid;
}

export type Grid = Array<ICell>;

export interface ICell {
    loc: ICellLoc;
    selectable: boolean;
    items?: any[];
    hidden: boolean;
    visibleTo?: string[];
}
export type ICellLoc = [number, number];

export interface IHull {
    shipId: string;
    location: ICellLoc;
    hits: number;
}

export interface IShip {
    id?: string;
    refNo: string;
    name: string;
    hullLocations?: IHull[];
    dimensions: [number, number];
    deployed: boolean;
}

export interface GameState {
    code: string;
    players: Player[];
    board: Board;
}

export const ActionTypes = {
    DEPLOY: "deploy",
    ATTACK: "attack",
    SELECT_FLEET: "select_fleet",
    MOVE: "move",
} as const;

export type TActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];
