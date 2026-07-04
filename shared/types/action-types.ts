import { ICellLoc, IHull } from "./types";

export const ActionTypes = {
    // player actions
    PLAY_CARD: "play_card",
    DEPLOY: "deploy",
    ATTACK: "attack",
    SELECT_FLEET: "select_fleet",
    MOVE: "move",
    SUPPORT: "support",
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
    location: ICellLoc; // anchor tile; the domain derives hull placements from the ship's templates
}

export interface IMoveAction extends IPlayerAction {
    type?: typeof ActionTypes.MOVE;
    shipId: string;
    targetCell: ICellLoc; // destination of the front hull; the domain derives the layout
    route?: ICellLoc[];
}

export interface IShipAttackAction extends IPlayerAction {
    type?: typeof ActionTypes.ATTACK;
    shipId: string;
    attackLocations: ICellLoc[];
}

export interface IPlaySupportAction extends IPlayerAction {
    type?: typeof ActionTypes.SUPPORT;
    cardId: string;
    supportRefNo: string;
    targetCell?: ICellLoc;
}

// ================= Play-Card Action =================
//
// PlayCardAction is the top-level submission; the inner action it triggers is
// determined by the Card's class (ShipCard → IDeployAction, etc). The server
// can replay history from a stream of Actions alone.

export interface IShipCardPayload {
    kind: "Ship";
    location: ICellLoc; // anchor tile for the deploy
}

export const LineOrientation = {
    Horizontal: "horizontal",
    Vertical: "vertical",
} as const;

export type TLineOrientation = (typeof LineOrientation)[keyof typeof LineOrientation];

export interface ISupportCardPayload {
    kind: "Support";
    targetCell?: ICellLoc;
    /** For line-targeted supports (Airstrike): which way the 3-tile line runs
     *  through `targetCell`. Ignored by single-tile supports. */
    orientation?: TLineOrientation;
}

export type TPlayCardPayload = IShipCardPayload | ISupportCardPayload;

export interface IPlayCardAction extends IPlayerAction {
    type?: typeof ActionTypes.PLAY_CARD;
    cardId: string;
    payload: TPlayCardPayload;
}

/**
 * Common metadata Card.buildAction needs to assemble a typed inner action
 * (id/order/round/playerId/cost). Mirrors IPlayerAction minus `type`.
 */
export type TActionMeta = Pick<IPlayerAction, "id" | "order" | "round" | "playerId" | "commandPointCost">;

export type TCommitDeployShipParams = Pick<IDeployAction, "shipId" | "location" | "commandPointCost">;
export type TCommitMoveShipParams = Pick<IMoveAction, "shipId" | "targetCell" | "route" | "commandPointCost">;
export type TCommitAttackShipParams = Pick<IShipAttackAction, "shipId" | "commandPointCost" | "attackLocations">;
