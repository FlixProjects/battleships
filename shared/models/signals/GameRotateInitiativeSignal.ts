import { Signal } from "./Signal";
import { SignalType } from "./types";

export class GameRotateInitiativeSignal extends Signal {
    public type: SignalType = SignalType.GameRotateInitiative;
    constructor(props: Readonly<Partial<GameRotateInitiativeSignal>> = {}) {
        super(props);
    }
}
