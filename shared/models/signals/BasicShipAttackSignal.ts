import { Signal } from "./Signal";
import { IShipAttackSignalPayload, SignalType } from "./types";

export class BasicShipAttackSignal extends Signal {
    public type: SignalType = SignalType.BasicShipAttack;
    public payload: IShipAttackSignalPayload;
    constructor(props: Readonly<Partial<BasicShipAttackSignal>>) {
        super(props);
    }
}
