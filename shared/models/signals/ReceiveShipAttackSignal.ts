import { Signal } from "./Signal";
import { IShipReceiveAttackSignalPayload, SignalType } from "./types";

export class ReceiveShipAttackSignal extends Signal {
    type: SignalType = SignalType.ReceiveShipAttack;
    constructor(public payload: IShipReceiveAttackSignalPayload) {
        super();
    }
}
