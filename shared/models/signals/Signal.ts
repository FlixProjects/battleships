import { v7 as uuidv7 } from "uuid";
import { ISignal, SignalType } from "./types";

export class Signal implements ISignal {
    id: string = uuidv7();
    type: SignalType;
}
