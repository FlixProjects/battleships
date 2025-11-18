import { Player } from "..";

export const ResultType = {
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
} as const;

export type TResultTypes = (typeof ResultType)[keyof typeof ResultType];

export interface IResult {
    playerId: string;
    type: TResultTypes;
}

export interface IDeployResult extends IResult {
    player: Player;
}
