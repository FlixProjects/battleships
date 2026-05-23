import { v7 as uuidv7 } from "uuid";
import { ISignal, SignalType } from "../signals/types";
import { IListener } from "./types";
import { ISignalHandleCtx } from "@shared/types";

export class Listener implements IListener {
    public id: string = uuidv7();
    constructor(
        private validSignalTypes: SignalType[],
        private callback: (signal: ISignal, ctx: ISignalHandleCtx) => void,
    ) {}

    get signalTypes() {
        return this.validSignalTypes;
    }

    public handleSignal(signal: ISignal, ctx: ISignalHandleCtx) {
        if (this.validSignalTypes.includes(signal.type)) {
            this.callback(signal, ctx);
        }
    }

    public overrideCallback(fn: (signal: ISignal, ctx: ISignalHandleCtx) => void) {
        this.callback = fn;
    }
}
