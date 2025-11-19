import { ICellLoc, Player } from "..";

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

export interface IErrorResult<T> extends IResult {
    type: typeof ResultType.ERROR;
    error?: T;
}

export interface IDeployResult extends IResult {
    type: typeof ResultType.SUCCESS;
    player: Player;
}

export interface IGetValidDeployCellsResult extends IResult {
    validCells: ICellLoc[];
}

export interface IMoveResult extends IResult {
    type: typeof ResultType.SUCCESS;
    player: Player;
}

export interface IGetValidMoveCellsResult extends IResult {
    validCells: ICellLoc[];
    origin?: ICellLoc;
}