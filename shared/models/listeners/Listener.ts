import { v7 as uuidv7 } from "uuid";
import { ISignal, SignalType } from "../signals/types";
import { IListener } from "./types";
import { ISignalHandleCtx } from "@shared/types";

export class Listener implements IListener {
    public id: string = uuidv7();
    constructor(
        private validSignalTypes: SignalType[],
        private callback: (ctx: ISignalHandleCtx) => void,
    ) {}

    get signalTypes() {
        return this.validSignalTypes;
    }

    public handleSignal(ctx: ISignalHandleCtx) {
        if (this.validSignalTypes.includes(ctx.signal.type)) {
            this.callback(ctx);
        }
    }

    public overrideCallback(fn: (ctx: ISignalHandleCtx) => void) {
        this.callback = fn;
    }
}
