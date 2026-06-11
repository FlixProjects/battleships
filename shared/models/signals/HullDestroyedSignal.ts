import { Signal } from "./Signal";
import { IHullDestroyedSignalPayload, SignalType } from "./types";

export class HullDestroyedSignal extends Signal {
    public type: SignalType = SignalType.HullDestroyed;
    public payload: IHullDestroyedSignalPayload;
    constructor(props: Readonly<Partial<HullDestroyedSignal>>) {
        super(props);
    }
}
