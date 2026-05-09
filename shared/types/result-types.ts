import { ICellLoc, IEffect, IHull, IPlayer, IShip, TErrorCode } from "..";

export const ResultType = {
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
} as const;

export type TResultTypes = (typeof ResultType)[keyof typeof ResultType];

export interface IResult {
    playerId: string;
    type: TResultTypes;
    message?: string;
}

export interface IErrorResult extends IResult {
    type: typeof ResultType.ERROR;
    errorCode?: TErrorCode;
}

export interface IDeployResult extends IResult {
    type: typeof ResultType.SUCCESS;
    player: Partial<IPlayer>;
    ship: IShip;
    hulls: IHull[];
}

export interface IGetValidDeployCellsResult extends IResult {
    validCells: ICellLoc[];
}

export interface IMoveResult extends IResult {
    type: typeof ResultType.SUCCESS;
    player: IPlayer;
    ship: IShip;
    hulls: IHull[];
}

export interface IGetValidMoveCellsResult extends IResult {
    validCells: ICellLoc[];
    origin: ICellLoc;
}

export interface IAttackResult extends IResult {
    type: typeof ResultType.SUCCESS;
    players: IPlayer[];
    ships: IShip[];
    hulls: IHull[];
}

export interface IPlaySupportResult extends IResult {
    type: typeof ResultType.SUCCESS;
    player: Partial<IPlayer>;
    /** Effects to be persisted in `gameState.effects` (one-shots are excluded). */
    effectsToAdd: IEffect[];
}

export interface IGetValidSupportCellsResult extends IResult {
    validCells: ICellLoc[];
    /** When the Effect's range is 0 (untargeted), validCells is empty and the
     *  caller renders a confirmation prompt instead. */
    requiresTarget: boolean;
}
