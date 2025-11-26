import { IPlayerAction } from "./action-types";

export interface IPlayer {
    name: string;
    id: string;
    ready: boolean;
    ships: IShip[];
    pendingActions?: IPlayerAction[];
    maxCommandPoints: number;
    commandPoints: number;
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

export interface IHullTemplate {
    templateLocation: ICellLoc;
    maxHealth: number;
    armor: number;
}

export interface IHull extends IHullTemplate {
    id: string;
    shipId: string;
    location?: ICellLoc;
    remainingHealth: number;
    remainingArmor: number;
    destroyed: boolean;
}

export interface IShipTemplate {
    refNo: string;
    name: string;
    dimensions: [number, number];
    deployed: boolean;
    commandPointCost: number;
    movementRange: number;
    movementCommandPointCost: number;
    attackCountMax: number;
    attackCommandPointCost: number;
    attackRange: number;
    attackDamage: number;
    attackMinRange: number;
    hullTemplates: IHullTemplate[];
}

export interface IShip extends IShipTemplate {
    id: string;
    playerId: string;
    destroyed: boolean;
    hullLocations?: IHull[];
    remainingMovement: number;
    remainingAttacks: number;
}

export interface GameState {
    code: string;
    initiative?: string;
    players: IPlayer[];
    board: Board;
}