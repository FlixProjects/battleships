import { IHull } from "./types";

export const ActionTypes = {
    DEPLOY: "deploy",
    ATTACK: "attack",
    SELECT_FLEET: "select_fleet",
    MOVE: "move",
} as const;

export type TActionTypes = (typeof ActionTypes)[keyof typeof ActionTypes];

export interface IAction {
    playerId: string;
    type: TActionTypes;
}

export interface IDeployAction extends IAction {
    type: typeof ActionTypes.DEPLOY;
    shipId: string;
    hullLocations: IHull[]; // locations where the ship's hull will be deployed
}