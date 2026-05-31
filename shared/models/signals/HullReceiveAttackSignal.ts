import { Signal } from "./Signal";
import { IHullReceiveAttackSignalPayload, SignalType } from "./types";

export class HullReceiveAttackSignal extends Signal {
    public type: SignalType = SignalType.HullReceiveAttack;
    public payload: IHullReceiveAttackSignalPayload;
    constructor(props: Readonly<Partial<HullReceiveAttackSignal>>) {
        super(props);
    }
}
