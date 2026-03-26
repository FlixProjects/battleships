import { IAction, IPlayerAction, TActionTypes } from "../../types";
import { Entity } from "./Entity";

export class ActionEntity extends Entity<ActionEntity> implements IAction {
    id: string;
    order: number;
    round: number;
    playerId: string;
    commandPointCost: number;
    type?: TActionTypes;

    constructor(props: Readonly<IPlayerAction>) {
        super();
        Object.assign(this, props);
    }
}
