import { Signal } from "./Signal";
import { SignalType } from "./types";

export class GamePersistentEffectsTickSignal extends Signal {
    public type: SignalType = SignalType.GamePersistentEffectsTick;
    constructor(props: Readonly<Partial<GamePersistentEffectsTickSignal>> = {}) {
        super(props);
    }
}
