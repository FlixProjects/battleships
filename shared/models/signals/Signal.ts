import { v7 as uuidv7 } from "uuid";
import { ISignal, ISignalPayload, SignalType } from "./types";

export class Signal implements ISignal {
    public id: string = uuidv7();
    public type: SignalType;
    public senderId: string;
    public targetId?: string;
    public payload?: ISignalPayload;
}
