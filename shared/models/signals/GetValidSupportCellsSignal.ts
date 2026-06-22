import { Signal } from "./Signal";
import { IGetValidSupportCellsQueryPayload, SignalType } from "./types";

export class GetValidSupportCellsSignal extends Signal {
    public type: typeof SignalType.GetValidSupportCells = SignalType.GetValidSupportCells;
    public payload: IGetValidSupportCellsQueryPayload;
    constructor(props: Readonly<Partial<GetValidSupportCellsSignal>>) {
        super(props);
    }
}
