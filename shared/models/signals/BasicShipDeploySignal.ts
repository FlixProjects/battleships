import { Signal } from "./Signal";
import { IShipDeploySignalPayload, SignalType } from "./types";

export class BasicShipDeploySignal extends Signal {
    public type: SignalType = SignalType.BasicShipDeploy;
    public payload: IShipDeploySignalPayload;
    constructor(props: Readonly<Partial<BasicShipDeploySignal>>) {
        super(props);
    }
}
