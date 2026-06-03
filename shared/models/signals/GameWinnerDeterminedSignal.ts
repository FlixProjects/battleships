import { Signal } from "./Signal";
import { SignalType } from "./types";

export class GameWinnerDeterminedSignal extends Signal {
    public type: SignalType = SignalType.GameWinnerDetermined;
    constructor(props: Readonly<Partial<GameWinnerDeterminedSignal>> = {}) {
        super(props);
    }
}
