import { Signal } from "./Signal";
import { IShipAttackSignalPayload, SignalType } from "./types";

export class BasicShipAttackSignal extends Signal {
    type: SignalType = SignalType.BasicShipAttack;
    constructor(public payload: IShipAttackSignalPayload) {
        super();
    }
}
