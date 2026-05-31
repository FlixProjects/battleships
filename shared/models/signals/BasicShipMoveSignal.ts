import { Signal } from "./Signal";
import { IShipMoveSignalPayload, SignalType } from "./types";

export class BasicShipMoveSignal extends Signal {
    public type: SignalType = SignalType.BasicShipMove;
    public payload: IShipMoveSignalPayload;
    constructor(props: Readonly<Partial<BasicShipMoveSignal>>) {
        super(props);
    }
}
