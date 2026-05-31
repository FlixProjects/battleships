import { Signal } from "./Signal";
import { IGameStateCreateHullSignalPayload, SignalType } from "./types";

export class GameStateCreateHullSignal extends Signal {
    public type: SignalType = SignalType.GameStateCreateHull;
    public payload: IGameStateCreateHullSignalPayload;
    constructor(props: Readonly<Partial<GameStateCreateHullSignal>>) {
        super(props);
    }
}
