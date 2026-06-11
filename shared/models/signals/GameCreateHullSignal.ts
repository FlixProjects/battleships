import { Signal } from "./Signal";
import { IGameCreateHullSignalPayload, SignalType } from "./types";

export class GameCreateHullSignal extends Signal {
    public type: SignalType = SignalType.GameCreateHull;
    public payload: IGameCreateHullSignalPayload;
    constructor(props: Readonly<Partial<GameCreateHullSignal>>) {
        super(props);
    }
}
