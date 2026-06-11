import { Signal } from "./Signal";
import { IPlayerSpendCommandPointsSignalPayload, SignalType } from "./types";

export class PlayerSpendCommandPointsSignal extends Signal {
    public type: SignalType = SignalType.PlayerSpendCommandPoints;
    public payload: IPlayerSpendCommandPointsSignalPayload;
    constructor(props: Readonly<Partial<PlayerSpendCommandPointsSignal>>) {
        super(props);
    }
}
