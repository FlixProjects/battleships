import { IHull } from "./types";

export const ActionTypes = {
    // player actions
    DEPLOY: "deploy",
    ATTACK: "attack",
    SELECT_FLEET: "select_fleet",
    MOVE: "move",

    // server actions
    GET_VALID_DEPLOY_CELLS: "get_valid_deploy_cells",
} as const;

export type TActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];

export interface IAction {
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

// ================= Server Actions =================

export interface IGetValidDeployCellsAction extends IAction {
    type?: typeof ActionTypes.GET_VALID_DEPLOY_CELLS;
    playerId: string;
    shipId: string;
}
