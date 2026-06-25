import { Signal } from "./Signal";
import { IPlayerGainCommandPointsSignalPayload, SignalType } from "./types";

export class PlayerGainCommandPointsSignal extends Signal {
    public type: SignalType = SignalType.PlayerGainCommandPoints;
    public payload: IPlayerGainCommandPointsSignalPayload;
    constructor(props: Readonly<Partial<PlayerGainCommandPointsSignal>>) {
        super(props);
    }
}
