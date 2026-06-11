import { Signal } from "./Signal";
import { IGameRemoveSubmissionCommandPointsSignalPayload, SignalType } from "./types";

export class GameRemoveSubmissionCommandPointsSignal extends Signal {
    public type: SignalType = SignalType.GameRemoveSubmissionCommandPoints;
    public payload: IGameRemoveSubmissionCommandPointsSignalPayload;
    constructor(props: Readonly<Partial<GameRemoveSubmissionCommandPointsSignal>>) {
        super(props);
    }
}
