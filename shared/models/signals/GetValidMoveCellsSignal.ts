import { Signal } from "./Signal";
import { IGetValidMoveCellsQueryPayload, SignalType } from "./types";

export class GetValidMoveCellsSignal extends Signal {
    public type: typeof SignalType.GetValidMoveCells = SignalType.GetValidMoveCells;
    public payload: IGetValidMoveCellsQueryPayload;
    constructor(props: Readonly<Partial<GetValidMoveCellsSignal>>) {
        super(props);
    }
}
