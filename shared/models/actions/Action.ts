import { IPlayerAction, TActionTypes } from "../../types";
import { Entity } from "../entities";

export class Action extends Entity<Action> implements IPlayerAction {
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
