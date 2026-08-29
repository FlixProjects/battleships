import { IHull, IPlayer, IShip, TErrorMessages } from "..";

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
    errorCode?: TErrorMessages;
}

export interface IDeployResult extends IResult {
    type: typeof ResultType.SUCCESS;
    player: Partial<IPlayer>;
    ship: IShip;
    hulls: IHull[];
}

export interface IMoveResult extends IResult {
    type: typeof ResultType.SUCCESS;
    player: IPlayer;
    ship: IShip;
    hulls: IHull[];
}

export interface IAttackResult extends IResult {
    type: typeof ResultType.SUCCESS;
    players: IPlayer[];
    ships: IShip[];
    hulls: IHull[];
}
