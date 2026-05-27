import { v7 as uuidv7 } from "uuid";
import { ISignalHandleCtx } from "@shared/types";
import { SignalType } from "../signals/types";
import { IListener, SignalCtxMap, TListenerCallback } from "./types";

export class Listener<T extends SignalType = SignalType> implements IListener<T> {
    public id: string = uuidv7();
    constructor(
        private validSignalTypes: T[],
        private callback: TListenerCallback<T>,
    ) {}

    get signalTypes() {
        return this.validSignalTypes;
    }

    public handleSignal(ctx: ISignalHandleCtx) {
        if (this.validSignalTypes.includes(ctx.signal.type as T)) {
            this.callback(ctx as SignalCtxMap[T]);
        }
    }

    public overrideCallback(fn: TListenerCallback<T>) {
        this.callback = fn;
    }
}
