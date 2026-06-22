import { Signal } from "./Signal";
import { IGetValidMoveRoutesQueryPayload, SignalType } from "./types";

export class GetValidMoveRoutesSignal extends Signal {
    public type: typeof SignalType.GetValidMoveRoutes = SignalType.GetValidMoveRoutes;
    public payload: IGetValidMoveRoutesQueryPayload;
    constructor(props: Readonly<Partial<GetValidMoveRoutesSignal>>) {
        super(props);
    }
}
