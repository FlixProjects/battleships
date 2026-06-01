import { Signal } from "./Signal";
import { IPlayCardSignalPayload, SignalType } from "./types";

export class PlayCardSignal extends Signal {
    public type: SignalType = SignalType.PlayCard;
    public payload: IPlayCardSignalPayload;
    constructor(props: Readonly<Partial<PlayCardSignal>>) {
        super(props);
    }
}
