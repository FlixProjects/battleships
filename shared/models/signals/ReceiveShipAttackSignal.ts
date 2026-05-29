import { Signal } from "./Signal";
import { IShipReceiveAttackSignalPayload, SignalType } from "./types";

export class ReceiveShipAttackSignal extends Signal {
    type: SignalType = SignalType.ReceiveShipAttack;
    public payload: IShipReceiveAttackSignalPayload;
    constructor(props: Readonly<Partial<ReceiveShipAttackSignal>>) {
        super(props);
    }
}
