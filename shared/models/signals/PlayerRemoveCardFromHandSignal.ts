import { Signal } from "./Signal";
import { IPlayerRemoveCardFromHandSignalPayload, SignalType } from "./types";

export class PlayerRemoveCardFromHandSignal extends Signal {
    public type: SignalType = SignalType.PlayerRemoveCardFromHand;
    public payload: IPlayerRemoveCardFromHandSignalPayload;
    constructor(props: Readonly<Partial<PlayerRemoveCardFromHandSignal>>) {
        super(props);
    }
}
