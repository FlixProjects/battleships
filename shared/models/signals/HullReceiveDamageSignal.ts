import { Signal } from "./Signal";
import { IHullReceiveDamageSignalPayload, SignalType } from "./types";

export class HullReceiveDamageSignal extends Signal {
    public type: SignalType = SignalType.HullReceiveDamage;
    public payload: IHullReceiveDamageSignalPayload;
    constructor(props: Readonly<Partial<HullReceiveDamageSignal>>) {
        super(props);
    }
}
