import { Signal } from "./Signal";
import { IGameStateCreateEffectSignalPayload, SignalType } from "./types";

export class GameStateCreateEffectSignal extends Signal {
    public type: SignalType = SignalType.GameStateCreateEffect;
    public payload: IGameStateCreateEffectSignalPayload;
    constructor(props: Readonly<Partial<GameStateCreateEffectSignal>>) {
        super(props);
    }
}
