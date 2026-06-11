import { v7 as uuidv7 } from "uuid";
import { ISignal, ISignalPayload, SignalType } from "./types";

export class Signal implements ISignal {
    public id: string = uuidv7();
    public type: SignalType;
    public senderId: string; // GameObjectId of sender of the signal
    public targetId?: string; // GameObjectId of receiver of the signal
    public originId: string; // origin of signal stack, originId === id -> first of stack
    public payload?: ISignalPayload;
    constructor(props: Readonly<Partial<Signal>>) {
        Object.assign(this, props);
        if (!this.originId) {
            this.originId = this.id;
        }
    }
}
