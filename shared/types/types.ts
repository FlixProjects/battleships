import type { GameState } from "../models";
import { IPlayerAction } from "./action-types";

export interface IGameStateManager {
    get gameState(): GameState;
    setGameState(_gameState: IGameState): void;
    getCurrentRound(): number;
    getPlayer(playerId: string): IPlayer | undefined;
    getPlayers(): IPlayer[];
    getPlayerShips(playerId: string): IShip[];
    getShip(shipId: string): IShip | undefined;
    updatePlayer(player: Partial<IPlayer>): this;
    updatePlayers(players: Partial<IPlayer>[]): this;
    updateShip(ship: Partial<IShip>): this;
    updateShips(ships: Partial<IShip>[]): this;
    updateHull(hull: Partial<IHull>): this;
    addHull(hull: IHull): this;
    updateActions(actions: Partial<IPlainAction>[]): this;
    updateAction(action: Partial<IPlainAction>): this;
    addAction(action: IPlainAction): this;
}

export interface IGameState {
    code: string;
    currentRound: number;
    initiative?: string;
    players: IPlayer[];
    ships: IShip[];
    hulls?: IHull[];
    actions?: IPlayerAction[];
    board?: Board;
    winners: string[];
    isOver: boolean;
}

export interface IPlayer {
    name: string;
    id: string;
    order: number;
    ready: boolean;
    ships?: IShip[];
    pendingActions?: IPlayerAction[];
    maxCommandPoints: number;
    commandPoints: number;
}

export interface IShip extends IShipTemplate {
    id: string;
    playerId: string; // FK reference
    destroyed: boolean;
    hulls?: IHull[];
    remainingMovement: number;
    remainingAttacks: number;
}

export interface IHull extends IHullTemplate {
    id: string;
    shipId: string; // FK reference
    location?: ICellLoc;
    remainingHealth: number;
    remainingArmor: number;
    destroyed: boolean;
}

export const AppStatus = {
    NewGame: "NewGame",
    Initialising: "Initialising",
    Initialised: "Initialised",
    Error: "Error",
    WaitingForPlayers: "WaitingForPlayers",
    WaitingForOtherPlayer: "WaitingForOtherPlayer",
    ReadyToSubmit: "ReadyToSubmit",
    GameOver: "GameOver",
} as const;

export type TAppStatus = (typeof AppStatus)[keyof typeof AppStatus];

export interface IAppState {
    status: TAppStatus;
    loading: boolean;
    gameState: IGameState;
    currentPlayer?: string;
}

export interface IPlainAppState {
    status: TAppStatus;
    loading: boolean;
    currentPlayer?: string;
    gameState: IPlainGameState;
}

// ============================================================================
// Plain State - For transfer and storage
// ============================================================================

export interface IPlainGameState {
    code: string;
    currentRound: number;
    initiative?: string;
    players: IPlainPlayer[];
    ships: IPlainShip[];
    hulls?: IHull[];
    actions?: IPlainAction[];
    board?: Board;
    winners: string[];
    isOver: boolean;
}

export type IPlainPlayer = Omit<IPlayer, "ships" | "pendingActions"> & { ships: string[]; pendingActions: string[] };
export type IPlainShip = Omit<IShip, "hulls"> & { hulls: string[] };
export type IPlainAction = IPlayerAction;

// ============================================================================
// HELPER TYPES - For type-safe denormalized views
// ============================================================================

export type IShipWithHulls = IShip & {
    hulls: IHull[];
};

export type IPlayerWithShips = IPlayer & {
    ships: IShipWithHulls[];
};

export type IPlayerShallow = IPlayer & {
    ships: IShip[];
};

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
    isFlagship: boolean;
}

export interface IHullTemplate extends Omit<IGOWithVisibility, "id"> {
    templateLocation: ICellLoc;
    maxHealth: number;
    armor: number;
}

export interface IGameObject {
    id: string;
}

export interface IGOWithVisibility extends IGameObject {
    visionRange: number;
    location?: ICellLoc;
}
