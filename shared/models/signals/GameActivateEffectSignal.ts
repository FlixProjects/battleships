import { Signal } from "./Signal";
import { IGameActivateEffectSignalPayload, SignalType } from "./types";

export class GameActivateEffectSignal extends Signal {
    public type: SignalType = SignalType.GameActivateEffect;
    public payload: IGameActivateEffectSignalPayload;
    constructor(props: Readonly<Partial<GameActivateEffectSignal>>) {
        super(props);
    }
}
