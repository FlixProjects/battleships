import { Signal } from "./Signal";
import { SignalType } from "./types";

export class GameRemoveExpiredEffectsSignal extends Signal {
    public type: SignalType = SignalType.GameRemoveExpiredEffects;
    constructor(props: Readonly<Partial<GameRemoveExpiredEffectsSignal>> = {}) {
        super(props);
    }
}
