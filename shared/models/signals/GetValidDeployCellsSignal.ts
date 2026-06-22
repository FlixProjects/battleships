import { Signal } from "./Signal";
import { IGetValidDeployCellsQueryPayload, SignalType } from "./types";

export class GetValidDeployCellsSignal extends Signal {
    public type: typeof SignalType.GetValidDeployCells = SignalType.GetValidDeployCells;
    public payload: IGetValidDeployCellsQueryPayload;
    constructor(props: Readonly<Partial<GetValidDeployCellsSignal>>) {
        super(props);
    }
}
