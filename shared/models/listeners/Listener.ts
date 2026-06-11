import { v7 as uuidv7 } from "uuid";
import { SignalType } from "../signals/types";
import { IListener, SignalCtxMap, TListenerCallback } from "./types";

export class Listener<T extends SignalType = SignalType> implements IListener<T> {
    public id: string = uuidv7();
    constructor(
        private validSignalTypes: T[],
        private callback: TListenerCallback<T>,
        private shouldHandleSignal: <T extends SignalType = SignalType>(ctx: SignalCtxMap[T]) => boolean = () => true,
    ) {}

    get signalTypes() {
        return this.validSignalTypes;
    }

    public handleSignal(ctx: SignalCtxMap[T]) {
        if (this.validSignalTypes.includes(ctx.signal.type as T) && this.shouldHandleSignal(ctx)) {
            this.callback(ctx as SignalCtxMap[T]);
        }
    }

    public overrideCallback(fn: TListenerCallback<T>) {
        this.callback = fn;
    }
}
