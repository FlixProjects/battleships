import { IAction } from "./action-types";

export interface Player {
    name: string;
    id: string;
    ready: boolean;
    ships: IShip[];
    pendingActions?: IAction[];
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
    id: string;
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
    initiative?: string;
    players: Player[];
    board: Board;
}