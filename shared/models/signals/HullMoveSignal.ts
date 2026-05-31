import { Signal } from "./Signal";
import { IHullMoveSignalPayload, SignalType } from "./types";

export class HullMoveSignal extends Signal {
    public type: SignalType = SignalType.HullMove;
    public payload: IHullMoveSignalPayload;
    constructor(props: Readonly<Partial<HullMoveSignal>>) {
        super(props);
    }
}
