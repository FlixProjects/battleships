import { Signal } from "./Signal";
import { IGetValidAttackCellsQueryPayload, SignalType } from "./types";

export class GetValidAttackCellsSignal extends Signal {
    public type: typeof SignalType.GetValidAttackCells = SignalType.GetValidAttackCells;
    public payload: IGetValidAttackCellsQueryPayload;
    constructor(props: Readonly<Partial<GetValidAttackCellsSignal>>) {
        super(props);
    }
}
