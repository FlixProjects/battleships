import { Signal } from "./Signal";
import { IDeckAddToPlayedSignalPayload, SignalType } from "./types";

export class DeckAddToPlayedSignal extends Signal {
    public type: SignalType = SignalType.DeckAddToPlayed;
    public payload: IDeckAddToPlayedSignalPayload;
    constructor(props: Readonly<Partial<DeckAddToPlayedSignal>>) {
        super(props);
    }
}
