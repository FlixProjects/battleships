import { Signal } from "./Signal";
import { SignalType } from "./types";

export class GameRefillHandsSignal extends Signal {
    public type: SignalType = SignalType.GameRefillHands;
    constructor(props: Readonly<Partial<GameRefillHandsSignal>> = {}) {
        super(props);
    }
}
