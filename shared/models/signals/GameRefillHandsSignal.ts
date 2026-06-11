import { Signal } from "./Signal";
import { IGameRefillHandsSignalPayload, SignalType } from "./types";

export class GameRefillHandsSignal extends Signal {
    public type: SignalType = SignalType.GameRefillHands;
    public payload: IGameRefillHandsSignalPayload;
    constructor(props: Readonly<Partial<GameRefillHandsSignal>>) {
        super(props);
    }
}
