import { Signal } from "./Signal";
import { IGameCreateEffectSignalPayload, SignalType } from "./types";

export class GameCreateEffectSignal extends Signal {
    public type: SignalType = SignalType.GameCreateEffect;
    public payload: IGameCreateEffectSignalPayload;
    constructor(props: Readonly<Partial<GameCreateEffectSignal>>) {
        super(props);
    }
}
