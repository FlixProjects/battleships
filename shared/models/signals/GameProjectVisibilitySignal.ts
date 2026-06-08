import { Signal } from "./Signal";
import { IGameProjectVisibilitySignalPayload, SignalType } from "./types";

export class GameProjectVisibilitySignal extends Signal {
    public type: SignalType = SignalType.GameProjectVisibility;
    public payload: IGameProjectVisibilitySignalPayload;
    constructor(props: Readonly<Partial<GameProjectVisibilitySignal>>) {
        super(props);
    }
}
