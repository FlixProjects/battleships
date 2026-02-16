import { ICellLoc, IHull } from "./types";

export const ActionTypes = {
    // player actions
    DEPLOY: "deploy",
    ATTACK: "attack",
    SELECT_FLEET: "select_fleet",
    MOVE: "move",

    // server actions
    GET_VALID_DEPLOY_CELLS: "get_valid_deploy_cells",
    GET_VALID_MOVE_CELLS: "get_valid_move_cells",
    GET_VALID_ATTACK_CELLS: "get_valid_attack_cells",
} as const;

export type TActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];

export interface IAction {
    id: string;
    order: number; // position in pendingActions
    round: number;
    type?: TActionTypes; // TODO: Not sure if I really need the type
}

// ================= Player Actions =================

export interface IPlayerAction extends IAction {
    playerId: string;
    commandPointCost: number;
}

export interface IDeployAction extends IPlayerAction {
    type?: typeof ActionTypes.DEPLOY;
    shipId: string;
    hullLocations: IHull[]; // locations where the ship's hull will be deployed
}

export interface IMoveAction extends IPlayerAction {
    type?: typeof ActionTypes.MOVE;
    shipId: string;
    hullLocations: IHull[];
}

export interface IShipAttackAction extends IPlayerAction {
    type?: typeof ActionTypes.ATTACK;
    shipId: string;
    attackLocations: ICellLoc[];
}

// ================= Server Actions =================

export interface IGetValidDeployCellsAction {
    type?: typeof ActionTypes.GET_VALID_DEPLOY_CELLS;
    playerId: string;
    shipId: string;
}

export interface IGetValidMoveCellsAction {
    type?: typeof ActionTypes.GET_VALID_MOVE_CELLS;
    playerId: string;
    shipId: string;
}

export interface IGetValidAttackCellsAction {
    type?: typeof ActionTypes.GET_VALID_ATTACK_CELLS;
    playerId: string;
    shipId: string;
}

export type TCommitDeployShipParams = Pick<IDeployAction, "shipId" | "hullLocations" | "commandPointCost">;
export type TCommitMoveShipParams = Pick<IMoveAction, "shipId" | "hullLocations" | "commandPointCost">;
export type TCommitAttackShipParams = Pick<IShipAttackAction, "shipId" | "commandPointCost" | "attackLocations">;
